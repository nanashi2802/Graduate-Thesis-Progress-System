// P0-E03: accounts come only from the Coordinator. Sign-in never makes one
// (FR-ACC-04, FR-ACC-05, FR-ACC-06, BR-03, D-23).
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccessDeniedError, type Actor } from "@/server/data/access";
import { createAccount } from "@/server/data/accounts";
import { resolveActor } from "@/server/data/actors";
import type { Db } from "@/server/data/db";
import { appUser } from "@/server/data/schema";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let coordinator: Actor;
const fakeAuth = vi.fn(async () => ({ authUserId: `auth-${crypto.randomUUID()}` }));

beforeEach(async () => {
  ({ db } = await makeTestDb());
  const [c] = await db
    .insert(appUser)
    .values({ fullName: "Fake Coordinator", email: "coordinator@example.test", role: "coordinator" })
    .returning();
  coordinator = { userId: c!.id, role: "coordinator", isActive: true };
  fakeAuth.mockClear();
});

describe("createAccount", () => {
  it("lets the Coordinator make an account with one role and a lower-case email", async () => {
    const row = await createAccount(
      { db, actor: coordinator },
      { fullName: "Fake Student", email: " Student.X@Example.test ", role: "student" },
      fakeAuth,
    );
    expect(row.email).toBe("student.x@example.test");
    expect(row.role).toBe("student");
    expect(row.authUserId).toMatch(/^auth-/);
    expect(fakeAuth).toHaveBeenCalledOnce();
  });

  it("denies every other role and makes no Neon Auth user", async () => {
    const adviser: Actor = { userId: coordinator.userId, role: "adviser", isActive: true };
    await expect(
      createAccount({ db, actor: adviser }, { fullName: "X", email: "x@example.test", role: "student" }, fakeAuth),
    ).rejects.toThrow(AccessDeniedError);
    expect(fakeAuth).not.toHaveBeenCalled();
  });

  it("denies a deactivated Coordinator", async () => {
    await expect(
      createAccount(
        { db, actor: { ...coordinator, isActive: false } },
        { fullName: "X", email: "x@example.test", role: "student" },
        fakeAuth,
      ),
    ).rejects.toThrow(AccessDeniedError);
  });
});

describe("resolveActor", () => {
  it("returns no actor for a Neon Auth user with no app account (D-23)", async () => {
    const actor = await resolveActor(db, { authUserId: "google-1", email: "stranger@example.test" });
    expect(actor).toBeNull();
    expect(await db.select().from(appUser)).toHaveLength(1);
  });

  it("links the account by email at the first sign-in, then by the Neon Auth id", async () => {
    const actor = await resolveActor(db, { authUserId: "auth-c", email: "Coordinator@example.test" });
    expect(actor).toEqual(coordinator);
    const [row] = await db.select().from(appUser);
    expect(row!.authUserId).toBe("auth-c");
    expect(await resolveActor(db, { authUserId: "auth-c", email: "changed@example.test" })).toEqual(coordinator);
  });

  it("does not take over an account that is linked to another Neon Auth user", async () => {
    await resolveActor(db, { authUserId: "auth-c", email: "coordinator@example.test" });
    expect(await resolveActor(db, { authUserId: "auth-other", email: "coordinator@example.test" })).toBeNull();
  });

  it("keeps a deactivated account inactive", async () => {
    await db.update(appUser).set({ isActive: false });
    const actor = await resolveActor(db, { authUserId: "auth-c", email: "coordinator@example.test" });
    expect(actor?.isActive).toBe(false);
  });
});
