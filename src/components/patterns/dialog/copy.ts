// Source: DESIGN.md §8.9 (gate and Verify dialogs), UX-010, BR-19, Task R3.5. Plain data: server pages can call it.
// The dialog text for each permanent action. The title names the action and the record; the body names the effect
// in one sentence; the confirm button repeats the verb. The UI says Endorse and Return, never approve or reject.
import { formLabel } from "@/components/patterns/status/labels";

/** The permanent actions of UX-010. */
export type ConfirmKind =
  | { kind: "verify"; form: string; student: string }
  | { kind: "endorse1a"; student: string }
  | { kind: "endorse1b"; student: string }
  | { kind: "gate2"; student: string }
  | { kind: "verdict"; student: string }
  | { kind: "scanMatches"; form: string; student: string }
  | { kind: "closeStage"; student: string };

export type ConfirmCopy = { title: string; body: string; confirmLabel: string };

export function confirmCopy(k: ConfirmKind): ConfirmCopy {
  switch (k.kind) {
    case "verify":
      return { title: `Verify ${formLabel(k.form)} for ${k.student}?`, body: "This locks the document.", confirmLabel: "Verify" };
    case "endorse1a":
      return { title: `Endorse the proposal of ${k.student} (Gate 1a)?`, body: "This records your endorsement, and you cannot undo it.", confirmLabel: "Endorse (Gate 1a)" };
    case "endorse1b":
      return {
        title: `Endorse ${k.student} for defense (Gate 1b)?`,
        body: "This locks the manuscript until the defense closes.",
        confirmLabel: "Endorse and lock manuscript",
      };
    case "gate2":
      return { title: `Endorse the final manuscript of ${k.student} (Gate 2)?`, body: "This records the final manuscript, and you cannot undo it.", confirmLabel: "Endorse (Gate 2)" };
    case "verdict":
      return { title: `Record the verdict for ${k.student}?`, body: "The Coordinator sees the verdict, and you cannot change it.", confirmLabel: "Record verdict" };
    case "scanMatches":
      return { title: `Mark the ${formLabel(k.form)} scan of ${k.student} as a match?`, body: "This verifies the sheet against the saved scores.", confirmLabel: "Scan matches" };
    case "closeStage":
      return { title: `Close the stage for ${k.student}?`, body: "This records the result and opens the next step.", confirmLabel: "Close the stage" };
  }
}

