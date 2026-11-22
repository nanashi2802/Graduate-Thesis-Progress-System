// The clearance checklist of Milestone 3 (FR-CLR-01 to 04, BR-21, INV-33, AD-A-029). Server only.
// IPMO, RPO, copyright and Gate 2 come from their own records. The Coordinator verifies the other three.
import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import type { ClearanceKind, FormCode } from "./schema";
import { requireActive, type DataContext } from "./access";
import { recordAudit } from "./audit";
import { InputProblem, requireCoordinator } from "./coordinator";
import type { Db } from "./db";
import { currentOutsideStatuses } from "./outside";
import { clearanceItem, documentRecord, milestoneInstance } from "./schema";
import { requireThesisRead } from "./scope";

export type ClearanceRow = {
  kind: ClearanceKind;
  label: string;
  /** `record`: derived from another record. `coordinator`: the Coordinator verifies it. */
  source: "record" | "coordinator";
  done: boolean;
  verifiedAt: Date | null;
};

const LABELS: Record<ClearanceKind, string> = {
  ipmo: "IPMO check passed",
  rpo: "RPO editing done",
  gate_2: "Gate 2 approved by the Final Panel",
  copyright: "Copyright registered",
  final_copy: "Final copy received and matched to the approved manuscript",
  conference_cert: "Conference presentation certification",
  journal_pub: "Journal publication copy or acceptance",
};
export const CLEARANCE_KINDS = Object.keys(LABELS) as ClearanceKind[];
export const COORDINATOR_KINDS = ["final_copy", "conference_cert", "journal_pub"] as const satisfies readonly ClearanceKind[];

export const EVIDENCE_FORM = {
  final_copy: "FINAL_COPY",
  conference_cert: "CONFERENCE_CERT",
  journal_pub: "JOURNAL_PUB",
} as const satisfies Record<(typeof COORDINATOR_KINDS)[number], FormCode>;

// Call only after an access check.
export async function clearanceStatuses(db: Db, milestoneId: string, gate2Complete: boolean): Promise<ClearanceRow[]> {
  const outside = await currentOutsideStatuses(db, milestoneId);
  const stored = await db.select().from(clearanceItem).where(eq(clearanceItem.milestoneInstanceId, milestoneId));
  const derived: Partial<Record<ClearanceKind, boolean>> = {
    ipmo: outside.ipmo === "PASSED",
    rpo: outside.rpo === "DONE",
    copyright: outside.copyright === "REGISTERED",
    gate_2: gate2Complete,
  };
  return CLEARANCE_KINDS.map((kind) => {
    const row = stored.find((r) => r.kind === kind);
    const fromRecord = kind in derived;
    return {
      kind,
      label: LABELS[kind],
      source: fromRecord ? "record" : "coordinator",
      done: fromRecord ? Boolean(derived[kind]) : Boolean(row),
      verifiedAt: row?.verifiedAt ?? null,
    };
  });
}

// INV-33, BR-21: the `final_copy` item ends the Panel Member's access to the manuscript.
export async function finalCopyRecorded(db: Db, thesisId: string): Promise<boolean> {
  const rows = await db
    .select({ id: clearanceItem.id })
    .from(clearanceItem)
    .innerJoin(milestoneInstance, eq(milestoneInstance.id, clearanceItem.milestoneInstanceId))
    .where(and(eq(milestoneInstance.thesisInstanceId, thesisId), eq(clearanceItem.kind, "final_copy")));
  return rows.length > 0;
}

/** FR-CLR-01, FR-CLR-04: every role with access to the thesis sees the checklist. It is the exit view. */
export async function readClearance(ctx: DataContext, milestoneId: string, gate2Complete: boolean): Promise<ClearanceRow[]> {
  requireActive(ctx.actor);
  const [m] = await ctx.db.select().from(milestoneInstance).where(eq(milestoneInstance.id, milestoneId));
  if (!m || m.milestoneCode !== "final") throw new InputProblem("Only Milestone 3 has a clearance checklist.");
  await requireThesisRead(ctx, m.thesisInstanceId);
  return clearanceStatuses(ctx.db, milestoneId, gate2Complete);
}

/**
 * FR-CLR-02, FR-CLR-03: the Coordinator verifies one item. For the final copy the Coordinator
 * also confirms that it matches the approved manuscript. A verified item stays (BR-19).
 */
export async function verifyClearanceItem(
  ctx: DataContext,
  input: { milestoneId: string; kind: (typeof COORDINATOR_KINDS)[number]; matchesApproved?: boolean },
): Promise<void> {
  requireCoordinator(ctx, "verifies clearance items");
  if (!(COORDINATOR_KINDS as readonly string[]).includes(input.kind)) {
    throw new InputProblem("This item comes from another record. Change that record instead.");
  }
  const [m] = await ctx.db.select().from(milestoneInstance).where(eq(milestoneInstance.id, input.milestoneId));
  if (!m || m.milestoneCode !== "final") throw new InputProblem("Only Milestone 3 has a clearance checklist.");
  // The checklist opens after Gate 2 (ERD §7.1: FINAL_APPROVED leads to CLEARED).
  if (m.status !== "FINAL_APPROVED") throw new InputProblem("Verify clearance items after the milestone is FINAL_APPROVED.");
  if (input.kind === "final_copy" && input.matchesApproved !== true) {
    throw new InputProblem("Check the final copy against the approved manuscript first (FR-CLR-03).");
  }
  // FR-CLR-02: the Student uploads the evidence first. The row links to that scan.
  const [evidence] = await ctx.db
    .select({ id: documentRecord.id })
    .from(documentRecord)
    .where(
      and(
        eq(documentRecord.milestoneInstanceId, m.id),
        eq(documentRecord.formCode, EVIDENCE_FORM[input.kind]),
        inArray(documentRecord.state, ["locked_as_submitted", "physical_received", "verified"]),
      ),
    );
  if (!evidence) throw new InputProblem("The Student has not uploaded the evidence for this item yet (FR-CLR-02).");
  await ctx.db.transaction(async (tx) => {
    const done = await tx
      .insert(clearanceItem)
      .values({ milestoneInstanceId: m.id, kind: input.kind, evidenceDocumentId: evidence.id, verifiedByUserId: ctx.actor.userId })
      .onConflictDoNothing()
      .returning({ id: clearanceItem.id });
    if (done.length === 0) throw new InputProblem("This item is already verified.");
    await recordAudit(
      { db: tx, actor: ctx.actor },
      { action: "clearance.verify", targetTable: "milestone_instance", targetId: m.id, detail: { kind: input.kind } },
    );
  });
}

