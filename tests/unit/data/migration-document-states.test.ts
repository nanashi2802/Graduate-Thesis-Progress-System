// D-28: migration 0012 moves live rows out of the removed document states and keeps old history (INV-08).
// The seed uses plain SQL with the columns of migration 0011, so later migrations do not break this test.
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterEach, describe, expect, it } from "vitest";
import * as s from "@/server/data/schema";

const TAG = "0012_document_verify_or_return";
let dirs: string[] = [];

afterEach(() => {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
  dirs = [];
});

/** A copy of db/migrations whose journal stops before the migration under test. */
function migrationsBefore(tag: string): string {
  const dir = mkdtempSync(join(tmpdir(), "migrations-"));
  dirs.push(dir);
  cpSync("db/migrations", dir, { recursive: true });
  const path = join(dir, "meta", "_journal.json");
  const journal = JSON.parse(readFileSync(path, "utf8")) as { entries: { tag: string }[] };
  const stop = journal.entries.findIndex((e) => e.tag === tag);
  expect(stop, `the migration ${tag} must exist`).toBeGreaterThan(0);
  journal.entries = journal.entries.slice(0, stop);
  writeFileSync(path, JSON.stringify(journal));
  return dir;
}

type Event = { from_state: string; to_state: string; reason: string | null; actor_user_id: string };

describe("migration 0012: Verify or Return only (D-28, INV-08)", () => {
  it("moves live rows to the new states and keeps the old history rows", async () => {
    const client = new PGlite();
    const pg = drizzle({ client, schema: s });
    await migrate(pg, { migrationsFolder: migrationsBefore(TAG) });

    const one = async <T,>(q: string, params: unknown[] = []) => (await client.query<T>(q, params)).rows[0]!;
    const user = (role: string, n: number) =>
      one<{ id: string }>(`insert into app.app_user (full_name, email, role) values ($1, $2, $3) returning id`, [`Fake ${role}`, `m12.${role}.${n}@example.test`, role]);
    const coordinator = await user("coordinator", 1);
    const student = await user("student", 2);
    const adviser = await user("adviser", 3);
    const thesis = await one<{ id: string }>(
      `insert into app.thesis_instance (student_user_id, adviser_user_id, degree_level, program_start_term, writing1_course, created_by_user_id)
       values ($1, $2, 'masters', '2025-1', 'RSH_641', $3) returning id`,
      [student.id, adviser.id, coordinator.id],
    );
    const version = await one<{ id: string }>(
      `select v.id from app.template_version v join app.milestone_template t on t.id = v.milestone_template_id where t.code = 'proposal' order by v.version_no limit 1`,
    );
    const milestone = await one<{ id: string }>(
      `insert into app.milestone_instance (thesis_instance_id, template_version_id, milestone_code) values ($1, $2, 'proposal') returning id`,
      [thesis.id, version.id],
    );
    const seed = async (state: "physical_received" | "mismatch") => {
      const rec = await one<{ id: string }>(
        `insert into app.document_record (milestone_instance_id, form_code, state) values ($1, 'TDW_06', $2) returning id`,
        [milestone.id, state],
      );
      await client.query(
        `insert into app.document_event (document_record_id, from_state, to_state, reason, actor_user_id) values ($1, 'locked_as_submitted', $2, $3, $4)`,
        [rec.id, state, state === "mismatch" ? "The paper copy does not match." : null, coordinator.id],
      );
      return rec.id;
    };
    const received = await seed("physical_received");
    const mismatched = await seed("mismatch");

    await migrate(pg, { migrationsFolder: "db/migrations" });

    const stateOf = async (id: string) => (await one<{ state: string }>(`select state from app.document_record where id = $1`, [id])).state;
    const eventsOf = async (id: string) =>
      (await client.query<Event>(`select from_state, to_state, reason, actor_user_id from app.document_event where document_record_id = $1 order by id`, [id])).rows;

    expect(await stateOf(received)).toBe("locked_as_submitted");
    expect(await stateOf(mismatched)).toBe("returned");

    const mEvents = await eventsOf(mismatched);
    expect(mEvents).toHaveLength(2);
    expect(mEvents[0]).toMatchObject({ to_state: "mismatch", reason: "The paper copy does not match." });
    expect(mEvents.at(-1)).toEqual({
      from_state: "mismatch",
      to_state: "returned",
      reason: "A paper mismatch is now a Return (D-28).",
      actor_user_id: coordinator.id,
    });

    const rEvents = await eventsOf(received);
    expect(rEvents).toHaveLength(2);
    expect(rEvents[0]).toMatchObject({ to_state: "physical_received" });
    expect(rEvents.at(-1)).toEqual({
      from_state: "physical_received",
      to_state: "locked_as_submitted",
      reason: "The Physical received state is removed (D-28).",
      actor_user_id: coordinator.id,
    });

    await client.close();
  });
});
