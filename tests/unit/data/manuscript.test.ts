// P1-E06: commits and threads, contexts A and B (FR-REV-01 to 08, BR-05 to BR-07, INV-05 to INV-07, INV-24, AD-A-019).
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AccessDeniedError, type Actor, type DataContext } from "@/server/data/access";
import type { Db } from "@/server/data/db";
import type { FilePort } from "@/server/data/documents";
import {
  commitReadLink,
  confirmCommitUpload,
  listThreads,
  markCommitReady,
  postThread,
  replyToThread,
  requestCommitUpload,
  resolveThread,
  submissionFor,
  workspaceFor,
} from "@/server/data/manuscript";
import * as s from "@/server/data/schema";
import { makeThesisChain, makeUser } from "../../support/fixtures";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let close: () => Promise<void>;
let stored = true;
let keyNo = 0;

beforeAll(async () => {
  ({ db, close } = await makeTestDb());
});
afterAll(() => close());

const files: FilePort = {
  createUploadLink: async (req) => ({ key: `agent-a/test/manuscript/${++keyNo}.pdf`, url: "https://store.test/put", headers: { "x-kind": req.kind } }),
  checkStoredFile: async () => stored,
};
const SHA = "a".repeat(64);
const upload = (i = 1) => ({ sha256: SHA, size: 1000, contentType: "application/pdf", key: `agent-a/test/manuscript/up-${i}-${crypto.randomUUID()}.pdf` });

const actorOf = (u: { id: string; role: s.UserRole }): Actor => ({ userId: u.id, role: u.role, isActive: true });
const as = (u: { id: string; role: s.UserRole }): DataContext => ({ db, actor: actorOf(u) });

async function setup() {
  const t = await makeThesisChain(db);
  const member = await makeUser(db, "panel_member");
  const [com] = await db.insert(s.committee).values({ thesisInstanceId: t.thesis.id, kind: "evaluation_committee" }).returning();
  await db.insert(s.committeeMember).values({ committeeId: com!.id, memberUserId: member.id, status: "accepted" });
  return { ...t, member, committee: com! };
}
const setStatus = (id: string, status: s.MilestoneStatusValue) => db.update(s.milestoneInstance).set({ status }).where(eq(s.milestoneInstance.id, id));

// BR-08, INV-24: the member reads the manuscript with a verified appointment form and a verified NDA.
async function giveAccess(t: Awaited<ReturnType<typeof setup>>) {
  const [item] = await db.select().from(s.templateRequiredItem).where(eq(s.templateRequiredItem.templateVersionId, t.version.id));
  const mk = async (form: s.FormCode, subject: string | null) =>
    (await db
      .insert(s.documentRecord)
      .values({ milestoneInstanceId: t.milestone.id, templateRequiredItemId: item!.id, formCode: form, subjectUserId: subject, state: "verified" })
      .returning())[0]!;
  const appointment = await mk("TDW_06", null);
  const nda = await mk("TDW_05", t.member.id);
  await db.update(s.committee).set({ appointmentDocumentId: appointment.id }).where(eq(s.committee.id, t.committee.id));
  await db.update(s.committeeMember).set({ ndaDocumentId: nda.id }).where(eq(s.committeeMember.committeeId, t.committee.id));
}

async function newCommit(t: Awaited<ReturnType<typeof setup>>, extra: Partial<Parameters<typeof confirmCommitUpload>[1]> = {}) {
  return confirmCommitUpload(as(t.student), { milestoneId: t.milestone.id, ...upload(), ...extra }, files);
}

describe("commits (FR-REV-02, INV-05, INV-06)", () => {
  it("gives the Student an upload link, then writes the next ordinal and clears the Ready mark", async () => {
    const t = await setup();
    const { link } = await requestCommitUpload(as(t.student), { milestoneId: t.milestone.id, sha256: SHA, size: 1000, contentType: "application/pdf" }, files);
    expect(link.key).toContain("manuscript/");
    await db.update(s.submissionPr).set({ readyCommitId: t.commit.id }).where(eq(s.submissionPr.id, t.pr.id));
    const c = await newCommit(t, { changeNote: "  Fixed chapter 1.  " });
    expect(c.ordinal).toBe(2);
    const { pr, commits } = await submissionFor(as(t.student), t.milestone.id);
    expect(pr.readyCommitId).toBeNull();
    expect(commits.map((x) => x.ordinal)).toEqual([1, 2]);
    expect(commits[1]!.changeNote).toBe("Fixed chapter 1.");
  });

  it("makes the Submission PR on first use (FR-REV-01)", async () => {
    const t = await setup();
    const [preTpl] = await db.select().from(s.milestoneTemplate).where(eq(s.milestoneTemplate.code, "pre_final"));
    const [v] = await db.select().from(s.templateVersion).where(eq(s.templateVersion.milestoneTemplateId, preTpl!.id));
    const [m2] = await db
      .insert(s.milestoneInstance)
      .values({ thesisInstanceId: t.thesis.id, templateVersionId: v!.id, milestoneCode: "pre_final" })
      .returning();
    const first = await submissionFor(as(t.student), m2!.id);
    const again = await submissionFor(as(t.student), m2!.id);
    expect(first.pr.milestoneInstanceId).toBe(m2!.id);
    expect(again.pr.id).toBe(first.pr.id);
    expect(first.commits).toHaveLength(0);
  });

  it("refuses a hash mismatch and a repeated key", async () => {
    const t = await setup();
    stored = false;
    await expect(newCommit(t)).rejects.toThrow(/hash/);
    stored = true;
    const input = upload();
    await confirmCommitUpload(as(t.student), { milestoneId: t.milestone.id, ...input }, files);
    await expect(confirmCommitUpload(as(t.student), { milestoneId: t.milestone.id, ...input }, files)).rejects.toThrow(/already used/);
  });

  it("refuses a file that is not a PDF, too large, or a bad key", async () => {
    const t = await setup();
    await expect(newCommit(t, { contentType: "image/png" })).rejects.toThrow();
    await expect(newCommit(t, { size: 60 * 1024 * 1024 })).rejects.toThrow();
    await expect(newCommit(t, { key: "scan/x.pdf" })).rejects.toThrow(/key/);
  });

  it("refuses an upload while the manuscript is locked (BR-07, INV-05)", async () => {
    const t = await setup();
    await db.update(s.submissionPr).set({ lockedAt: new Date() }).where(eq(s.submissionPr.id, t.pr.id));
    await expect(newCommit(t)).rejects.toThrow(/locked/);
    await expect(requestCommitUpload(as(t.student), { milestoneId: t.milestone.id, sha256: SHA, size: 10, contentType: "application/pdf" }, files)).rejects.toThrow(/locked/);
  });

  it("refuses an upload while the Adviser reviews a Ready commit", async () => {
    const t = await setup();
    await setStatus(t.milestone.id, "READY");
    await expect(newCommit(t)).rejects.toThrow(/Adviser/);
  });

  it("lets only the Student of the thesis upload (NFR-01)", async () => {
    const t = await setup();
    const stranger = await makeUser(db, "student");
    await expect(confirmCommitUpload(as(stranger), { milestoneId: t.milestone.id, ...upload() }, files)).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(confirmCommitUpload(as(t.adviser), { milestoneId: t.milestone.id, ...upload() }, files)).rejects.toBeInstanceOf(AccessDeniedError);
  });

  it("tags the threads a commit addresses, and does not change their state (FR-REV-08)", async () => {
    const t = await setup();
    const { threadId } = await postThread(as(t.adviser), { commitId: t.commit.id, body: "Add a limitation section." });
    await newCommit(t, { addressesThreadIds: [threadId] });
    const [view] = await listThreads(as(t.student), t.milestone.id);
    expect(view!.addressedByOrdinals).toEqual([2]);
    expect(view!.thread.state).toBe("OPEN");
    await expect(newCommit(t, { addressesThreadIds: [crypto.randomUUID()] })).rejects.toThrow(/tagged/);
  });
});

describe("markCommitReady (FR-REV-07)", () => {
  it("marks a commit of the PR and refuses another PR's commit, a locked PR and READY status", async () => {
    const t = await setup();
    await markCommitReady(as(t.student), t.milestone.id, t.commit.id);
    expect((await submissionFor(as(t.student), t.milestone.id)).pr.readyCommitId).toBe(t.commit.id);
    const other = await makeThesisChain(db);
    await expect(markCommitReady(as(t.student), t.milestone.id, other.commit.id)).rejects.toThrow(/not on your/);
    await expect(markCommitReady(as(t.adviser), t.milestone.id, t.commit.id)).rejects.toBeInstanceOf(AccessDeniedError);
    await setStatus(t.milestone.id, "READY");
    await expect(markCommitReady(as(t.student), t.milestone.id, t.commit.id)).rejects.toThrow();
    await setStatus(t.milestone.id, "DRAFT");
    await db.update(s.submissionPr).set({ lockedAt: new Date() }).where(eq(s.submissionPr.id, t.pr.id));
    await expect(markCommitReady(as(t.student), t.milestone.id, t.commit.id)).rejects.toThrow(/locked/);
  });
});

describe("thread page numbers (FR-REV-04, D-26)", () => {
  it("stores an optional page number on a thread", async () => {
    const t = await setup();
    const { threadId } = await postThread(as(t.adviser), { commitId: t.commit.id, body: "See the method.", page: 14 });
    expect((await listThreads(as(t.adviser), t.milestone.id)).find((v) => v.thread.id === threadId)?.thread.page).toBe(14);
  });

  it("stores no page when none is given", async () => {
    const t = await setup();
    const { threadId } = await postThread(as(t.adviser), { commitId: t.commit.id, body: "General point." });
    const second = await postThread(as(t.adviser), { commitId: t.commit.id, body: "Also general.", page: null });
    const views = await listThreads(as(t.adviser), t.milestone.id);
    expect(views.find((v) => v.thread.id === threadId)?.thread.page).toBeNull();
    expect(views.find((v) => v.thread.id === second.threadId)?.thread.page).toBeNull();
  });

  it("refuses a page below 1 or above 9999, or not a whole number", async () => {
    const t = await setup();
    for (const page of [0, -1, 10000, 2.5, Number.NaN]) {
      await expect(postThread(as(t.adviser), { commitId: t.commit.id, body: "x", page })).rejects.toThrow("Write a page number from 1 to 9999.");
    }
    expect(await listThreads(as(t.adviser), t.milestone.id)).toHaveLength(0);
  });

  it("refuses a page out of range in the database too", async () => {
    const t = await setup();
    const { threadId } = await postThread(as(t.adviser), { commitId: t.commit.id, body: "x", page: 1 });
    await expect(db.update(s.critiqueThread).set({ page: 0 }).where(eq(s.critiqueThread.id, threadId))).rejects.toThrow();
  });
});

describe("threads (FR-REV-04 to 06, BR-05, BR-06, INV-07)", () => {
  it("lets the Adviser post in context A and the Student reply", async () => {
    const t = await setup();
    const { threadId } = await postThread(as(t.adviser), { commitId: t.commit.id, body: "Clarify the aim." });
    await replyToThread(as(t.student), threadId, "Done in v2.");
    await replyToThread(as(t.adviser), threadId, "Thanks.");
    const [view] = await listThreads(as(t.student), t.milestone.id);
    expect(view!.thread.context).toBe("iteration");
    expect(view!.replies.map((r) => r.ordinal)).toEqual([1, 2]);
  });

  it("refuses a post by the Student, the Coordinator and an empty text", async () => {
    const t = await setup();
    await expect(postThread(as(t.student), { commitId: t.commit.id, body: "x" })).rejects.toThrow(/cannot post/);
    await expect(postThread(as(t.coordinator), { commitId: t.commit.id, body: "x" })).rejects.toThrow(/cannot post/);
    await expect(postThread(as(t.adviser), { commitId: t.commit.id, body: "   " })).rejects.toThrow(/first/);
  });

  it("lets only the author resolve, and a resolved thread takes no reply (INV-07, BR-05)", async () => {
    const t = await setup();
    const { threadId } = await postThread(as(t.adviser), { commitId: t.commit.id, body: "Fix refs." });
    await expect(resolveThread(as(t.student), threadId)).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(resolveThread(as(t.coordinator), threadId)).rejects.toBeInstanceOf(AccessDeniedError);
    await resolveThread(as(t.adviser), threadId);
    await expect(replyToThread(as(t.student), threadId, "ok")).rejects.toThrow(/resolved/);
    const [view] = await listThreads(as(t.adviser), t.milestone.id);
    expect(view!.thread.resolvedAt).not.toBeNull();
  });

  it("shows an Outdated badge on an open thread of an older commit only (BR-06, FR-REV-05)", async () => {
    const t = await setup();
    const a = await postThread(as(t.adviser), { commitId: t.commit.id, body: "One." });
    const b = await postThread(as(t.adviser), { commitId: t.commit.id, body: "Two." });
    await resolveThread(as(t.adviser), b.threadId);
    await newCommit(t);
    const views = await listThreads(as(t.adviser), t.milestone.id);
    expect(views.find((v) => v.thread.id === a.threadId)!.outdated).toBe(true);
    expect(views.find((v) => v.thread.id === b.threadId)!.outdated).toBe(false);
  });

  it("opens context B for an accepted Panel Member only before Gate 1b, with verified access (INV-24, BR-08)", async () => {
    const t = await setup();
    await setStatus(t.milestone.id, "COMMITTEE_APPOINTED");
    // No verified forms yet: no access.
    await expect(postThread(as(t.member), { commitId: t.commit.id, body: "Check method." })).rejects.toBeInstanceOf(AccessDeniedError);
    await giveAccess(t);
    const { threadId } = await postThread(as(t.member), { commitId: t.commit.id, body: "Check method." });
    const [view] = await listThreads(as(t.student), t.milestone.id);
    expect(view!.thread.context).toBe("committee_review");
    await replyToThread(as(t.student), threadId, "Will do.");
    await setStatus(t.milestone.id, "COMMITTEE_ENDORSED");
    await expect(postThread(as(t.member), { commitId: t.commit.id, body: "Late." })).rejects.toThrow(/cannot post/);
  });

  it("hides context A threads from a Panel Member and bars the member from replying to them (Unified §2.12)", async () => {
    const t = await setup();
    await giveAccess(t);
    const { threadId } = await postThread(as(t.adviser), { commitId: t.commit.id, body: "Private iteration." });
    await setStatus(t.milestone.id, "COMMITTEE_APPOINTED");
    expect(await listThreads(as(t.member), t.milestone.id)).toHaveLength(0);
    await expect(replyToThread(as(t.member), threadId, "hi")).rejects.toBeInstanceOf(AccessDeniedError);
  });

  it("gives a Panel Member no read of the manuscript without verified forms (INV-24)", async () => {
    const t = await setup();
    await expect(listThreads(as(t.member), t.milestone.id)).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(commitReadLink(as(t.member), t.commit.id, { createReadLink: async (k) => k })).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(commitReadLink(as(t.student), t.commit.id, { createReadLink: async (k) => `signed:${k}` })).resolves.toContain("signed:");
  });

  it("gives a stranger no access to the threads or commits (NFR-01)", async () => {
    const t = await setup();
    const stranger = await makeUser(db, "adviser");
    await expect(listThreads(as(stranger), t.milestone.id)).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(postThread(as(stranger), { commitId: t.commit.id, body: "x" })).rejects.toBeInstanceOf(AccessDeniedError);
  });
});

describe("events of the manuscript (C1, C2, C3, C4)", () => {
  const who = async (code: string, targetId: string) =>
    (await db.select().from(s.notification)).filter((n) => n.eventCode === code && n.targetId === targetId).map((n) => n.recipientUserId).sort();
  it("tells the right people after each commit, never the actor", async () => {
    const t = await setup();
    await markCommitReady(as(t.student), t.milestone.id, t.commit.id);
    expect(await who("C1", t.commit.id)).toEqual([t.adviser.id, t.member.id].sort());
    expect(await who("B7", t.commit.id)).toEqual([]); // B7 is a late-review reminder of the daily job (AS-05).
    const { threadId } = await postThread(as(t.adviser), { commitId: t.commit.id, body: "Clarify the aim." });
    expect(await who("C2", threadId)).toEqual([t.student.id]);
    await replyToThread(as(t.student), threadId, "Done.");
    expect(await who("C3", threadId)).toEqual([t.adviser.id]);
    await resolveThread(as(t.adviser), threadId);
    expect(await who("C4", threadId)).toEqual([t.student.id]);
  });
});

// Task R5.9 (UX-P-05, UX-030): the workspace names the thesis and the Student before a gate action. Read only, after
// the same access checks as the rest of the workspace.
describe("workspaceFor identity (R5.9)", () => {
  it("gives the thesis title and the Student name to the Student, the Adviser and a member with access", async () => {
    const t = await setup();
    await giveAccess(t);
    await db.update(s.thesisInstance).set({ title: "Edge scheduling for campus networks" }).where(eq(s.thesisInstance.id, t.thesis.id));
    const [student] = await db.select().from(s.appUser).where(eq(s.appUser.id, t.student.id));
    for (const who of [t.student, t.adviser, t.member]) {
      const ws = await workspaceFor(as(who), t.pr.id);
      expect(ws.identity).toEqual({ title: "Edge scheduling for campus networks", studentName: student!.fullName });
    }
  });

  it("gives a null title when the record has none", async () => {
    const t = await setup();
    const ws = await workspaceFor(as(t.adviser), t.pr.id);
    expect(ws.identity.title).toBeNull();
    expect(ws.identity.studentName.length).toBeGreaterThan(0);
  });

  it("refuses a member without access and another thesis's Adviser, so no identity leaks (NFR-01, BR-08)", async () => {
    const t = await setup();
    const other = await setup();
    await expect(workspaceFor(as(t.member), t.pr.id)).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(workspaceFor(as(other.adviser), t.pr.id)).rejects.toBeInstanceOf(AccessDeniedError);
  });
});
