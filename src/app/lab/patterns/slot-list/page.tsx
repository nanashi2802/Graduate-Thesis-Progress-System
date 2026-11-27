// /lab/patterns/slot-list (Task R6.1): one slot list for S4, A4 and P3. A requested or confirmed slot names the Student
// (UX-039). At most 3 facts in a row: the time, the place and one state (G5).
import { Demo, LabHeader, ThemeStack } from "../../_mock/panels";
import { SlotListDemo } from "../../_mock/r6-demos";

export default function Page() {
  return (
    <>
      <LabHeader
        title="Slot list (R6.1)"
        round="R6 · UX-P-06"
        states={["S4 open slots (one maroon action)", "A4 and P3 my slots (Open, Requested by, Confirmed with)", "S4 my requests with the meeting link (FR-SCH-03)", "first day, Student and Adviser", "loading"]}
      />
      <ThemeStack>
        <Demo title="S4 open slots: Request this slot. The first row holds the one maroon action (G1).">
          <div className="w-full max-w-[960px]"><SlotListDemo view="open" /></div>
        </Demo>
        <Demo title="A4 and P3 my slots: the Student is named on a requested and a confirmed slot (UX-039). Remove only on an open slot.">
          <div className="w-full max-w-[960px]"><SlotListDemo view="mine" /></div>
        </Demo>
        <Demo title="S4 my requests: the meeting link shows to the booked Student (FR-SCH-03)">
          <div className="w-full max-w-[960px]"><SlotListDemo view="requests" /></div>
        </Demo>
        <Demo title="First day: Student (no slots from the Adviser)">
          <div className="w-full max-w-[960px]"><SlotListDemo view="empty-student" /></div>
        </Demo>
        <Demo title="First day: Adviser (Publish a slot is the one maroon action)">
          <div className="w-full max-w-[960px]"><SlotListDemo view="empty-adviser" /></div>
        </Demo>
        <Demo title="Loading (R6.6): the row height does not change when the data arrives">
          <div className="w-full max-w-[960px]"><SlotListDemo view="loading" /></div>
        </Demo>
      </ThemeStack>
    </>
  );
}
