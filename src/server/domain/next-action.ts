// The next-action card (FR-TRK-01, NFR-04, UTP §3.2 S1): who acts now, one sentence, and one primary action.
// Pure code. It reads the status and a few facts, and follows the transition table in `milestone.ts`.
// A Flag never changes it (BR-17). Texts follow AGENTS.md §5 and §8.

import type { MilestoneCode, MilestoneFacts, MilestoneStatus, PstDate } from "./milestone";

/** `none`: no one acts. The record waits for time or for a later step. */
export type NextActor = "student" | "adviser" | "coordinator" | "panel_member" | "committee" | "none";

export type NextAction = {
  actor: NextActor;
  /** One sentence for the Student. */
  text: string;
  /** The label of the one primary button for the Student, or null when the Student waits (BR-18). */
  action: string | null;
};

export type NextActionFacts = Pick<MilestoneFacts, "returnReason" | "minNoticeDays"> & {
  defenseDate: PstDate | null;
  /** The Adviser approved data gathering after the Certification (FR-WFL-11). */
  dataGatheringApproved?: boolean;
};

const wait = (actor: NextActor, text: string): NextAction => ({ actor, text, action: null });
const act = (text: string, action: string): NextAction => ({ actor: "student", text, action });

export function nextAction(m: MilestoneCode, status: MilestoneStatus, f: NextActionFacts): NextAction {
  const committee = m === "final" ? "Final Panel" : "Evaluation Committee";
  switch (status) {
    case "DRAFT":
    case "RETURNED":
      // The system moves RETURNED to DRAFT at once (INV-18). The Student reads the reason (BR-13).
      return act(
        f.returnReason
          ? `Your manuscript was returned: ${f.returnReason} Fix it, then mark it Ready.`
          : "Upload your manuscript, then mark it Ready for your Adviser.",
        "Open the manuscript",
      );
    case "READY":
      return wait("adviser", "Your Adviser reviews your commit (Gate 1a).");
    case "ADVISER_ENDORSED":
      return m === "pre_final"
        ? wait("committee", "Your Adviser and your Panel Members review your commit (Gate 1b).")
        : wait("coordinator", `The Coordinator appoints your ${committee}.`);
    case "COMMITTEE_APPOINTED":
      return wait("committee", "Your Adviser and your Panel Members review your commit (Gate 1b).");
    case "COMMITTEE_ENDORSED":
      return act(`Choose a defense date at least ${f.minNoticeDays} days after Gate 1b.`, "Choose a date");
    case "DATE_PROPOSED":
      return wait("coordinator", "The Coordinator confirms the date and the room.");
    case "DEFENSE_SCHEDULED":
      return wait("none", f.defenseDate ? `Your defense is on ${f.defenseDate}. Prepare for it.` : "Your defense is scheduled. Prepare for it.");
    case "DEFENSE_HELD":
      return wait("coordinator", "The Coordinator closes the stage after the sheets and the minutes are verified.");
    case "CLOSED":
      if (m === "proposal") return act("Finish the revision items, then upload the signed Certification.", "Open documents");
      if (m === "final") return act("Upload the signed final manuscript.", "Open documents");
      return act("Finish the revision items for your Panel Members to accept.", "Open the manuscript");
    case "CERTIFIED":
      return f.dataGatheringApproved
        ? wait("none", "Your Proposal is certified. Data gathering is approved.")
        : wait("adviser", "Your Proposal is certified. Your Adviser approves the start of data gathering.");
    case "FINAL_APPROVED":
      return act("Finish your clearance items.", "Open clearance");
    case "CLEARED":
      return wait("none", "All milestones are done.");
  }
}
