// /lab/states (Tasks R2.4 and R2.5, UX-011, UX-026): loading, error, empty, success toast, disabled with a reason,
// and the one form-feedback contract. In both themes. R3.7 adds the contract with the form-field pattern.
import { BlockedAction } from "@/components/patterns/blocked-action";
import { EmptyState } from "@/components/patterns/empty-state";
import { ErrorState } from "@/components/patterns/error";
import { FormFeedback } from "@/components/patterns/form-feedback";
import { LoadingBlocks, PageLoadingBlocks, Spinner } from "@/components/patterns/loading";
import { ToastCard } from "@/components/patterns/toast";
import { Demo, LabHeader, ThemePanels } from "../_mock/panels";
import { ErrorDemo, FormFeedbackDemo } from "../_mock/r2-demos";
import { FormContractDemo } from "../_mock/r3-demos";

export default function Page() {
  return (
    <>
      <LabHeader
        title="System states (R2.4, R2.5)"
        round="R2 · UX-P-02"
        states={["loading blocks (pulse or shimmer)", "loading shapes and page presets", "spinner", "inline error with Try again", "empty", "success toast", "disabled with a reason", "form feedback: pending, error, result"]}
      />
      <ThemePanels>
        <Demo title="Loading effect (UX-D-15): option A pulse (recommended), option B shimmer. Reduced motion: still.">
          <div className="grid w-full gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 font-mono text-xs text-muted-foreground">A: pulse</p>
              <LoadingBlocks rows={3} label="Loading the review queue" />
            </div>
            <div>
              <p className="mb-2 font-mono text-xs text-muted-foreground">B: shimmer</p>
              <LoadingBlocks rows={3} label="Loading the review queue" effect="shimmer" />
            </div>
          </div>
        </Demo>
        <Demo title="Loading shapes: rows (queue, table), cards, docket, form, list">
          <div className="grid w-full gap-6 sm:grid-cols-2">
            <LoadingBlocks shape="cards" rows={3} label="Loading the summary" className="sm:col-span-2" />
            <LoadingBlocks shape="docket" label="Loading the record" />
            <LoadingBlocks shape="list" rows={3} label="Loading the notifications" />
            <LoadingBlocks shape="form" rows={2} label="Loading the form" />
          </div>
        </Demo>
        <Demo title="Page presets for loading.tsx: dashboard, queue, record, form">
          <div className="grid w-full gap-6 sm:grid-cols-2">
            {(["dashboard", "queue", "record", "form"] as const).map((k) => (
              <div key={k}>
                <p className="mb-2 font-mono text-xs text-muted-foreground">{k}</p>
                <PageLoadingBlocks kind={k} label={`Loading the ${k}`} />
              </div>
            ))}
          </div>
        </Demo>
        <Demo title="Inline wait: spinner with a text (a pending button)">
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner /> Saving…
          </span>
        </Demo>
        <Demo title="Error inside the shell (role segment error.tsx at Integrate)">
          <ErrorState what="This page did not load." todo="Try again. If it fails again, tell the Coordinator." />
        </Demo>
        <Demo title="Error, live: Try again calls reset()">
          <ErrorDemo />
        </Demo>
        <Demo title="Empty">
          <EmptyState title="No defense is scheduled." body="The Coordinator sets the date after Gate 1b. It shows here then." />
        </Demo>
        <Demo title="Success: a toast for a small action">
          <div className="w-80">
            <ToastCard label="Availability published." tone="done" glyph="calendar" />
          </div>
        </Demo>
        <Demo title="Disabled with a reason (BR-18)">
          <BlockedAction reason="Locked until Gate 1b.">Choose a date</BlockedAction>
        </Demo>
        <Demo title="Form feedback contract (UX-011). Submit each form. The message slot keeps two lines free; the button keeps its width.">
          <div className="grid w-full gap-6 sm:grid-cols-3">
            <div>
              <p className="mb-2 font-mono text-xs text-muted-foreground">Small action → toast</p>
              <FormFeedbackDemo kind="small" />
            </div>
            <div>
              <p className="mb-2 font-mono text-xs text-muted-foreground">Error → alert, linked to the field</p>
              <FormFeedbackDemo kind="error" />
            </div>
            <div>
              <p className="mb-2 font-mono text-xs text-muted-foreground">Workflow → result on the screen</p>
              <FormFeedbackDemo kind="workflow" />
            </div>
          </div>
        </Demo>
        <Demo title="Form feedback in narrow columns (UX-D-16): idle, error, result, a 4-line message. The slots must line up.">
          <div data-demo="narrow-feedback" className="grid w-full max-w-[600px] grid-cols-2 items-start gap-3 sm:grid-cols-4">
            {[
              { id: "n1", state: { status: "idle" } as const },
              { id: "n2", state: { status: "error", message: "Enter a date on or after 19 Jan 2027.", field: "date" } as const },
              { id: "n3", state: { status: "done", message: "Returned to the Student. The reason is on the record." } as const },
              {
                id: "n4",
                state: {
                  status: "error",
                  message: "The server refused the date. The defense date must be at least 7 days after Gate 1b, and the printed copies are due 7 days before it.",
                } as const,
              },
            ].map((d) => (
              <div key={d.id} className="flex min-w-0 flex-col gap-2 rounded-control border border-dashed border-border p-2">
                <span className="font-mono text-[0.8rem] text-muted-foreground">{d.state.status}</span>
                <FormFeedback id={d.id} state={d.state} />
                <span className="text-[0.8rem] text-muted-foreground">Next field</span>
              </div>
            ))}
          </div>
        </Demo>
        <Demo title="Form feedback, static">
          <div className="flex flex-col gap-2">
            <FormFeedback id="s1" state={{ status: "error", message: "Enter a date on or after 19 Jan 2027.", field: "date" }} />
            <FormFeedback id="s2" state={{ status: "done", message: "Returned to the Student. The reason is on the record." }} />
          </div>
        </Demo>
      </ThemePanels>
      <div className="mt-8">
        <Demo title="R3.7: the one form-feedback contract with the form-field pattern (small action, workflow action, field error), lab theme">
          <FormContractDemo />
        </Demo>
      </div>
    </>
  );
}
