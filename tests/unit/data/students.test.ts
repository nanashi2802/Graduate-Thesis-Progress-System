// P1-E03-T03: a Student account with its Thesis Instance and Milestone 1
// (FR-ACC-04, FR-ACC-07, BR-03, INV-02, INV-04).
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccessDeniedError, type Actor } from "@/server/data/access";
import { DuplicateEmailError } from "@/server/data/accounts";
import { InputProblem } from "@/server/data/coordinator";
import type { Db } from "@/server/data/db";
import * as s from "@/server/data/schema";
import { createStudent, listStudents, type NewStudent } from "@/server/data/students";
import { latestVersionId } from "@/server/data/templates";
import { makeUser } from "../../support/fixtures";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let coordinator: Actor;
let adviserId: string;
const fakeAuth = vi.fn(async () => ({ authUserId: `auth-${crypto.randomUUID()}` }));

beforeEach(async () => {
  ({ db } = await makeTestDb());
  const c = await makeUser(db, "coordinator");
  coordinator = { userId: c.id, role: "coordinator", isActive: true };
  adviserId = (await makeUser(db, "adviser")).id;
  fakeAuth.mockClear();
});

const student = (over: Partial<NewStudent> = {}): NewStudent => ({
  fullName: "Fake Student",
  email: "Fake.Student@Example.test",
  degreeLevel: "masters",
  programStartTerm: "2025-1",
  comprehensiveExamDate: "2026-06-01",
  writing1Course: "RSH_641",
  adviserUserId: adviserId,
  ...over,
});

describe("createStudent", () => {
  it("sends the set-password link to the new student (FR-ACC-08, INV-30)", async () => {
    const sendSetLink = vi.fn(async () => {});
    await createStudent({ db, actor: coordinator }, student(), fakeAuth, undefined, { sendSetLink });
    expect(sendSetLink).toHaveBeenCalledWith("fake.student@example.test");
  });

  it("makes the account, the thesis, Milestone 1 on the latest Proposal version, and one audit record", async () => {
    const res = await createStudent({ db, actor: coordinator }, student(), fakeAuth);
    const [user] = await db.select().from(s.appUser).where(eq(s.appUser.id, res.userId));
    expect(user).toMatchObject({ role: "student", email: "fake.student@example.test" });
    const [thesis] = await db.select().from(s.thesisInstance);
    expect(thesis).toMatchObject({ id: res.thesisId, adviserUserId: adviserId, createdByUserId: coordinator.userId });
    const [m] = await db.select().from(s.milestoneInstance);
    expect(m).toMatchObject({ milestoneCode: "proposal", status: "DRAFT", templateVersionId: await latestVersionId(db, "proposal") });
    expect(await db.select().from(s.auditRecord)).toHaveLength(1);
    const list = await listStudents({ db, actor: coordinator });
    expect(list).toHaveLength(1);
    expect(list[0]!.milestones).toHaveLength(1);
  });

  it("refuses a non-Adviser or a deactivated Adviser before it makes a Neon Auth user (FR-ACC-07)", async () => {
    const panel = await makeUser(db, "panel_member");
    await expect(createStudent({ db, actor: coordinator }, student({ adviserUserId: panel.id }), fakeAuth)).rejects.toThrow(
      InputProblem,
    );
    const inactive = await makeUser(db, "adviser");
    await db.update(s.appUser).set({ isActive: false }).where(eq(s.appUser.id, inactive.id));
    await expect(
      createStudent({ db, actor: coordinator }, student({ adviserUserId: inactive.id }), fakeAuth),
    ).rejects.toThrow(/deactivated/);
    expect(fakeAuth).not.toHaveBeenCalled();
  });

  it("refuses a duplicate email and bad input", async () => {
    await createStudent({ db, actor: coordinator }, student(), fakeAuth);
    await expect(createStudent({ db, actor: coordinator }, student(), fakeAuth)).rejects.toThrow(DuplicateEmailError);
    await expect(
      createStudent({ db, actor: coordinator }, student({ email: "b@example.test", comprehensiveExamDate: "June" }), fakeAuth),
    ).rejects.toThrow(InputProblem);
  });

  it("leaves no rows when a write in the transaction fails", async () => {
    const auth = vi.fn(async () => ({ authUserId: "auth-same" }));
    await createStudent({ db, actor: coordinator }, student(), auth);
    // The same Neon Auth id breaks the unique key on the second account.
    await expect(createStudent({ db, actor: coordinator }, student({ email: "two@example.test" }), auth)).rejects.toThrow();
    expect(await db.select().from(s.thesisInstance)).toHaveLength(1);
    expect(await db.select().from(s.milestoneInstance)).toHaveLength(1);
  });

  it("denies every role except the Coordinator", async () => {
    const adviser: Actor = { userId: adviserId, role: "adviser", isActive: true };
    await expect(createStudent({ db, actor: adviser }, student(), fakeAuth)).rejects.toThrow(AccessDeniedError);
    await expect(listStudents({ db, actor: adviser })).rejects.toThrow(AccessDeniedError);
  });
});
