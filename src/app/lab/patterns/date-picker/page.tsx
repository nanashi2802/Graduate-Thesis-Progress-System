// /lab/patterns/date-picker (Task R6.2, R6-a A: S4 only): the defense date with the BR-09 limit. In the demo, Gate 1b
// was on 12 Jan 2027, so days before 19 Jan 2027 are blocked with the reason. Try the keyboard: arrows, Home, End,
// Page Up, Page Down, Enter.
import { Demo, LabHeader, ThemePanels } from "../../_mock/panels";
import { DatePickerDemo } from "../../_mock/r6-demos";

export default function Page() {
  return (
    <>
      <LabHeader
        title="Date picker (R6.2)"
        round="R6 · UX-P-06"
        states={["no date chosen (Propose date blocked with its reason)", "a date chosen", "days before the earliest date blocked with the BR-09 reason", "locked before Gate 1b"]}
      />
      <ThemePanels>
        <Demo title="No date chosen: the focus starts on the earliest date">
          <DatePickerDemo mode="empty" />
        </Demo>
        <Demo title="A date chosen: Propose date is the one maroon action">
          <DatePickerDemo mode="chosen" />
        </Demo>
        <Demo title="Before Gate 1b: no calendar, the action shows its reason">
          <DatePickerDemo mode="locked" />
        </Demo>
      </ThemePanels>
    </>
  );
}
