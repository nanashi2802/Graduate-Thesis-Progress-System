// INV-08, FR-RPT-01, NFR-03: assert that an action wrote an audit record with actor, role, time and target.
import { expect } from "vitest";
import type { Db } from "@/server/data/db";
import * as s from "@/server/data/schema";

/** Run `action`, then check that it added a record of each kind in `kinds`. Returns the new records. */
export async function expectAudit(db: Db, kinds: string[], action: () => Promise<unknown>) {
  const before = new Set((await db.select().from(s.auditRecord)).map((r) => r.id));
  await action();
  const added = (await db.select().from(s.auditRecord)).filter((r) => !before.has(r.id));
  for (const kind of kinds) {
    const hit = added.filter((r) => r.action === kind);
    expect(hit.length, `audit record for ${kind}`).toBeGreaterThan(0);
    for (const r of hit) {
      expect(r.actorUserId).toBeTruthy();
      expect(r.actorRole).toBeTruthy();
      expect(r.createdAt).toBeInstanceOf(Date);
      expect(r.targetTable).toBeTruthy();
      expect(r.targetId).toBeTruthy();
    }
  }
  return added;
}
