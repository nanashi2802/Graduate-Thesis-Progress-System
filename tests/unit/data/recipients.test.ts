// P1-E12-T02 (wiring part): recipient tokens to users, and the safe emit call (FR-NTF-01, INV-30, NFR-01, NFR-05).
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccessDeniedError, type Actor } from "@/server/data/access";
import type { Db } from "@/server/data/db";
import { listMyNotifications } from "@/server/data/notifications";
import { emitEvent, emitSafely, resolveRecipients } from "@/server/data/recipients";
import * as s from "@/server/data/schema";
import { seedMilestone1 } from "../../support/seed-m1";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let seed: Awaited<ReturnType<typeof seedMilestone1>>;
const actorOf = (u: { id: string; role: s.UserRole }): Actor => ({ userId: u.id, role: u.role, isActive: true });
const as = (u: { id: string; role: s.UserRole }) => ({ db, actor: actorOf(u) });
const link = "https://app.test/x";

async function seatAccepted(userId: string, kind: "evaluation_committee" | "final_panel") {
  const [c] = await db.insert(s.committee).values({ thesisInstanceId: seed.thesis.id, kind }).onConflictDoNothing().returning();
  const committeeId = c?.id ?? (await db.select().from(s.committee)).find((x) => x.kind === kind)!.id;
  await db.insert(s.committeeMember).values({ committeeId, memberUserId: userId, status: "accepted" });
}

beforeEach(async () => {
  ({ db } = await makeTestDb());
  seed = await seedMilestone1(db);
});

describe("resolveRecipients", () => {
  it("turns the tokens of an event into the Student, the Adviser and the Coordinators", async () => {
    expect((await resolveRecipients(db, "C6", { thesisId: seed.thesis.id })).sort()).toEqual([seed.student.id, seed.coordinator.id].sort());
    expect(await resolveRecipients(db, "F1", { thesisId: seed.thesis.id })).toEqual([seed.adviser.id]);
  });

  it("gives the accepted members of the committee that fits the milestone", async () => {
    await seatAccepted(seed.panel[0]!.id, "evaluation_committee");
    await seatAccepted(seed.panel[1]!.id, "final_panel");
    const a2 = (c: "proposal" | "final") => resolveRecipients(db, "A2", { thesisId: seed.thesis.id, milestone: c });
    expect(await a2("proposal")).toEqual(expect.arrayContaining([seed.student.id, seed.adviser.id, seed.panel[0]!.id]));
    expect(await a2("proposal")).not.toContain(seed.panel[1]!.id);
    expect(await a2("final")).toContain(seed.panel[1]!.id);
    expect(await a2("final")).not.toContain(seed.panel[0]!.id);
  });

  it("leaves out a seat that is not accepted", async () => {
    const [c] = await db.insert(s.committee).values({ thesisInstanceId: seed.thesis.id, kind: "evaluation_committee" }).returning();
    await db.insert(s.committeeMember).values({ committeeId: c!.id, memberUserId: seed.panel[0]!.id, status: "declined" });
    expect(await resolveRecipients(db, "A2", { thesisId: seed.thesis.id })).not.toContain(seed.panel[0]!.id);
  });

  it("needs userIds for a named token, and skips an inactive Coordinator", async () => {
    await expect(resolveRecipients(db, "E1", { thesisId: seed.thesis.id })).rejects.toThrow("needs userIds");
    expect(await resolveRecipients(db, "E1", { thesisId: seed.thesis.id, userIds: [seed.student.id] })).toEqual([seed.student.id]);
    await db.update(s.appUser).set({ isActive: false }).where(eqId(seed.coordinator.id));
    expect(await resolveRecipients(db, "C6", { thesisId: seed.thesis.id })).toEqual([seed.student.id]);
  });
});

const eqId = (id: string) => eq(s.appUser.id, id);

describe("emitEvent and emitSafely", () => {
  it("never notifies the actor, and writes the in-app rows for the others", async () => {
    await emitEvent(as(seed.coordinator), "C6", { thesisId: seed.thesis.id }, { link }, null);
    expect(await listMyNotifications(as(seed.student))).toHaveLength(1);
    expect(await listMyNotifications(as(seed.coordinator))).toHaveLength(0);
  });

  it("refuses an actor who cannot read the thesis (NFR-01)", async () => {
    await expect(emitEvent(as(seed.panel[0]!), "C6", { thesisId: seed.thesis.id }, { link }, null)).rejects.toBeInstanceOf(AccessDeniedError);
  });

  it("never throws: a failed email keeps the row, and a refused or broken call is only logged (INV-30)", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const failMail = async () => {
      throw new Error("Resend returned HTTP 500");
    };
    await expect(emitSafely(as(seed.coordinator), "B3", { thesisId: seed.thesis.id }, { link }, failMail)).resolves.toBeUndefined();
    expect(await listMyNotifications(as(seed.student))).toHaveLength(1);
    await expect(emitSafely(as(seed.panel[0]!), "B3", { thesisId: seed.thesis.id }, { link }, null)).resolves.toBeUndefined();
    await expect(emitSafely(as(seed.coordinator), "E1", { thesisId: seed.thesis.id }, { link }, null)).resolves.toBeUndefined(); // No userIds.
    expect(log).toHaveBeenCalledTimes(2);
    expect(log.mock.calls.flat().join(" ")).not.toContain("example.test"); // No address in the log.
    log.mockRestore();
  });
});
