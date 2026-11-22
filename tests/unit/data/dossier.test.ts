// P3-E05-T03: the dossier export (FR-DOC-10).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { Db } from "@/server/data/db";
import { exportDossier } from "@/server/data/dossier";
import { auditRecord, type UserRole } from "@/server/data/schema";
import { makeUser } from "../../support/fixtures";
import { actorOf, runMilestone1 } from "../../support/flow";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let close: () => Promise<void>;
beforeAll(async () => {
  ({ db, close } = await makeTestDb());
});
afterAll(() => close());
const as = (u: { id: string; role: UserRole }) => ({ db, actor: actorOf(u) });

describe("dossier export", () => {
  let f: Awaited<ReturnType<typeof runMilestone1>>;
  it("gives the Coordinator commits, scans, Minutes and logs with an index, and records the export", async () => {
    f = await runMilestone1(db);
    const d = await exportDossier(as(f.coordinator), f.thesisId);
    expect(d.index).toEqual({ commits: d.commits.length, scans: d.scans.length, minutes: d.minutes.length, consultationLogs: d.consultationLogs.length, logs: d.logs.length });
    expect(d.commits.length).toBeGreaterThan(0);
    expect(d.scans.length).toBeGreaterThan(0);
    expect(d.minutes[0]?.body).toContain("approved");
    expect(d.logs.length).toBeGreaterThan(0);
    expect(d.logs.some((l) => l.table === "committee")).toBe(true);
    expect(d.logs.some((l) => l.action.startsWith("thread.") || l.action.startsWith("log."))).toBe(true);
    const rows = await db.select().from(auditRecord).where(eq(auditRecord.targetId, f.thesisId));
    expect(rows.some((r) => r.action === "dossier.export")).toBe(true);
  });

  it("refuses every other role", async () => {
    for (const u of [f.student, f.adviser, f.lead, await makeUser(db, "student")])
      await expect(exportDossier(as(u), f.thesisId)).rejects.toThrow(/only the Coordinator/);
  });
});
