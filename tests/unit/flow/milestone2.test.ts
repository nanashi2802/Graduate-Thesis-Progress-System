// P2-E05: the Milestone 2 exit test. The Student of the Milestone 1 flow goes through the Pre-Final Defense with every role:
// the IPMO gate, no new appointment, TDW 09, a comments-only TDW 10 sheet, revision items and the close that opens Milestone 3.
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { listLogEntries } from "@/server/data/consultations";
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
import { confirmScanUpload, deliverables, requestScanUpload, reviewDocument } from "@/server/data/documents";
import { confirmCommitUpload, markCommitReady, postThread, replyToThread, resolveThread } from "@/server/data/manuscript";
import { endorseGate1b, transitionMilestone } from "@/server/data/milestones";
import { setOutsideStatus } from "@/server/data/outside";
import { acceptRevision, addRevisionItems, linkRevisionToCommit, listRevisionItems } from "@/server/data/revisions";
import * as s from "@/server/data/schema";
import { as, daysAgo, files, isoDay, nextKey, runMilestone1, SHA } from "../../support/flow";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let close: () => Promise<void>;
beforeAll(async () => {
  ({ db, close } = await makeTestDb());
});
afterAll(() => close());

describe("Milestone 2: Pre-Final Defense with every role", () => {
  it("runs from the open of Milestone 2 to its close, which opens Milestone 3", async () => {
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
  });
});
