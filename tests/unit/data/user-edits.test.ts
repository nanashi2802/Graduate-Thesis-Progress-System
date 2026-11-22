// P1-E03-T04: Coordinator edits of users (FR-ACC-05, FR-ACC-06, BR-03, AD-A-016).
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { AccessDeniedError, type Actor } from "@/server/data/access";
import { DuplicateEmailError } from "@/server/data/accounts";
import { InputProblem } from "@/server/data/coordinator";
import type { Db } from "@/server/data/db";
import * as s from "@/server/data/schema";
import { listActiveUsers, listUsers, setUserActive, updateUser } from "@/server/data/users";
import { makeThesisChain, makeUser } from "../../support/fixtures";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let c: Awaited<ReturnType<typeof makeThesisChain>>;
let coordinator: Actor;

beforeEach(async () => {
  ({ db } = await makeTestDb());
  c = await makeThesisChain(db);
  coordinator = { userId: c.coordinator.id, role: "coordinator", isActive: true };
});

describe("updateUser", () => {
  it("changes the name and email with an audit record", async () => {
    const row = await updateUser({ db, actor: coordinator }, c.adviser.id, { fullName: "New Name", email: "New@Example.test" });
    expect(row).toMatchObject({ fullName: "New Name", email: "new@example.test" });
    const [audit] = await db.select().from(s.auditRecord);
    expect(audit).toMatchObject({ action: "user.update", targetId: c.adviser.id });
  });

  it("refuses an email that another account uses", async () => {
    await expect(updateUser({ db, actor: coordinator }, c.adviser.id, { email: c.student.email })).rejects.toThrow(
      DuplicateEmailError,
    );
  });

  it("changes the role of an account that no row names", async () => {
    const fresh = await makeUser(db, "adviser");
    const row = await updateUser({ db, actor: coordinator }, fresh.id, { role: "panel_member" });
    expect(row.role).toBe("panel_member");
  });

  it("refuses a role change for a user with a thesis or a seat (AD-A-016)", async () => {
    await expect(updateUser({ db, actor: coordinator }, c.adviser.id, { role: "panel_member" })).rejects.toThrow(/BR-03/);
    await expect(updateUser({ db, actor: coordinator }, c.student.id, { role: "adviser" })).rejects.toThrow(InputProblem);
    const member = await makeUser(db, "panel_member");
    const [com] = await db.insert(s.committee).values({ thesisInstanceId: c.thesis.id, kind: "evaluation_committee" }).returning();
    await db.insert(s.committeeMember).values({ committeeId: com!.id, memberUserId: member.id });
    await expect(updateUser({ db, actor: coordinator }, member.id, { role: "adviser" })).rejects.toThrow(InputProblem);
  });

  it("refuses a change of the Coordinator's own role", async () => {
    await expect(updateUser({ db, actor: coordinator }, coordinator.userId, { role: "adviser" })).rejects.toThrow(/own role/);
  });
});

describe("setUserActive", () => {
  it("deactivates and reactivates an account with audit records", async () => {
    await setUserActive({ db, actor: coordinator }, c.adviser.id, false);
    let [u] = await db.select().from(s.appUser).where(eq(s.appUser.id, c.adviser.id));
    expect(u!.isActive).toBe(false);
    expect(await listActiveUsers({ db, actor: coordinator }, "adviser")).toEqual([]);
    await setUserActive({ db, actor: coordinator }, c.adviser.id, true);
    [u] = await db.select().from(s.appUser).where(eq(s.appUser.id, c.adviser.id));
    expect(u!.isActive).toBe(true);
    expect((await db.select().from(s.auditRecord)).map((a) => a.action)).toEqual(["user.deactivate", "user.reactivate"]);
  });

  it("refuses to deactivate the Coordinator's own account", async () => {
    await expect(setUserActive({ db, actor: coordinator }, coordinator.userId, false)).rejects.toThrow(/own account/);
  });

  it("denies every role except the Coordinator", async () => {
    const adviser: Actor = { userId: c.adviser.id, role: "adviser", isActive: true };
    await expect(setUserActive({ db, actor: adviser }, c.student.id, false)).rejects.toThrow(AccessDeniedError);
    await expect(updateUser({ db, actor: adviser }, c.student.id, { fullName: "X" })).rejects.toThrow(AccessDeniedError);
    await expect(listUsers({ db, actor: adviser })).rejects.toThrow(AccessDeniedError);
  });
});
