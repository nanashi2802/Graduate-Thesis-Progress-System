// P1-E03-T03: a Student account with its Thesis Instance and Milestone 1
// (FR-ACC-04, FR-ACC-07, BR-03, INV-02, INV-04).
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccessDeniedError, type Actor } from "@/server/data/access";
import { DuplicateEmailError } from "@/server/data/accounts";
import { InputProblem } from "@/server/data/coordinator";
import type { Db } from "@/server/data/db";
import * as s from "@/server/data/schema";
import { createStudent, listStudents, updateThesisTitle, type NewStudent } from "@/server/data/students";
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
  title: "A federated learning framework",
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

  it("stores the working title at account creation (FR-ACC-04, D-24)", async () => {
    await createStudent({ db, actor: coordinator }, student({ title: "  A federated learning framework  " }), fakeAuth);
    const [thesis] = await db.select().from(s.thesisInstance);
    expect(thesis!.title).toBe("A federated learning framework");
  });

  it("refuses an empty title or one over 300 characters", async () => {
    for (const title of ["", "   ", "x".repeat(301)]) {
      await expect(createStudent({ db, actor: coordinator }, student({ title }), fakeAuth)).rejects.toThrow(
        "Write a thesis title of 1 to 300 characters.",
      );
    }
    expect(fakeAuth).not.toHaveBeenCalled();
    await createStudent({ db, actor: coordinator }, student({ title: "x".repeat(300) }), fakeAuth);
  });

  it("denies every role except the Coordinator", async () => {
    const adviser: Actor = { userId: adviserId, role: "adviser", isActive: true };
    await expect(createStudent({ db, actor: adviser }, student(), fakeAuth)).rejects.toThrow(AccessDeniedError);
    await expect(listStudents({ db, actor: adviser })).rejects.toThrow(AccessDeniedError);
  });
});

describe("updateThesisTitle (FR-ACC-09, BR-07, D-24)", () => {
  async function made() {
    const res = await createStudent({ db, actor: coordinator }, student(), fakeAuth);
    const me: Actor = { userId: res.userId, role: "student", isActive: true };
    return { ...res, me };
  }
  const titleOf = async (thesisId: string) =>
    (await db.select().from(s.thesisInstance).where(eq(s.thesisInstance.id, thesisId)))[0]!.title;

  it("lets the Student edit the title before Gate 1b, with an audit record", async () => {
    const t = await made();
    await updateThesisTitle({ db, actor: t.me }, { title: "  A better title  " });
    expect(await titleOf(t.thesisId)).toBe("A better title");
    const audit = await db.select().from(s.auditRecord).where(eq(s.auditRecord.action, "thesis.title"));
    expect(audit).toEqual([expect.objectContaining({ targetTable: "thesis_instance", targetId: t.thesisId, actorUserId: t.me.userId })]);
  });

  it("refuses an empty title or one over 300 characters", async () => {
    const t = await made();
    for (const title of [" ", "x".repeat(301)]) {
      await expect(updateThesisTitle({ db, actor: t.me }, { title })).rejects.toThrow("Write a thesis title of 1 to 300 characters.");
    }
    expect(await titleOf(t.thesisId)).toBe("A federated learning framework");
  });

  it("refuses the edit after the first Gate 1b", async () => {
    const t = await made();
    await db.insert(s.gateAction).values({ milestoneInstanceId: t.milestoneId, gate: "gate_1b", result: "endorsed", actorUserId: adviserId, actorRole: "adviser" });
    await expect(updateThesisTitle({ db, actor: t.me }, { title: "Too late" })).rejects.toThrow("The title is locked since Gate 1b.");
    expect(await titleOf(t.thesisId)).toBe("A federated learning framework");
  });

  it("still allows the edit after a Gate 1a only", async () => {
    const t = await made();
    await db.insert(s.gateAction).values({ milestoneInstanceId: t.milestoneId, gate: "gate_1a", result: "endorsed", actorUserId: adviserId, actorRole: "adviser" });
    await updateThesisTitle({ db, actor: t.me }, { title: "Still open" });
    expect(await titleOf(t.thesisId)).toBe("Still open");
  });

  it("refuses the edit by any role except the Student (NFR-01)", async () => {
    const t = await made();
    const adviser: Actor = { userId: adviserId, role: "adviser", isActive: true };
    await expect(updateThesisTitle({ db, actor: adviser }, { title: "x" })).rejects.toThrow(AccessDeniedError);
    await expect(updateThesisTitle({ db, actor: coordinator }, { title: "x" })).rejects.toThrow(AccessDeniedError);
    await expect(updateThesisTitle({ db, actor: { ...t.me, isActive: false } }, { title: "x" })).rejects.toThrow(AccessDeniedError);
    expect(await titleOf(t.thesisId)).toBe("A federated learning framework");
  });
});
