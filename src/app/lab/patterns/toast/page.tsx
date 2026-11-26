// /lab/patterns/toast (Task R2.3, UX-D-04): the toast for small confirmations only. 4 s, polite, pause on hover
// and focus. A workflow result (Returned, Endorsed, Scheduled, Verified) stays on the screen, never in a toast.
import { ToastCard } from "@/components/patterns/toast";
import { WORKFLOW_RESULTS } from "@/components/patterns/toast/options";
import { Demo, LabHeader, ThemePanels } from "../../_mock/panels";
import { ToastDemo } from "../../_mock/r2-demos";

export default function Page() {
  return (
    <>
      <LabHeader title="Toast (R2.3)" round="R2 · UX-P-02" states={["done", "neutral", "returned (small failure)", "live: 4 s, bottom right, max 3"]} />
      <ThemePanels>
        <Demo title="The look">
          <div className="flex w-80 flex-col gap-2">
            <ToastCard label="Preferences saved." tone="done" />
            <ToastCard label="Availability published." tone="done" glyph="calendar" />
            <ToastCard label="Slot requested." tone="neutral" glyph="calendar" />
            <ToastCard label="File uploaded." tone="done" glyph="received" />
            <ToastCard label="The file did not upload. Try again." tone="returned" glyph="flag" />
          </div>
        </Demo>
        <Demo title="Live (opens in the page theme, bottom right)">
          <ToastDemo />
        </Demo>
        <Demo title="Never a toast (UX-D-04): these stay on the screen">
          <p className="max-w-[60ch] text-sm text-muted-foreground">{WORKFLOW_RESULTS.join(", ")}. The pattern refuses these words.</p>
        </Demo>
      </ThemePanels>
    </>
  );
}
