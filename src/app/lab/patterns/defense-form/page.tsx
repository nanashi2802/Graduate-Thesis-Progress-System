// /lab/patterns/defense-form (Task R6.3, R6-b A, R6-d A): the A5 and P4 evaluation sheet on Defense Day. 48 px number
// steppers, the total as an ink number, "Saved. Sign the paper sheet." after a save only. No autosave.
import { Demo, LabHeader, ThemeStack } from "../../_mock/panels";
import { DefenseFormDemo } from "../../_mock/r6-demos";

export default function Page() {
  return (
    <>
      <LabHeader
        title="Defense Day sheet (R6.3)"
        round="R6 · UX-P-06"
        states={["open (save, then the paper line)", "server error in the slot", "before the start (Save blocked with its reason)", "verified (values as text, done stamp)", "closed (values as text, done stamp)", "loading"]}
      />
      <ThemeStack>
        <Demo title="Open: change a score with − and +, or type it. Save my evaluation, then the paper line shows (BR-01).">
          <DefenseFormDemo mode="edit" />
        </Demo>
        <Demo title="The server refuses: the error stays in the slot, the scores stay">
          <DefenseFormDemo mode="error" />
        </Demo>
        <Demo title="Before the start (BR-10): Save shows its reason">
          <DefenseFormDemo mode="before-start" />
        </Demo>
        <Demo title="Verified by the Coordinator (R6-b A): no field, so nothing can be typed and lost (UX-023)">
          <DefenseFormDemo mode="verified" />
        </Demo>
        <Demo title="The defense is closed (R6-b A)">
          <DefenseFormDemo mode="closed" />
        </Demo>
        <Demo title="Loading (R6.6)">
          <DefenseFormDemo mode="loading" />
        </Demo>
      </ThemeStack>
    </>
  );
}
