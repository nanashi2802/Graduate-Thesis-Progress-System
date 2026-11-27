// /lab/patterns/consultation-log (Task R6.5): the A3 consultation log with the TDW 03 columns, on the queue-table
// pattern in comfortable density.
import { Demo, LabHeader, ThemeStack } from "../../_mock/panels";
import { ConsultationLogDemo } from "../../_mock/r6-demos";

export default function Page() {
  return (
    <>
      <LabHeader title="Consultation log (R6.5)" round="R6 · UX-P-06" states={["entries (one to confirm)", "first day", "loading"]} />
      <ThemeStack>
        <Demo title="Entries: the topics stay on one line, with the full text on hover and focus (R3-c A)">
          <div className="w-full"><ConsultationLogDemo view="rows" /></div>
        </Demo>
        <Demo title="First day">
          <div className="w-full"><ConsultationLogDemo view="empty" /></div>
        </Demo>
        <Demo title="Loading">
          <div className="w-full"><ConsultationLogDemo view="loading" /></div>
        </Demo>
      </ThemeStack>
    </>
  );
}
