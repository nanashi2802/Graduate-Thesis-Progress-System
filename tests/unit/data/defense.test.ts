// P1-E09: defense date, schedule, sheets, verdict, Minutes and close (FR-DEF-01 to 12, BR-09 to BR-12, INV-12 to INV-16, AD-A-021).
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AccessDeniedError, type Actor, type DataContext } from "@/server/data/access";
import {
  attemptCount,
  checkPrintedCopies,
  closeDefense,
  confirmDefenseDate,
  confirmSheetUpload,
  defensePage,
  issueMinutes,
  listAttempts,
  markDefenseHeld,
  printedCopyStatus,
  proposeDefenseDate,
  recordPrintedCopies,
  recordVerdict,
  requestSheetUpload,
  saveSheet,
  verifySheet,
} from "@/server/data/defense";
import type { Db } from "@/server/data/db";
import type { FilePort } from "@/server/data/documents";
import { transitionMilestone } from "@/server/data/milestones";
import { setOutsideStatus } from "@/server/data/outside";
import * as s from "@/server/data/schema";
import { pstDate } from "@/server/notify/time";
import { makeThesisChain, makeUser } from "../../support/fixtures";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let close: () => Promise<void>;
let keyNo = 0;
const files: FilePort = {
  createUploadLink: async (req) => ({ key: `agent-a/test/scan/${++keyNo}.pdf`, url: "https://store.test/put", headers: { "x-kind": req.kind } }),
  checkStoredFile: async () => true,
};
beforeAll(async () => {
  ({ db, close } = await makeTestDb());
});
afterAll(() => close());

const actorOf = (u: { id: string; role: s.UserRole }): Actor => ({ userId: u.id, role: u.role, isActive: true });
const as = (u: { id: string; role: s.UserRole }): DataContext => ({ db, actor: actorOf(u) });
const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);
// The app counts days in Philippine Standard Time (AGENTS.md §10), so the test must too. A UTC date is one day behind from 00:00 to 08:00 PHT.
const isoDay = (n: number) => pstDate(daysAgo(n));
// 02:00 UTC is 10:00 in Philippine Standard Time on the same date.
const startOf = (iso: string) => new Date(`${iso}T02:00:00Z`);
const PROPOSED = isoDay(10);

// A Proposal milestone at COMMITTEE_ENDORSED: Gate 1b done 30 days ago, every document of the checklist in place.
async function setup(opts: { withChecklist?: boolean } = {}) {
  const t = await makeThesisChain(db);
  const lead = await makeUser(db, "panel_member");
  const chair = await makeUser(db, "panel_member");
  const [com] = await db.insert(s.committee).values({ thesisInstanceId: t.thesis.id, kind: "evaluation_committee" }).returning();
  const [item] = await db.select().from(s.templateRequiredItem).where(eq(s.templateRequiredItem.templateVersionId, t.version.id));
  const doc = async (formCode: s.FormCode, state: s.DocumentState, subject: string | null = null) =>
    (
      await db
        .insert(s.documentRecord)
        .values({ milestoneInstanceId: t.milestone.id, templateRequiredItemId: item!.id, formCode, subjectUserId: subject, state })
        .returning()
    )[0]!;
  const appointment = await doc("TDW_06", "verified");
  const ndaLead = await doc("TDW_05", "verified", lead.id);
  const ndaChair = await doc("TDW_05", "verified", chair.id);
  await db.update(s.committee).set({ appointmentDocumentId: appointment.id, appointedAt: daysAgo(40) }).where(eq(s.committee.id, com!.id));
  await db.insert(s.committeeMember).values([
    { committeeId: com!.id, memberUserId: lead.id, designation: "lead_panel_member", status: "accepted", ndaDocumentId: ndaLead.id },
    { committeeId: com!.id, memberUserId: chair.id, designation: "none", status: "accepted", ndaDocumentId: ndaChair.id },
  ]);
  await doc("TDW_03", "locked_as_submitted");
  await doc("TDW_07", "locked_as_submitted");
  if (opts.withChecklist !== false) await doc("OR", "verified");
  await setOutsideStatus(as(t.coordinator), t.milestone.id, "ethics", "APPROVED");
  await db.update(s.submissionPr).set({ readyCommitId: t.commit.id, lockedAt: daysAgo(30) }).where(eq(s.submissionPr.id, t.pr.id));
  await db.insert(s.gateAction).values(
    [t.adviser, lead, chair].map((u) => ({
      milestoneInstanceId: t.milestone.id,
      gate: "gate_1b" as const,
      result: "endorsed" as const,
      actorUserId: u.id,
      actorRole: u.role,
      commitId: t.commit.id,
      createdAt: daysAgo(30),
    })),
  );
  await db.update(s.milestoneInstance).set({ status: "COMMITTEE_ENDORSED" }).where(eq(s.milestoneInstance.id, t.milestone.id));
  return { ...t, lead, chair, committee: com! };
}
type World = Awaited<ReturnType<typeof setup>>;

const statusOf = async (id: string) => (await db.select().from(s.milestoneInstance).where(eq(s.milestoneInstance.id, id)))[0]!;
const attemptOf = async (milestoneId: string) => (await db.select().from(s.defenseAttempt).where(eq(s.defenseAttempt.milestoneInstanceId, milestoneId)));

async function scheduled(opts: { withChecklist?: boolean } = {}) {
  const w = await setup(opts);
  await proposeDefenseDate(as(w.student), w.milestone.id, PROPOSED);
  await confirmDefenseDate(as(w.coordinator), w.milestone.id, { startsAt: startOf(PROPOSED), roomOrLink: "Room 101" });
  const [attempt] = await attemptOf(w.milestone.id);
  return { ...w, attempt: attempt! };
}

async function perfectScores(w: World) {
  const rows = await db.select().from(s.rubricIndicator).where(eq(s.rubricIndicator.templateVersionId, w.version.id));
  return rows.map((r) => ({ indicatorId: r.id, score: r.weightPct }));
}
type Verdict = "approved" | "approved_with_revisions" | "disapproved";
const sheet = async (w: World, action: Verdict | null = "approved") => ({
  actionTaken: action,
  scores: await perfectScores(w),
  comments: [{ section: "general_observations" as const, body: "Good work." }],
});

async function verifyAll(w: World & { attempt: typeof s.defenseAttempt.$inferSelect }) {
  const rows = await db.select().from(s.evaluationEntry).where(eq(s.evaluationEntry.defenseAttemptId, w.attempt.id));
  for (const e of rows) {
    await confirmSheetUpload(as(w.coordinator), e.id, { key: `agent-a/test/scan/v-${crypto.randomUUID()}.pdf`, sha256: "b".repeat(64), size: 100, contentType: "application/pdf" }, files);
    await verifySheet(as(w.coordinator), e.id, "matched");
  }
}
async function allSheets(w: World & { attempt: typeof s.defenseAttempt.$inferSelect }, action: Verdict = "approved") {
  for (const u of [w.adviser, w.lead, w.chair]) await saveSheet(as(u), w.attempt.id, await sheet(w, action), new Date());
}

describe("proposeDefenseDate (FR-DEF-01, INV-12, BR-09)", () => {
  it("refuses a date less than 7 days after Gate 1b and leaves no attempt row", async () => {
    const w = await setup();
    await expect(proposeDefenseDate(as(w.student), w.milestone.id, isoDay(25))).rejects.toMatchObject({ code: "date_too_early" });
    expect(await attemptOf(w.milestone.id)).toHaveLength(0);
    expect((await statusOf(w.milestone.id)).status).toBe("COMMITTEE_ENDORSED");
    await expect(proposeDefenseDate(as(w.student), w.milestone.id, "10/10/2026")).rejects.toThrow(/YYYY/);
  });

  it("moves to DATE_PROPOSED for a date 7 or more days after Gate 1b, only for the Student", async () => {
    const w = await setup();
    await expect(proposeDefenseDate(as(w.adviser), w.milestone.id, PROPOSED)).rejects.toBeInstanceOf(AccessDeniedError);
    await proposeDefenseDate(as(w.student), w.milestone.id, PROPOSED);
    expect((await statusOf(w.milestone.id)).status).toBe("DATE_PROPOSED");
    const [a] = await attemptOf(w.milestone.id);
    expect(a).toMatchObject({ attemptNo: 1, proposedDate: PROPOSED, status: "proposed" });
    const stranger = await makeUser(db, "student");
    await expect(proposeDefenseDate(as(stranger), w.milestone.id, PROPOSED)).rejects.toBeInstanceOf(AccessDeniedError);
  });
});

describe("confirmDefenseDate (FR-DEF-03, INV-13)", () => {
  it("blocks the confirmation while the checklist is incomplete, then schedules", async () => {
    const w = await setup({ withChecklist: false });
    await proposeDefenseDate(as(w.student), w.milestone.id, PROPOSED);
    await expect(confirmDefenseDate(as(w.coordinator), w.milestone.id, { startsAt: startOf(PROPOSED), roomOrLink: "Room 1" })).rejects.toMatchObject({
      code: "checklist_incomplete",
    });
    const [a] = await attemptOf(w.milestone.id);
    expect(a!.scheduledStartAt).toBeNull();
    expect(a!.status).toBe("proposed");
    await db.insert(s.documentRecord).values({
      milestoneInstanceId: w.milestone.id,
      templateRequiredItemId: (await db.select().from(s.templateRequiredItem).where(eq(s.templateRequiredItem.templateVersionId, w.version.id)))[0]!.id,
      formCode: "OR",
      state: "verified",
    });
    await expect(confirmDefenseDate(as(w.student), w.milestone.id, { startsAt: startOf(PROPOSED), roomOrLink: "Room 1" })).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(confirmDefenseDate(as(w.coordinator), w.milestone.id, { startsAt: startOf(PROPOSED), roomOrLink: " " })).rejects.toThrow(/room/);
    await expect(confirmDefenseDate(as(w.coordinator), w.milestone.id, { startsAt: startOf(isoDay(9)), roomOrLink: "Room 1" })).rejects.toThrow(/must be on/);
    await confirmDefenseDate(as(w.coordinator), w.milestone.id, { startsAt: startOf(PROPOSED), roomOrLink: " Room 1 " });
    expect((await statusOf(w.milestone.id)).status).toBe("DEFENSE_SCHEDULED");
    const [done] = await attemptOf(w.milestone.id);
    expect(done).toMatchObject({ status: "scheduled", roomOrLink: "Room 1" });
  });

  it("reuses the open attempt after a Coordinator Return and a new Gate 1b round", async () => {
    const w = await setup();
    await proposeDefenseDate(as(w.student), w.milestone.id, PROPOSED);
    await transitionMilestone(as(w.coordinator), w.milestone.id, "RETURNED", { reason: "Form is missing.", purpose: "compliance" });
    expect((await statusOf(w.milestone.id)).status).toBe("DRAFT");
    expect(await attemptCount(as(w.student), w.milestone.id)).toBe(1);
  });
});

describe("sheets (FR-DEF-05, FR-DEF-06, INV-14, BR-10, BR-15)", () => {
  it("opens at the scheduled start, takes only the own sheet of an evaluator, and checks scores", async () => {
    const w = await scheduled();
    const input = await sheet(w);
    await expect(saveSheet(as(w.lead), w.attempt.id, input, daysAgo(11))).rejects.toThrow(/opens at the scheduled start/);
    await expect(saveSheet(as(w.student), w.attempt.id, input, new Date())).rejects.toThrow(/do not complete a sheet/);
    await expect(saveSheet(as(w.coordinator), w.attempt.id, input, new Date())).rejects.toThrow(/do not complete a sheet/);
    const bad = { ...input, scores: [{ indicatorId: input.scores[0]!.indicatorId, score: 999 }] };
    await expect(saveSheet(as(w.lead), w.attempt.id, bad, new Date())).rejects.toThrow(/0 to the weight/);
    await expect(saveSheet(as(w.lead), w.attempt.id, { ...input, comments: [{ section: "chapter_1" as never, body: "x" }] }, new Date())).rejects.toThrow();
    const saved = await saveSheet(as(w.lead), w.attempt.id, input, new Date());
    expect(saved.total).toBe(100);
    // A second save replaces the first.
    const again = await saveSheet(as(w.lead), w.attempt.id, { ...input, actionTaken: "approved_with_revisions" }, new Date());
    expect(again.entryId).toBe(saved.entryId);
    const rows = await db.select().from(s.evaluationScore).where(eq(s.evaluationScore.evaluationEntryId, saved.entryId));
    expect(rows).toHaveLength(input.scores.length);
  });

  it("locks a sheet when the Coordinator verifies it, and reopens it on a mismatch (BR-12)", async () => {
    const w = await scheduled();
    const { entryId } = await saveSheet(as(w.lead), w.attempt.id, await sheet(w), new Date());
    await expect(verifySheet(as(w.coordinator), entryId, "matched")).rejects.toThrow(/signed scan/);
    await expect(requestSheetUpload(as(w.lead), entryId, { sha256: "b".repeat(64), size: 10, contentType: "application/pdf" }, files)).rejects.toBeInstanceOf(AccessDeniedError);
    const { link } = await requestSheetUpload(as(w.coordinator), entryId, { sha256: "b".repeat(64), size: 10, contentType: "application/pdf" }, files);
    const up = { key: link.key, sha256: "b".repeat(64), size: 10, contentType: "application/pdf" };
    await confirmSheetUpload(as(w.coordinator), entryId, up, files);
    await expect(confirmSheetUpload(as(w.coordinator), entryId, up, files)).rejects.toThrow(/already used/);
    await verifySheet(as(w.coordinator), entryId, "mismatch");
    // The member can correct it after a mismatch.
    await saveSheet(as(w.lead), w.attempt.id, await sheet(w, "approved_with_revisions"), new Date());
    await confirmSheetUpload(as(w.coordinator), entryId, { ...up, key: `agent-a/test/scan/${crypto.randomUUID()}.pdf` }, files);
    await verifySheet(as(w.coordinator), entryId, "matched");
    await expect(saveSheet(as(w.lead), w.attempt.id, await sheet(w), new Date())).rejects.toThrow(/read only/);
    await expect(verifySheet(as(w.coordinator), entryId, "matched")).rejects.toThrow(/verified/);
  });
});

describe("verdict, held, Minutes and close (FR-DEF-07 to 10, INV-15, INV-16)", () => {
  it("lets only the Lead Panel Member record the verdict, on or after the defense date", async () => {
    const w = await scheduled();
    await allSheets(w, "approved");
    await db.update(s.evaluationEntry).set({ actionTaken: "disapproved" }).where(eq(s.evaluationEntry.memberUserId, w.chair.id));
    await expect(recordVerdict(as(w.chair), w.milestone.id, "approved")).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(recordVerdict(as(w.adviser), w.milestone.id, "approved")).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(recordVerdict(as(w.lead), w.milestone.id, "approved", daysAgo(11))).rejects.toThrow(/date or later/);
    const { warnings } = await recordVerdict(as(w.lead), w.milestone.id, "approved");
    expect(warnings).toEqual([{ memberUserId: w.chair.id, actionTaken: "disapproved" }]);
    // BR-17: the warning does not block the held step.
    await expect(markDefenseHeld(as(w.chair), w.milestone.id)).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(markDefenseHeld(as(w.lead), w.milestone.id)).resolves.toEqual({ backToDraft: false });
    expect((await statusOf(w.milestone.id)).status).toBe("DEFENSE_HELD");
    expect((await attemptOf(w.milestone.id))[0]!.status).toBe("held");
  });

  it("refuses held without a verdict (INV-15)", async () => {
    const w = await scheduled();
    await expect(markDefenseHeld(as(w.lead), w.milestone.id)).rejects.toMatchObject({ code: "no_verdict" });
    expect((await statusOf(w.milestone.id)).status).toBe("DEFENSE_SCHEDULED");
  });

  it("closes only when every sheet is verified and matched and the Minutes are issued, then unlocks (INV-16, FR-DEF-10, BR-07)", async () => {
    const w = await scheduled();
    await allSheets(w);
    await recordVerdict(as(w.lead), w.milestone.id, "approved");
    await markDefenseHeld(as(w.lead), w.milestone.id);
    await expect(closeDefense(as(w.coordinator), w.milestone.id)).rejects.toMatchObject({ code: "sheet_not_verified" });
    await verifyAll(w);
    await expect(closeDefense(as(w.coordinator), w.milestone.id)).rejects.toMatchObject({ code: "minutes_missing" });
    await expect(issueMinutes(as(w.lead), w.attempt.id, "Minutes")).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(issueMinutes(as(w.coordinator), w.attempt.id, "  ")).rejects.toThrow(/first/);
    await issueMinutes(as(w.coordinator), w.attempt.id, " The panel approved. ");
    await expect(issueMinutes(as(w.coordinator), w.attempt.id, "Again")).rejects.toThrow(/already/);
    await expect(closeDefense(as(w.student), w.milestone.id)).rejects.toBeInstanceOf(AccessDeniedError);
    await closeDefense(as(w.coordinator), w.milestone.id);
    expect((await statusOf(w.milestone.id)).status).toBe("CLOSED");
    const [a] = await attemptOf(w.milestone.id);
    expect(a!.status).toBe("closed");
    expect(a!.closedAt).not.toBeNull();
    const [pr] = await db.select().from(s.submissionPr).where(eq(s.submissionPr.id, w.pr.id));
    expect(pr!.lockedAt).toBeNull();
  });

  it("refuses to close while a document is in Mismatch (BR-12, INV-16)", async () => {
    const w = await scheduled();
    await allSheets(w);
    await recordVerdict(as(w.lead), w.milestone.id, "approved");
    await markDefenseHeld(as(w.lead), w.milestone.id);
    await verifyAll(w);
    await issueMinutes(as(w.coordinator), w.attempt.id, "Minutes");
    await db.update(s.documentRecord).set({ state: "mismatch" }).where(eq(s.documentRecord.formCode, "TDW_07"));
    await expect(closeDefense(as(w.coordinator), w.milestone.id)).rejects.toMatchObject({ code: "document_mismatch" });
  });

  it("sends a Disapproved defense back to DRAFT with the manuscript unlocked, and a new attempt follows (FR-WFL-09, FR-DEF-12)", async () => {
    const w = await scheduled();
    await allSheets(w, "disapproved");
    await recordVerdict(as(w.lead), w.milestone.id, "disapproved");
    await expect(markDefenseHeld(as(w.lead), w.milestone.id)).resolves.toEqual({ backToDraft: true });
    const m = await statusOf(w.milestone.id);
    expect(m).toMatchObject({ status: "DRAFT", returnReason: "Disapproved at the defense." });
    const [pr] = await db.select().from(s.submissionPr).where(eq(s.submissionPr.id, w.pr.id));
    expect(pr).toMatchObject({ lockedAt: null, readyCommitId: null });
    const rows = await db.select().from(s.gateAction).where(eq(s.gateAction.milestoneInstanceId, w.milestone.id));
    expect(rows.some((r) => r.result === "returned" && r.gate === "stage_close")).toBe(true);
    // The first attempt stays in the history. The next proposal makes attempt 2 after a new Gate 1b round.
    expect(await attemptCount(as(w.student), w.milestone.id)).toBe(1);
    await db.update(s.milestoneInstance).set({ status: "COMMITTEE_ENDORSED" }).where(eq(s.milestoneInstance.id, w.milestone.id));
    await db.insert(s.gateAction).values(
      [w.adviser, w.lead, w.chair].map((u) => ({
        milestoneInstanceId: w.milestone.id,
        gate: "gate_1b" as const,
        result: "endorsed" as const,
        actorUserId: u.id,
        actorRole: u.role,
        commitId: w.commit.id,
        createdAt: daysAgo(20),
      })),
    );
    await db.update(s.submissionPr).set({ readyCommitId: w.commit.id }).where(eq(s.submissionPr.id, w.pr.id));
    await proposeDefenseDate(as(w.student), w.milestone.id, isoDay(5));
    expect(await attemptCount(as(w.student), w.milestone.id)).toBe(2);
  });
});

describe("printed copies (FR-DEF-04, BR-09, BR-17)", () => {
  it("records the receipt, checks the match and warns when late, never blocking", async () => {
    const w = await scheduled();
    // The defense was 10 days ago: the copies were due 17 days ago.
    const before = await printedCopyStatus(as(w.coordinator), w.attempt.id, new Date());
    expect(before).toMatchObject({ dueDate: isoDay(17), expectedCount: 5, receipt: null, late: true });
    await expect(recordPrintedCopies(as(w.student), w.attempt.id, 5)).rejects.toBeInstanceOf(AccessDeniedError);
    await expect(recordPrintedCopies(as(w.coordinator), w.attempt.id, 0)).rejects.toThrow(/one or more/);
    await expect(checkPrintedCopies(as(w.coordinator), w.attempt.id, "matched")).rejects.toThrow(/receipt/);
    await recordPrintedCopies(as(w.coordinator), w.attempt.id, 5, daysAgo(20));
    expect((await printedCopyStatus(as(w.student), w.attempt.id)).late).toBe(false);
    await recordPrintedCopies(as(w.coordinator), w.attempt.id, 6, daysAgo(12));
    const late = await printedCopyStatus(as(w.student), w.attempt.id);
    expect(late).toMatchObject({ late: true });
    expect(late.receipt).toMatchObject({ copyCount: 6, matchResult: "pending" });
    await checkPrintedCopies(as(w.coordinator), w.attempt.id, "mismatch");
    await checkPrintedCopies(as(w.coordinator), w.attempt.id, "matched");
    await expect(recordPrintedCopies(as(w.coordinator), w.attempt.id, 5)).rejects.toThrow(/checked already/);
    // BR-17: a late receipt does not block the date or the close.
    await expect(printedCopyStatus(as(w.adviser), w.attempt.id)).resolves.toBeDefined();
    const stranger = await makeUser(db, "student");
    await expect(printedCopyStatus(as(stranger), w.attempt.id)).rejects.toBeInstanceOf(AccessDeniedError);
  });
});

describe("defensePage (A5, P4, BR-18)", () => {
  it("gives the form, the rubric, the own sheet and the reason each action is blocked", async () => {
    const w = await scheduled();
    const early = await defensePage(as(w.lead), w.attempt.id, daysAgo(11));
    expect(early).toMatchObject({ form: "TDW_08", isEvaluator: true, verdictSeat: true, sheetsExpected: 3, sheetsSaved: 0 });
    expect(early.rubric).toHaveLength(7);
    expect(early.editBlock).toMatch(/opens at the scheduled start/);
    expect(early.verdictBlock).toMatch(/defense date or later/);
    const now = await defensePage(as(w.lead), w.attempt.id);
    expect(now.editBlock).toBeNull();
    expect(now.verdictBlock).toBeNull();
    expect(now.heldBlock).toMatch(/verdict/i);
    await saveSheet(as(w.lead), w.attempt.id, await sheet(w), new Date());
    const saved = await defensePage(as(w.lead), w.attempt.id);
    expect(saved.own?.scores[saved.rubric[0]!.id]).toBe(saved.rubric[0]!.weightPct);
    expect(saved.own?.comments.general_observations).toBe("Good work.");
    // The Panel Chair seat is not the verdict seat at the Proposal. The Student and the Coordinator complete no sheet.
    expect((await defensePage(as(w.chair), w.attempt.id)).verdictSeat).toBe(false);
    expect((await defensePage(as(w.student), w.attempt.id)).editBlock).toMatch(/do not complete/);
    const stranger = await makeUser(db, "student");
    await expect(defensePage(as(stranger), w.attempt.id)).rejects.toBeInstanceOf(AccessDeniedError);
  });

  it("hides the verdict from the Student until every sheet is verified (BR-11)", async () => {
    const w = await scheduled();
    await allSheets(w);
    await recordVerdict(as(w.lead), w.milestone.id, "approved");
    expect((await defensePage(as(w.lead), w.attempt.id)).attempt.verdict).toBe("approved");
    expect((await defensePage(as(w.student), w.attempt.id)).attempt.verdict).toBeNull();
    await markDefenseHeld(as(w.lead), w.milestone.id);
    await verifyAll(w);
    expect((await defensePage(as(w.student), w.attempt.id)).attempt.verdict).toBe("approved");
  });
});

describe("a Disapproved attempt stays open for sheets and Minutes (FR-DEF-12, FR-WFL-09, BR-11)", () => {
  it("takes a late sheet, the scans and the Minutes after the milestone is back in DRAFT", async () => {
    const w = await scheduled();
    // The Panel Chair has not saved a sheet when the verdict comes.
    for (const u of [w.adviser, w.lead]) await saveSheet(as(u), w.attempt.id, await sheet(w, "disapproved"), new Date());
    await recordVerdict(as(w.lead), w.milestone.id, "disapproved");
    await markDefenseHeld(as(w.lead), w.milestone.id);
    expect((await statusOf(w.milestone.id)).status).toBe("DRAFT");
    // Hidden from the Student while a sheet is missing.
    expect((await listAttempts(as(w.student), w.milestone.id))[0]!.resultsVisible).toBe(false);
    await saveSheet(as(w.chair), w.attempt.id, await sheet(w, "disapproved"), new Date());
    await verifyAll(w);
    await issueMinutes(as(w.coordinator), w.attempt.id, "The panel did not approve.");
    const view = (await listAttempts(as(w.student), w.milestone.id))[0]!;
    expect(view).toMatchObject({ resultsVisible: true });
    expect(view.attempt.verdict).toBe("disapproved");
    expect(view.entries).toHaveLength(3);
    expect(view.minutes?.body).toBe("The panel did not approve.");
  });

  it("refuses sheets, scans and Minutes for an attempt that is not open", async () => {
    const w = await scheduled();
    // Still scheduled: no Minutes yet.
    await expect(issueMinutes(as(w.coordinator), w.attempt.id, "Too early")).rejects.toThrow(/held defense/);
    await allSheets(w);
    await recordVerdict(as(w.lead), w.milestone.id, "approved");
    await markDefenseHeld(as(w.lead), w.milestone.id);
    await verifyAll(w);
    await issueMinutes(as(w.coordinator), w.attempt.id, "Minutes");
    await closeDefense(as(w.coordinator), w.milestone.id);
    await expect(saveSheet(as(w.lead), w.attempt.id, await sheet(w), new Date())).rejects.toThrow(/not open/);
    const [e] = await db.select().from(s.evaluationEntry).where(eq(s.evaluationEntry.defenseAttemptId, w.attempt.id));
    await expect(
      requestSheetUpload(as(w.coordinator), e!.id, { sha256: "b".repeat(64), size: 10, contentType: "application/pdf" }, files),
    ).rejects.toThrow(/verified/);
    await expect(issueMinutes(as(w.coordinator), w.attempt.id, "Again")).rejects.toThrow(/held defense/);
  });
});

describe("listAttempts (FR-DEF-11, FR-DEF-12, BR-11, BR-15)", () => {
  it("shows the Student the results only after every sheet is verified, and no grade equivalent", async () => {
    const w = await scheduled();
    await allSheets(w);
    await recordVerdict(as(w.lead), w.milestone.id, "approved_with_revisions");
    await markDefenseHeld(as(w.lead), w.milestone.id);
    await issueMinutes(as(w.coordinator), w.attempt.id, "Minutes text");

    const before = (await listAttempts(as(w.student), w.milestone.id))[0]!;
    expect(before).toMatchObject({ resultsVisible: false, entries: [], minutes: null });
    expect(before.attempt.verdict).toBeNull();
    expect(before.attempt.roomOrLink).toBe("Room 101");

    // An evaluator sees the own sheet and the verdict. The Coordinator sees all.
    const own = (await listAttempts(as(w.lead), w.milestone.id))[0]!;
    expect(own.entries.map((e) => e.memberUserId)).toEqual([w.lead.id]);
    expect(own.attempt.verdict).toBe("approved_with_revisions");
    expect((await listAttempts(as(w.coordinator), w.milestone.id))[0]!.entries).toHaveLength(3);

    await verifyAll(w);
    const after = (await listAttempts(as(w.student), w.milestone.id))[0]!;
    expect(after.resultsVisible).toBe(true);
    expect(after.entries).toHaveLength(3);
    expect(after.minutes?.body).toBe("Minutes text");
    expect(after.attempt.verdict).toBe("approved_with_revisions");
    // The total is a plain sum. No column holds a grade (BR-15, INV-32).
    expect(after.entries[0]!.total).toBe(100);
    expect(Object.keys(after.entries[0]!).some((k) => /grade/i.test(k))).toBe(false);
  });

  it("refuses a stranger", async () => {
    const w = await scheduled();
    const stranger = await makeUser(db, "student");
    await expect(listAttempts(as(stranger), w.milestone.id)).rejects.toBeInstanceOf(AccessDeniedError);
  });
});

// P2-E04-T07: the events of the defense (FR-NTF-01, INV-30). The actor gets no notice. No email text holds a date or a verdict.
describe("events of the defense (A1, A2, A3, A6)", () => {
  const who = async (code: string, targetId: string) =>
    (await db.select().from(s.notification)).filter((n) => n.eventCode === code && n.targetId === targetId).map((n) => n.recipientUserId).sort();
  it("tells the right people after each commit", async () => {
    const w = await setup();
    const { attemptId } = await proposeDefenseDate(as(w.student), w.milestone.id, PROPOSED);
    const a1 = await who("A1", attemptId); // Every active Coordinator gets it, so the shared test database holds several.
    expect(a1).toContain(w.coordinator.id);
    expect(a1).not.toContain(w.student.id);
    await transitionMilestone(as(w.coordinator), w.milestone.id, "RETURNED", { reason: "Wrong room.", purpose: "compliance" });
    expect(await who("A3", w.milestone.id)).toEqual([w.student.id, w.lead.id, w.chair.id].sort());
    const v = await setup();
    await proposeDefenseDate(as(v.student), v.milestone.id, PROPOSED);
    await confirmDefenseDate(as(v.coordinator), v.milestone.id, { startsAt: startOf(PROPOSED), roomOrLink: "Room 101" });
    expect(await who("A2", v.milestone.id)).toEqual([v.student.id, v.adviser.id, v.lead.id, v.chair.id].sort());
  });
  it("tells the Student when the last sheet is verified (A6)", async () => {
    const w = await scheduled();
    await allSheets(w);
    await verifyAll(w);
    expect(await who("A6", w.attempt.id)).toEqual([w.student.id]);
  });
});
