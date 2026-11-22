// The Milestone 1 flow for the flow tests (P1-E13, P2-E05): one fake Student from account creation to CERTIFIED with every
// role, through the real data layer. The browser run needs Neon Auth: see AD-A-025.
import { eq, sql } from "drizzle-orm";
import { expect } from "vitest";
import type { Actor, DataContext } from "@/server/data/access";
import { approveDataGathering } from "@/server/data/certification";
import {
  advanceMilestone,
  linkAppointmentForm,
  linkNda,
  markAppointed,
  proposeSeat,
  recordSeatAnswer,
} from "@/server/data/committees";
import { listLogEntries, publishSlots, requestBooking, decideBooking, draftLogEntry, setLogTopic, confirmLogEntry } from "@/server/data/consultations";
import type { Db } from "@/server/data/db";
import {
  checkPrintedCopies,
  closeDefense,
  confirmDefenseDate,
  confirmSheetUpload,
  issueMinutes,
  listAttempts,
  markDefenseHeld,
  proposeDefenseDate,
  recordPrintedCopies,
  recordVerdict,
  saveSheet,
  verifySheet,
} from "@/server/data/defense";
import { confirmScanUpload, deliverables, requestScanUpload, reviewDocument, type FilePort } from "@/server/data/documents";
import { confirmCommitUpload, listThreads, markCommitReady, postThread, replyToThread, resolveThread } from "@/server/data/manuscript";
import { acceptRevision, addRevisionItems, linkRevisionToCommit, listRevisionItems } from "@/server/data/revisions";
import { endorseGate1b, transitionMilestone } from "@/server/data/milestones";
import { setOutsideStatus } from "@/server/data/outside";
import * as s from "@/server/data/schema";
import { createStudent } from "@/server/data/students";
import { makeUser } from "./fixtures";

// `as` uses the database of the last `runMilestone1` call, so later steps of a flow can use it.
let n = 0;
export const nextKey = () => ++n;
export const files: FilePort = {
  createUploadLink: async (req) => ({ key: `agent-a/flow/${req.kind}/${++n}.pdf`, url: "https://store.test/put", headers: {} }),
  checkStoredFile: async () => true,
};
export const SHA = "c".repeat(64);
export const DAY = 86_400_000;
export const daysAgo = (d: number) => new Date(Date.now() - d * DAY);
export const isoDay = (d: number) => daysAgo(d).toISOString().slice(0, 10);

export const actorOf = (u: { id: string; role: s.UserRole }): Actor => ({ userId: u.id, role: u.role, isActive: true });
export const as = (u: { id: string; role: s.UserRole }): DataContext => ({ db: currentDb!, actor: actorOf(u) });
let currentDb: Db | undefined;

export async function runMilestone1(db: Db) {
  currentDb = db;
  // Accounts (FR-ACC-04): the Coordinator, an Adviser, two Panel Members, then the Student with the thesis.
  const coordinator = await makeUser(db, "coordinator");
  const adviser = await makeUser(db, "adviser");
  const lead = await makeUser(db, "panel_member");
  const chair = await makeUser(db, "panel_member");
  const created = await createStudent(
    as(coordinator),
    {
      fullName: "Fake Student",
      email: "flow.student@example.test",
      degreeLevel: "masters",
      programStartTerm: "2025-1",
      comprehensiveExamDate: null,
      writing1Course: "RSH_641",
      adviserUserId: adviser.id,
    },
    async () => ({ authUserId: crypto.randomUUID() }),
  );
  const [studentRow] = await db.select().from(s.appUser).where(eq(s.appUser.id, created.userId));
  const student = studentRow!;
  const mid = created.milestoneId;
  const status = async () => (await db.select().from(s.milestoneInstance).where(eq(s.milestoneInstance.id, mid)))[0]!.status;
  expect(await status()).toBe("DRAFT");

  // A document helper: upload a scan as its uploader, then the Coordinator receives and verifies it.
  const items = await deliverables(as(coordinator), mid);
  const itemOf = (formCode: string) => items.find((i) => i.formCode === formCode)!;
  const roleOf: Record<string, { id: string; role: s.UserRole }> = { student, adviser, coordinator };
  async function scan(formCode: string, subject: string | null = null, verify = true) {
    const item = itemOf(formCode);
    const uploader = roleOf[item.uploaderRole]!;
    const req = await requestScanUpload(
      as(uploader),
      { milestoneId: mid, requiredItemId: item.requiredItemId, subjectUserId: subject, sha256: SHA, size: 100, contentType: "application/pdf" },
      files,
    );
    if (!req.ok) throw new Error(`${formCode}: ${req.reason}`);
    const done = await confirmScanUpload(
      as(uploader),
      { documentId: req.value.documentId, key: req.value.link.key, sha256: SHA, size: 100, contentType: "application/pdf" },
      files,
    );
    if (!done.ok) throw new Error(`${formCode}: ${done.reason}`);
    if (verify) {
      for (const to of ["physical_received", "verified"] as const) {
        const r = await reviewDocument(as(coordinator), { documentId: req.value.documentId, to });
        if (!r.ok) throw new Error(`${formCode} ${to}: ${r.reason}`);
      }
    }
    return req.value.documentId;
  }

  // Manuscript (FR-REV-02, FR-REV-07): the Student uploads v1 and marks it Ready.
  const up = { milestoneId: mid, key: `agent-a/flow/manuscript/${++n}.pdf`, sha256: SHA, size: 5000, contentType: "application/pdf" };
  const v1 = await confirmCommitUpload(as(student), up, files);
  await markCommitReady(as(student), mid, v1.commitId);
  await transitionMilestone(as(student), mid, "READY");

  // Gate 1a: the Adviser has an open thread, resolves it, then endorses (INV-20).
  const t1 = await postThread(as(adviser), { commitId: v1.commitId, body: "State the limits." });
  await expect(transitionMilestone(as(adviser), mid, "ADVISER_ENDORSED")).rejects.toMatchObject({ code: "open_threads" });
  await replyToThread(as(student), t1.threadId, "Added in the next version.");
  await resolveThread(as(adviser), t1.threadId);
  await transitionMilestone(as(adviser), mid, "ADVISER_ENDORSED");
  expect(await status()).toBe("ADVISER_ENDORSED");

  // Appointment (FR-CMT-01 to 04): seats, answers, the TDW 06 form and the NDAs, all verified.
  await setOutsideStatus(as(coordinator), mid, "ethics", "APPROVED");
  const seatLead = await proposeSeat(as(coordinator), { thesisId: created.thesisId, milestone: "proposal", memberUserId: lead.id, designation: "lead_panel_member" });
  const seatChair = await proposeSeat(as(coordinator), { thesisId: created.thesisId, milestone: "proposal", memberUserId: chair.id, designation: "panel_chair" });
  if (!seatLead.ok || !seatChair.ok) throw new Error("seat refused");
  for (const seat of [seatLead.value, seatChair.value]) {
    const r = await recordSeatAnswer(as(coordinator), { seatId: seat.id, status: "accepted" });
    expect(r.ok).toBe(true);
  }
  const [com] = await db.select().from(s.committee).where(eq(s.committee.thesisInstanceId, created.thesisId));
  const tdw06 = await scan("TDW_06");
  expect((await linkAppointmentForm(as(coordinator), { committeeId: com!.id, documentId: tdw06 })).ok).toBe(true);
  for (const [seat, member] of [[seatLead.value, lead], [seatChair.value, chair]] as const) {
    const nda = await scan("TDW_05", member.id);
    expect((await linkNda(as(coordinator), { seatId: seat.id, documentId: nda })).ok).toBe(true);
  }
  expect((await markAppointed(as(coordinator), { committeeId: com!.id })).ok).toBe(true);
  expect((await advanceMilestone(as(coordinator), { committeeId: com!.id })).ok).toBe(true);
  expect(await status()).toBe("COMMITTEE_APPOINTED");

  // Committee review (context B): a Panel Member posts, the Student replies, the member resolves.
  const t2 = await postThread(as(lead), { commitId: v1.commitId, body: "Check the sample size." });
  await replyToThread(as(student), t2.threadId, "Checked.");
  await resolveThread(as(lead), t2.threadId);
  expect((await listThreads(as(student), mid)).map((t) => t.thread.state)).toEqual(["RESOLVED", "RESOLVED"]);

  // Gate 1b: the Adviser and both members endorse the same commit. The manuscript locks (BR-07).
  for (const u of [adviser, lead]) expect(await endorseGate1b(as(u), mid)).toEqual({ completed: false });
  expect(await endorseGate1b(as(chair), mid)).toEqual({ completed: true });
  expect(await status()).toBe("COMMITTEE_ENDORSED");
  const [pr] = await db.select().from(s.submissionPr).where(eq(s.submissionPr.milestoneInstanceId, mid));
  expect(pr!.lockedAt).not.toBeNull();
  await expect(confirmCommitUpload(as(student), { ...up, key: `agent-a/flow/manuscript/${++n}.pdf` }, files)).rejects.toThrow(/locked/);

  // A consultation is booked, held and logged (FR-SCH-01 to 06, BR-16).
  const [slotId] = (await publishSlots(as(adviser), { slotType: "consultation", mode: "in_person", meetingLink: null, startsAt: new Date(Date.now() + 2 * DAY), endsAt: new Date(Date.now() + 2 * DAY + 3_600_000), repeatWeeks: 0 })).slotIds;
  const booking = await requestBooking(as(student), { slotId: slotId!, agenda: "Chapter 4" });
  await decideBooking(as(adviser), booking.bookingId, "confirm");
  const entry = await draftLogEntry(as(adviser), booking.bookingId, {}, new Date(Date.now() + 3 * DAY));
  await setLogTopic(as(student), entry.entryId, "Results");
  await confirmLogEntry(as(adviser), entry.entryId, "Write the discussion.");
  expect(await listLogEntries(as(student), mid)).toHaveLength(1);

  // Time passes: Gate 1b was 30 days ago (BR-09 needs 7 days).
  // The table is append-only (INV-08). The test switches the trigger off for this one statement to move the clock.
  await db.execute(sql`alter table app.gate_action disable trigger gate_action_append_only`);
  await db.update(s.gateAction).set({ createdAt: daysAgo(30) }).where(eq(s.gateAction.milestoneInstanceId, mid));
  await db.execute(sql`alter table app.gate_action enable trigger gate_action_append_only`);

  // Defense date (FR-DEF-01, FR-DEF-03): too early is refused, a valid date is proposed, the checklist gates the confirmation.
  await expect(proposeDefenseDate(as(student), mid, isoDay(25))).rejects.toMatchObject({ code: "date_too_early" });
  const proposedDate = isoDay(10);
  const { attemptId } = await proposeDefenseDate(as(student), mid, proposedDate);
  await expect(confirmDefenseDate(as(coordinator), mid, { startsAt: new Date(`${proposedDate}T02:00:00Z`), roomOrLink: "Room 101" })).rejects.toMatchObject({ code: "checklist_incomplete" });
  await scan("TDW_03");
  await scan("TDW_07");
  await scan("OR");
  await confirmDefenseDate(as(coordinator), mid, { startsAt: new Date(`${proposedDate}T02:00:00Z`), roomOrLink: "Room 101" });
  expect(await status()).toBe("DEFENSE_SCHEDULED");

  // Defense Day (FR-DEF-05 to 07): the Adviser and both members encode a sheet. The Lead Panel Member records the verdict.
  const rubric = await db.select().from(s.rubricIndicator).where(eq(s.rubricIndicator.templateVersionId, (await db.select().from(s.milestoneInstance).where(eq(s.milestoneInstance.id, mid)))[0]!.templateVersionId));
  const sheet = { actionTaken: "approved" as const, scores: rubric.map((r) => ({ indicatorId: r.id, score: r.weightPct })), comments: [{ section: "general_observations" as const, body: "Well done." }] };
  for (const u of [adviser, lead, chair]) await saveSheet(as(u), attemptId, sheet, new Date());
  expect((await recordVerdict(as(lead), mid, "approved")).warnings).toEqual([]);
  expect(await markDefenseHeld(as(lead), mid)).toEqual({ backToDraft: false });
  expect(await status()).toBe("DEFENSE_HELD");

  // Closing (FR-DEF-08 to 10, BR-12): printed copies, signed sheets verified, Minutes, then close. The manuscript unlocks.
  await recordPrintedCopies(as(coordinator), attemptId, 5);
  await checkPrintedCopies(as(coordinator), attemptId, "matched");
  await expect(closeDefense(as(coordinator), mid)).rejects.toMatchObject({ code: "sheet_not_verified" });
  const sheets = await db.select().from(s.evaluationEntry).where(eq(s.evaluationEntry.defenseAttemptId, attemptId));
  for (const e of sheets) {
    await confirmSheetUpload(as(coordinator), e.id, { key: `agent-a/flow/scan/${++n}.pdf`, sha256: SHA, size: 100, contentType: "application/pdf" }, files);
    await verifySheet(as(coordinator), e.id, "matched");
  }
  await issueMinutes(as(coordinator), attemptId, "The committee approved the proposal.");
  await closeDefense(as(coordinator), mid);
  expect(await status()).toBe("CLOSED");
  const [pr2] = await db.select().from(s.submissionPr).where(eq(s.submissionPr.milestoneInstanceId, mid));
  expect(pr2!.lockedAt).toBeNull();

  // BR-11: the Student sees the results now. No grade equivalent (BR-15).
  const [view] = await listAttempts(as(student), mid);
  expect(view).toMatchObject({ resultsVisible: true });
  expect(view!.attempt.verdict).toBe("approved");
  expect(view!.minutes?.body).toContain("approved");

  // Certification (FR-WFL-06, INV-34): the Student uploads the signed paper, the Coordinator verifies it, then CERTIFIED.
  await expect(transitionMilestone(as(coordinator), mid, "CERTIFIED")).rejects.toMatchObject({ code: "certification_missing" });
  await scan("CERTIFICATION");
  await transitionMilestone(as(coordinator), mid, "CERTIFIED");
  expect(await status()).toBe("CERTIFIED");

  // Data gathering (FR-WFL-11): the Adviser approves.
  await approveDataGathering(as(adviser), mid);

  // The record: every gate action is kept, and the audit trail names the actors (NFR-03, BR-19).
  const gates = await db.select().from(s.gateAction).where(eq(s.gateAction.milestoneInstanceId, mid));
  expect(new Set(gates.map((g) => g.gate))).toEqual(
    new Set(["gate_1a", "gate_1b", "date_confirmation", "stage_close", "certification", "data_gathering"]),
  );
  const audit = await db.select().from(s.auditRecord);
  expect(audit.length).toBeGreaterThan(40);
  expect(new Set(audit.map((a) => a.actorRole))).toEqual(new Set(["coordinator", "student", "adviser", "panel_member"]));

  return { coordinator, adviser, lead, chair, student, thesisId: created.thesisId, milestoneId: mid, scan, itemOf, status };
}

// The Milestone 2 flow (P2-E05): Pre-Final Defense to its close, which opens Milestone 3. Used by the Milestone 3 flow.
export async function runMilestone2(db: Db) {
  currentDb = db;
  const f = await runMilestone1(db);
    const { coordinator, adviser, lead, chair, student } = f;

    // FR-WFL-01: approving data gathering opened Milestone 2 on the newest Pre-Final template, in DRAFT.
    const milestones = await db.select().from(s.milestoneInstance).where(eq(s.milestoneInstance.thesisInstanceId, f.thesisId));
    expect(milestones.map((m) => m.milestoneCode).sort()).toEqual(["pre_final", "proposal"]);
    const preFinal = milestones.find((m) => m.milestoneCode === "pre_final")!;
    expect(preFinal.status).toBe("DRAFT");
    const mid = preFinal.id;
    const status = async () => (await db.select().from(s.milestoneInstance).where(eq(s.milestoneInstance.id, mid)))[0]!.status;

    // Documents of Milestone 2 come from its own template: TDW 03, TDW 09, OR.
    const items = await deliverables(as(coordinator), mid);
    expect(items.map((i) => i.formCode).sort()).toEqual(["OR", "TDW_03", "TDW_09", "TDW_10"]);
    const roleOf = { student, adviser, coordinator } as Record<string, { id: string; role: s.UserRole }>;
    async function scan(formCode: string) {
      const item = items.find((i) => i.formCode === formCode)!;
      const uploader = roleOf[item.uploaderRole]!;
      const meta = { sha256: SHA, size: 100, contentType: "application/pdf" };
      const req = await requestScanUpload(as(uploader), { milestoneId: mid, requiredItemId: item.requiredItemId, subjectUserId: null, ...meta }, files);
      if (!req.ok) throw new Error(`${formCode}: ${req.reason}`);
      const done = await confirmScanUpload(as(uploader), { documentId: req.value.documentId, key: req.value.link.key, ...meta }, files);
      if (!done.ok) throw new Error(`${formCode}: ${done.reason}`);
      for (const to of ["physical_received", "verified"] as const) {
        const r = await reviewDocument(as(coordinator), { documentId: req.value.documentId, to });
        if (!r.ok) throw new Error(`${formCode} ${to}: ${r.reason}`);
      }
    }

    // Manuscript v1 of Milestone 2, Ready, then Gate 1a. The IPMO check gates it (INV-20, FR-WFL-03).
    const v1 = await confirmCommitUpload(as(student), { milestoneId: mid, key: `agent-a/flow/manuscript/${nextKey()}.pdf`, sha256: SHA, size: 5000, contentType: "application/pdf" }, files);
    await markCommitReady(as(student), mid, v1.commitId);
    await transitionMilestone(as(student), mid, "READY");
    await expect(transitionMilestone(as(adviser), mid, "ADVISER_ENDORSED")).rejects.toMatchObject({ code: "ipmo_not_passed" });
    for (const value of ["UNDER_CHECK", "PASSED"] as const) await setOutsideStatus(as(coordinator), mid, "ipmo", value);
    await transitionMilestone(as(adviser), mid, "ADVISER_ENDORSED");
    expect(await status()).toBe("ADVISER_ENDORSED");

    // Committee review of Milestone 2 uses the Evaluation Committee of Milestone 1: no new appointment (FR-CMT-01).
    const t = await postThread(as(lead), { commitId: v1.commitId, body: "Tighten the discussion." });
    await replyToThread(as(student), t.threadId, "Done.");
    await resolveThread(as(lead), t.threadId);
    for (const u of [adviser, lead]) expect(await endorseGate1b(as(u), mid)).toEqual({ completed: false });
    expect(await endorseGate1b(as(chair), mid)).toEqual({ completed: true });
    expect(await status()).toBe("COMMITTEE_ENDORSED");

    // Age Gate 1b for the notice period (BR-09). The test switches the append-only trigger off for one statement.
    await db.execute(sql`alter table app.gate_action disable trigger gate_action_append_only`);
    await db.update(s.gateAction).set({ createdAt: daysAgo(30) }).where(eq(s.gateAction.milestoneInstanceId, mid));
    await db.execute(sql`alter table app.gate_action enable trigger gate_action_append_only`);

    // Date, checklist (TDW 03, TDW 09, IPMO PASSED, OR) and schedule.
    const date = isoDay(10);
    const { attemptId } = await proposeDefenseDate(as(student), mid, date);
    const start = new Date(`${date}T02:00:00Z`);
    await expect(confirmDefenseDate(as(coordinator), mid, { startsAt: start, roomOrLink: "Room 202" })).rejects.toMatchObject({ code: "checklist_incomplete" });
    for (const code of ["TDW_03", "TDW_09", "OR"]) await scan(code);
    await confirmDefenseDate(as(coordinator), mid, { startsAt: start, roomOrLink: "Room 202" });
    expect(await status()).toBe("DEFENSE_SCHEDULED");

    // TDW 10: comment boxes only, no scores (FR-DEF-05). A score is refused. The Adviser has a sheet at Pre-Final.
    const sheet = { actionTaken: "approved_with_revisions" as const, scores: [], comments: [{ section: "chapter_3" as const, body: "Explain the sample." }, { section: "remarks" as const, body: "Revise chapter 3." }] };
    const [anyIndicator] = await db.select().from(s.rubricIndicator);
    await expect(saveSheet(as(lead), attemptId, { ...sheet, scores: [{ indicatorId: anyIndicator!.id, score: 1 }] }, new Date())).rejects.toThrow();
    for (const u of [adviser, lead, chair]) await saveSheet(as(u), attemptId, sheet, new Date());
    expect((await recordVerdict(as(lead), mid, "approved_with_revisions")).warnings).toEqual([]);
    await markDefenseHeld(as(lead), mid);

    // Close: sheets verified, Minutes, then revision items are listed and answered.
    await recordPrintedCopies(as(coordinator), attemptId, 5);
    await checkPrintedCopies(as(coordinator), attemptId, "matched");
    for (const e of await db.select().from(s.evaluationEntry).where(eq(s.evaluationEntry.defenseAttemptId, attemptId))) {
      expect(e.form).toBe("TDW_10");
      await confirmSheetUpload(as(coordinator), e.id, { key: `agent-a/flow/scan/${nextKey()}.pdf`, sha256: SHA, size: 100, contentType: "application/pdf" }, files);
      await verifySheet(as(coordinator), e.id, "matched");
    }
    await issueMinutes(as(coordinator), attemptId, "Revise chapter 3 and the discussion.");
    await addRevisionItems(as(coordinator), attemptId, ["Explain the sample in chapter 3."]);

    // Closing needs no revision items accepted: Milestone 2 has no Certification. Milestone 3 opens at the close (FR-WFL-01).
    await closeDefense(as(coordinator), mid);
    expect(await status()).toBe("CLOSED");
    const all = await db.select().from(s.milestoneInstance).where(eq(s.milestoneInstance.thesisInstanceId, f.thesisId));
    expect(all.map((m) => m.milestoneCode).sort()).toEqual(["final", "pre_final", "proposal"]);
    expect(all.find((m) => m.milestoneCode === "final")!.status).toBe("DRAFT");

    // After the close the manuscript is open again: the Student links a new commit to each revision item, the committee accepts.
    const v2 = await confirmCommitUpload(as(student), { milestoneId: mid, key: `agent-a/flow/manuscript/${nextKey()}.pdf`, sha256: SHA, size: 5200, contentType: "application/pdf" }, files);
    const [item] = await listRevisionItems(as(student), attemptId);
    await linkRevisionToCommit(as(student), item!.id, v2.commitId);
    for (const u of [adviser, lead, chair]) await acceptRevision(as(u), item!.id);
    expect((await listRevisionItems(as(adviser), attemptId))[0]).toMatchObject({ allAccepted: true, linkedCommitOrdinal: 2 });

    // The Student sees the results (BR-11) and the log of Milestone 1 stays with its milestone (AD-A-020).
    expect((await listAttempts(as(student), mid))[0]).toMatchObject({ resultsVisible: true });
    expect(await listLogEntries(as(student), f.milestoneId)).toHaveLength(1);
  return { ...f, mid, attemptId, status, scan };
}
