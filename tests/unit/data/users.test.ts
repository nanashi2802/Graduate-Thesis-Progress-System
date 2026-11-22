// P0-E02-T03: the data layer checks access on each read (NFR-01, FR-ACC-03, FR-ACC-06, ERD §8).
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AccessDeniedError, type Actor } from "@/server/data/access";
import type { Db } from "@/server/data/db";
import { appUser } from "@/server/data/schema";
import { getUser } from "@/server/data/users";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let close: () => Promise<void>;
let coordinator: Actor;
let student: Actor;
let otherStudentId: string;

beforeAll(async () => {
  ({ db, close } = await makeTestDb());
  const rows = await db
    .insert(appUser)
    .values([
      { fullName: "Fake Coordinator", email: "coordinator@example.test", role: "coordinator" },
      { fullName: "Fake Student A", email: "student.a@example.test", role: "student" },
      { fullName: "Fake Student B", email: "student.b@example.test", role: "student" },
    ])
    .returning();
  const [c, a, b] = rows;
  coordinator = { userId: c!.id, role: "coordinator", isActive: true };
  student = { userId: a!.id, role: "student", isActive: true };
  otherStudentId = b!.id;
});

afterAll(async () => {
  await close();
});

describe("getUser", () => {
  it("lets the Coordinator read any account", async () => {
    const row = await getUser({ db, actor: coordinator }, otherStudentId);
    expect(row?.email).toBe("student.b@example.test");
  });

  it("lets a user read their own account", async () => {
    const row = await getUser({ db, actor: student }, student.userId);
    expect(row?.role).toBe("student");
  });

  it("denies a user the account of another user", async () => {
    await expect(getUser({ db, actor: student }, otherStudentId)).rejects.toThrow(AccessDeniedError);
  });

  it("denies a deactivated account every read", async () => {
    const inactive = { ...coordinator, isActive: false };
    await expect(getUser({ db, actor: inactive }, otherStudentId)).rejects.toThrow(AccessDeniedError);
  });
});

describe("app_user table (migration 0000)", () => {
  it("rejects an email with capital letters", async () => {
    await expect(
      db.insert(appUser).values({ fullName: "X", email: "Upper@example.test", role: "adviser" }),
    ).rejects.toThrow();
  });

  it("rejects a role outside the user_role enum (BR-03)", async () => {
    await expect(
      // @ts-expect-error: "admin" is not a role (AGENTS.md §8)
      db.insert(appUser).values({ fullName: "X", email: "x@example.test", role: "admin" }),
    ).rejects.toThrow();
  });
});
