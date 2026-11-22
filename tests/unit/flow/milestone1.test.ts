// P1-E13: the Milestone 1 exit test (PRD §8). One fake Student goes from account creation to CERTIFIED with every role,
// through the real data layer on the real migrations (PGlite). The browser run needs Neon Auth: see AD-A-025.
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
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
import { endorseGate1b, transitionMilestone } from "@/server/data/milestones";
import { setOutsideStatus } from "@/server/data/outside";
import * as s from "@/server/data/schema";
import { createStudent } from "@/server/data/students";
import { makeUser } from "../../support/fixtures";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let close: () => Promise<void>;
let n = 0;
const files: FilePort = {
  createUploadLink: async (req) => ({ key: `agent-a/flow/${req.kind}/${++n}.pdf`, url: "https://store.test/put", headers: {} }),
  checkStoredFile: async () => true,
};
const SHA = "c".repeat(64);
const DAY = 86_400_000;
const daysAgo = (d: number) => new Date(Date.now() - d * DAY);
const isoDay = (d: number) => daysAgo(d).toISOString().slice(0, 10);

beforeAll(async () => {
  ({ db, close } = await makeTestDb());
});
afterAll(() => close());

const actorOf = (u: { id: string; role: s.UserRole }): Actor => ({ userId: u.id, role: u.role, isActive: true });
const as = (u: { id: string; role: s.UserRole }): DataContext => ({ db, actor: actorOf(u) });

describe("Milestone 1: account to CERTIFIED with every role", () => {
  it("runs the whole path", async () => {
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
  });
});
