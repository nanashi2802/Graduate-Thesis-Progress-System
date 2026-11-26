// Source: DESIGN.md §8.9 (gate and Verify dialogs), UX-010, BR-19, Task R3.5. Plain data: server pages can call it.
// The dialog text for each permanent action. The title names the action and the record; the body names the effect
// in one sentence; the confirm button repeats the verb. The UI says Endorse and Return, never approve or reject.
import { formLabel } from "@/components/patterns/status/labels";

/**
 * The permanent actions of UX-010. `student` is optional where the screen data has no Student name today (the PR
 * workspace and Defense Day, R3.10): the title then names the record only.
 */
export type ConfirmKind =
  | { kind: "verify"; form: string; student: string }
  | { kind: "endorse1a"; student?: string }
  | { kind: "endorse1b"; student?: string; /** This endorsement is the last one and locks the manuscript (BR-07). */ locks?: boolean }
  | { kind: "gate2"; student?: string }
  | { kind: "verdict"; student?: string }
  | { kind: "scanMatches"; form: string; student: string }
  | { kind: "closeStage"; student: string };

export type ConfirmCopy = { title: string; body: string; confirmLabel: string };

export function confirmCopy(k: ConfirmKind): ConfirmCopy {
  switch (k.kind) {
    case "verify":
      return { title: `Verify ${formLabel(k.form)} for ${k.student}?`, body: "This locks the document.", confirmLabel: "Verify" };
    case "endorse1a":
      return {
        title: k.student ? `Endorse the proposal of ${k.student} (Gate 1a)?` : "Endorse this commit (Gate 1a)?",
        body: "This records your endorsement, and you cannot undo it.",
        confirmLabel: "Endorse (Gate 1a)",
      };
    case "endorse1b":
      // R3.10: Gate 1b can need more than one endorsement. Only the last one locks the manuscript (BR-07), so only
      // that endorser sees "Endorse and lock manuscript" (`gate1bLocksOnEndorse`).
      return {
        title: k.student ? `Endorse ${k.student} for defense (Gate 1b)?` : "Endorse this commit for defense (Gate 1b)?",
        body: k.locks
          ? "Yours is the last endorsement, so this locks the manuscript until the defense closes."
          : "This records your endorsement, and the manuscript locks after the last endorsement.",
        confirmLabel: k.locks ? "Endorse and lock manuscript" : "Endorse (Gate 1b)",
      };
    case "gate2":
      return {
        title: k.student ? `Endorse the final manuscript of ${k.student} (Gate 2)?` : "Endorse the final manuscript (Gate 2)?",
        body: "This records the final manuscript, and you cannot undo it.",
        confirmLabel: "Endorse (Gate 2)",
      };
    case "verdict":
      // R3.10: the verdict seat can record the verdict again until the defense is held (FR-DEF-07).
      return {
        title: k.student ? `Record the verdict for ${k.student}?` : "Record this verdict?",
        body: "The Coordinator sees the verdict, and you can change it only until the defense is held.",
        confirmLabel: "Record verdict",
      };
    case "scanMatches":
      return { title: `Mark the ${formLabel(k.form)} scan of ${k.student} as a match?`, body: "This verifies the sheet against the saved scores.", confirmLabel: "Scan matches" };
    case "closeStage":
      return { title: `Close the stage for ${k.student}?`, body: "This records the result and opens the next step.", confirmLabel: "Close the stage" };
  }
}

