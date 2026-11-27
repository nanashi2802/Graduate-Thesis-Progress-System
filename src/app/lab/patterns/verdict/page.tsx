// /lab/patterns/verdict (Task R6.4, R6-b A, R6-c A): the P4 verdict panel for the Lead Panel Member or the Panel Chair.
// A missing sheet is a flag and never blocks (F2, BR-17). Refresh every 30 s, a Refresh button, "Updated hh:mm PHT".
import { Demo, LabHeader, ThemeStack } from "../../_mock/panels";
import { VerdictDemo } from "../../_mock/r6-demos";

export default function Page() {
  return (
    <>
      <LabHeader
        title="Verdict panel (R6.4)"
        round="R6 · UX-P-06"
        states={["open: 1 sheet not saved (flag, the control stays open)", "an Action Taken that differs (flag on the row)", "all sheets saved", "before the defense date (blocked with its reason)", "closed (the recorded verdict as text, done stamp)"]}
      />
      <ThemeStack>
        <Demo title="Open: 1 sheet is not saved yet, and one Action Taken differs. Record verdict stays open and asks once more.">
          <VerdictDemo mode="open" />
        </Demo>
        <Demo title="All sheets saved">
          <VerdictDemo mode="all-saved" />
        </Demo>
        <Demo title="Before the defense date: Record verdict shows its reason">
          <VerdictDemo mode="before-date" />
        </Demo>
        <Demo title="Closed (R6-b A): no control and no Refresh">
          <VerdictDemo mode="closed" />
        </Demo>
      </ThemeStack>
    </>
  );
}
