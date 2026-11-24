// INV-08, FR-RPT-01, NFR-03: assert that each action kind wrote an audit record with actor, role, time and target.
import { expect } from "vitest";
import type { Db } from "@/server/data/db";
import * as s from "@/server/data/schema";

export async function expectAuditKinds(db: Db, kinds: string[]): Promise<void> {
  const rows = await db.select().from(s.auditRecord);
  for (const kind of kinds) {
    const hit = rows.filter((r) => r.action === kind);
    expect(hit.length, `audit record for ${kind}`).toBeGreaterThan(0);
    for (const r of hit) {
      expect(r.actorUserId).toBeTruthy();
      expect(r.actorRole).toBeTruthy();
      expect(r.createdAt).toBeInstanceOf(Date);
      expect(r.targetTable).toBeTruthy();
    }
  }
}
