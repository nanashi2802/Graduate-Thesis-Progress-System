// P3-E06: the Milestone 3 exit test. The Student of the Milestone 2 flow goes through the Final Defense with every role:
// the Final Panel, TDW 11 to TDW 13, Defense Day threads, Gate 2, the signed final manuscript and clearance to CLEARED.
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { advanceMilestone, linkAppointmentForm, linkNda, markAppointed, proposeSeat, recordSeatAnswer } from "@/server/data/committees";
import { clearanceView, EVIDENCE_FORM, verifyClearanceItem } from "@/server/data/clearance";
import type { Db } from "@/server/data/db";
import {
  checkPrintedCopies, closeDefense, confirmDefenseDate, confirmSheetUpload, issueMinutes, markDefenseHeld,
  proposeDefenseDate, recordPrintedCopies, recordVerdict, saveSheet, verifySheet,
} from "@/server/data/defense";
import { confirmScanUpload, deliverables, requestScanUpload, reviewDocument } from "@/server/data/documents";
import { confirmCommitUpload, listThreads, markCommitReady, postThread, replyToThread, resolveThread } from "@/server/data/manuscript";
import { approveGate2, endorseGate1b, transitionMilestone } from "@/server/data/milestones";
import { setOutsideStatus } from "@/server/data/outside";
import { manuscriptAccessEnded } from "@/server/data/scope";
import * as s from "@/server/data/schema";
import { makeUser } from "../../support/fixtures";
import { as, daysAgo, files, isoDay, nextKey, runMilestone2, SHA } from "../../support/flow";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let close: () => Promise<void>;
beforeAll(async () => {
  ({ db, close } = await makeTestDb());
});
afterAll(() => close());

describe("Milestone 3: Final Defense and clearance with every role", () => {
  it("runs from the open of Milestone 3 to CLEARED", async () => {
    const f = await runMilestone2(db);
    const { coordinator, adviser, lead, chair, student } = f;
    const [m3] = (await db.select().from(s.milestoneInstance).where(eq(s.milestoneInstance.thesisInstanceId, f.thesisId))).filter((m) => m.milestoneCode === "final");
    const mid = m3!.id;
    expect(m3!.status).toBe("DRAFT");
    const status = async () => (await db.select().from(s.milestoneInstance).where(eq(s.milestoneInstance.id, mid)))[0]!.status;

    // Documents of Milestone 3 come from the Final template.
    const items = await deliverables(as(coordinator), mid);
    const roleOf = { student, adviser, coordinator } as Record<string, { id: string; role: s.UserRole }>;
    async function scan(formCode: string, subject: string | null = null, verify = true) {
      const item = items.find((i) => i.formCode === formCode)!;
      const uploader = roleOf[item.uploaderRole]!;
      const meta = { sha256: SHA, size: 100, contentType: "application/pdf" };
      const req = await requestScanUpload(as(uploader), { milestoneId: mid, requiredItemId: item.requiredItemId, subjectUserId: subject, ...meta }, files);
      if (!req.ok) throw new Error(`${formCode}: ${req.reason}`);
      const done = await confirmScanUpload(as(uploader), { documentId: req.value.documentId, key: req.value.link.key, ...meta }, files);
      if (!done.ok) throw new Error(`${formCode}: ${done.reason}`);
      if (verify) {
        for (const to of ["physical_received", "verified"] as const) {
          const r = await reviewDocument(as(coordinator), { documentId: req.value.documentId, to });
          if (!r.ok) throw new Error(`${formCode} ${to}: ${r.reason}`);
        }
      }
      return req.value.documentId;
    }

    // Manuscript v1, Ready, Gate 1a. Milestone 3 has no IPMO gate here.
    const v1 = await confirmCommitUpload(as(student), { milestoneId: mid, key: `agent-a/flow/manuscript/${nextKey()}.pdf`, sha256: SHA, size: 6000, contentType: "application/pdf" }, files);
    await markCommitReady(as(student), mid, v1.commitId);
    await transitionMilestone(as(student), mid, "READY");
    await transitionMilestone(as(adviser), mid, "ADVISER_ENDORSED");

    // Final Panel (FR-CMT-01): four seats for a Master's Student. One new committee, TDW 11 and four NDAs.
    const extra = [await makeUser(db, "panel_member"), await makeUser(db, "panel_member")];
    const members = [lead, chair, ...extra];
    const designations = ["lead_panel_member", "panel_chair", "none", "none"] as const;
    const seats: (typeof s.committeeMember.$inferSelect)[] = [];
    for (const [i, u] of members.entries()) {
      const r = await proposeSeat(as(coordinator), { thesisId: f.thesisId, milestone: "final", memberUserId: u.id, designation: designations[i]! });
      if (!r.ok) throw new Error(`seat: ${r.code}`);
      expect((await recordSeatAnswer(as(coordinator), { seatId: r.value.id, status: "accepted" })).ok).toBe(true);
      seats.push(r.value);
    }
    const finalPanel = (await db.select().from(s.committee).where(eq(s.committee.thesisInstanceId, f.thesisId))).find((c) => c.kind === "final_panel")!;
    expect((await markAppointed(as(coordinator), { committeeId: finalPanel.id })).ok).toBe(false); // no TDW 11 yet
    expect((await linkAppointmentForm(as(coordinator), { committeeId: finalPanel.id, documentId: await scan("TDW_11") })).ok).toBe(true);
    for (const [i, u] of members.entries()) {
      expect((await linkNda(as(coordinator), { seatId: seats[i]!.id, documentId: await scan("TDW_05", u.id) })).ok).toBe(true);
    }
    expect((await markAppointed(as(coordinator), { committeeId: finalPanel.id })).ok).toBe(true);
    expect((await advanceMilestone(as(coordinator), { committeeId: finalPanel.id })).ok).toBe(true);
    expect(await status()).toBe("COMMITTEE_APPOINTED");

    // Gate 1b: the old members accept the Pre-Final revision items first (INV-21). The two new members have none to accept (AD-A-031).
    await expect(endorseGate1b(as(adviser), mid)).resolves.toEqual({ completed: false });
    for (const u of [lead, chair, extra[0]!]) expect(await endorseGate1b(as(u), mid)).toEqual({ completed: false });
    expect(await endorseGate1b(as(extra[1]!), mid)).toEqual({ completed: true });
    expect(await status()).toBe("COMMITTEE_ENDORSED");

    // Age Gate 1b for the notice period (BR-09). The test switches the append-only trigger off for one statement.
    await db.execute(sql`alter table app.gate_action disable trigger gate_action_append_only`);
    await db.update(s.gateAction).set({ createdAt: daysAgo(30) }).where(eq(s.gateAction.milestoneInstanceId, mid));
    await db.execute(sql`alter table app.gate_action enable trigger gate_action_append_only`);

    // Date and checklist: TDW 03, TDW 11 verified, every NDA verified, TDW 12, OR (INV-13).
    const date = isoDay(10);
    const { attemptId } = await proposeDefenseDate(as(student), mid, date);
    const start = new Date(`${date}T02:00:00Z`);
    await expect(confirmDefenseDate(as(coordinator), mid, { startsAt: start, roomOrLink: "Room 303" })).rejects.toMatchObject({ code: "checklist_incomplete" });
    for (const code of ["TDW_03", "TDW_12", "OR"]) await scan(code);
    await confirmDefenseDate(as(coordinator), mid, { startsAt: start, roomOrLink: "Room 303" });
    expect(await status()).toBe("DEFENSE_SCHEDULED");

    // Defense Day (context C): a member posts on the locked commit. Only Final Panel members can (BR-20).
    await expect(postThread(as(adviser), { commitId: v1.commitId, body: "x" })).rejects.toThrow(/cannot post/);
    const day = await postThread(as(extra[0]!), { commitId: v1.commitId, body: "Explain the framework." });
    expect(await listThreads(as(student), mid)).toEqual([]); // hidden until the defense closes

    // TDW 13: one sheet for each Final Panel member, with scores. The Adviser has none. The Panel Chair records the verdict (INV-15).
    const rubric = await db.select().from(s.rubricIndicator).where(eq(s.rubricIndicator.templateVersionId, m3!.templateVersionId));
    const sheet = { actionTaken: "approved" as const, scores: rubric.map((r) => ({ indicatorId: r.id, score: r.weightPct })), comments: [{ section: "general_observations" as const, body: "Well done." }] };
    for (const u of members) await saveSheet(as(u), attemptId, sheet, new Date());
    await expect(recordVerdict(as(lead), mid, "approved")).rejects.toThrow();
    expect((await recordVerdict(as(chair), mid, "approved")).warnings).toEqual([]);
    await markDefenseHeld(as(chair), mid);

    // Close: printed copies, signed sheets verified, Minutes.
    await recordPrintedCopies(as(coordinator), attemptId, 6);
    await checkPrintedCopies(as(coordinator), attemptId, "matched");
    for (const e of await db.select().from(s.evaluationEntry).where(eq(s.evaluationEntry.defenseAttemptId, attemptId))) {
      expect(e.form).toBe("TDW_13");
      await confirmSheetUpload(as(coordinator), e.id, { key: `agent-a/flow/scan/${nextKey()}.pdf`, sha256: SHA, size: 100, contentType: "application/pdf" }, files);
      await verifySheet(as(coordinator), e.id, "matched");
    }
    await issueMinutes(as(coordinator), attemptId, "The Final Panel approved the thesis.");
    await closeDefense(as(coordinator), mid);
    expect(await status()).toBe("CLOSED");

    // The Student sees the threads now, and replies. Gate 2 waits for the author to resolve (INV-22).
    expect(await listThreads(as(student), mid)).toHaveLength(1);
    await replyToThread(as(student), day.threadId, "Explained in section 2.");
    await expect(approveGate2(as(extra[0]!), mid)).rejects.toMatchObject({ code: "clearance_incomplete" }); // IPMO and RPO first
    for (const [kind, value] of [["ipmo", "PASSED"], ["rpo", "DONE"]] as const) await setOutsideStatus(as(coordinator), mid, kind, value);
    await expect(approveGate2(as(extra[0]!), mid)).rejects.toMatchObject({ code: "open_threads" });
    await resolveThread(as(extra[0]!), day.threadId);

    // Gate 2: one approval for each member, then the signed final manuscript (INV-34), then FINAL_APPROVED.
    await expect(approveGate2(as(adviser), mid)).rejects.toThrow();
    for (const u of members) await approveGate2(as(u), mid);
    await expect(transitionMilestone(as(coordinator), mid, "FINAL_APPROVED")).rejects.toMatchObject({ code: "signed_final_missing" });
    await scan("SIGNED_FINAL_MANUSCRIPT");
    await expect(transitionMilestone(as(adviser), mid, "FINAL_APPROVED")).rejects.toMatchObject({ code: "wrong_actor" });
    await transitionMilestone(as(coordinator), mid, "FINAL_APPROVED");
    expect(await status()).toBe("FINAL_APPROVED");

    // Clearance (FR-CLR-01 to 04): the Student uploads evidence, the Coordinator verifies, the Panel loses access at the final copy (BR-21).
    await setOutsideStatus(as(coordinator), mid, "copyright", "REGISTERED");
    await expect(transitionMilestone(as(coordinator), mid, "CLEARED")).rejects.toMatchObject({ code: "clearance_incomplete" });
    for (const kind of ["final_copy", "conference_cert", "journal_pub"] as const) {
      await expect(verifyClearanceItem(as(coordinator), { milestoneId: mid, kind, matchesApproved: true })).rejects.toThrow(/evidence/);
      await scan(EVIDENCE_FORM[kind], null, false);
    }
    expect(await manuscriptAccessEnded(as(coordinator), f.thesisId)).toBe(false);
    for (const kind of ["final_copy", "conference_cert", "journal_pub"] as const) {
      await verifyClearanceItem(as(coordinator), { milestoneId: mid, kind, matchesApproved: true });
    }
    expect(await manuscriptAccessEnded(as(coordinator), f.thesisId)).toBe(true);
    expect((await clearanceView(as(student), mid)).rows.every((r) => r.done)).toBe(true);
    await transitionMilestone(as(coordinator), mid, "CLEARED");
    expect(await status()).toBe("CLEARED");
  }, 30_000);
});
