// P1-E02-T03: the audit insert (NFR-03, INV-08, BR-19, AD-A-014).
import { beforeEach, describe, expect, it } from "vitest";
import { AccessDeniedError, type Actor } from "@/server/data/access";
import { AuditDetailError, recordAudit } from "@/server/data/audit";
import type { Db } from "@/server/data/db";
import * as s from "@/server/data/schema";
import { makeThesisChain } from "../../support/fixtures";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let c: Awaited<ReturnType<typeof makeThesisChain>>;
let coordinator: Actor;

beforeEach(async () => {
  ({ db } = await makeTestDb());
  c = await makeThesisChain(db);
  coordinator = { userId: c.coordinator.id, role: "coordinator", isActive: true };
});

describe("recordAudit", () => {
  it("records the actor, the role, the action and the target", async () => {
    await recordAudit({ db, actor: coordinator }, {
      action: "thesis.create",
      targetTable: "thesis_instance",
      targetId: c.thesis.id,
      detail: { degreeLevel: "masters", count: 1, flag: true, none: null },
    });
    const [row] = await db.select().from(s.auditRecord);
    expect(row).toMatchObject({
      actorUserId: c.coordinator.id,
      actorRole: "coordinator",
      action: "thesis.create",
      targetTable: "thesis_instance",
      targetId: c.thesis.id,
      detail: { degreeLevel: "masters", count: 1, flag: true, none: null },
    });
  });

  it("refuses long text and nested values in detail (AD-A-014)", async () => {
    const ctx = { db, actor: coordinator };
    const base = { action: "x", targetTable: "thesis_instance" };
    await expect(recordAudit(ctx, { ...base, detail: { body: "a".repeat(201) } })).rejects.toThrow(AuditDetailError);
    await expect(
      recordAudit(ctx, { ...base, detail: { nested: { a: 1 } } as unknown as Record<string, string> }),
    ).rejects.toThrow(AuditDetailError);
    expect(await db.select().from(s.auditRecord)).toHaveLength(0);
  });

  it("denies a deactivated actor", async () => {
    await expect(
      recordAudit({ db, actor: { ...coordinator, isActive: false } }, { action: "x", targetTable: "t" }),
    ).rejects.toThrow(AccessDeniedError);
  });

  it("commits with the write, and a failed write leaves no audit row", async () => {
    await expect(
      db.transaction(async (tx) => {
        await recordAudit({ db: tx, actor: coordinator }, { action: "x", targetTable: "thesis_instance" });
        throw new Error("the write failed");
      }),
    ).rejects.toThrow("the write failed");
    expect(await db.select().from(s.auditRecord)).toHaveLength(0);
  });
});
