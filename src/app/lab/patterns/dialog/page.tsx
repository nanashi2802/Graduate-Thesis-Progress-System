// /lab/patterns/dialog (Task R3.5): the ConfirmDialog for each permanent action of UX-010. The page follows the lab
// theme. Query: ?focus=confirm (R3-e B), ?open=verify|endorse1b|… (open on load, for shots).
import { Suspense } from "react";
import { confirmCopy } from "@/components/patterns/dialog/copy";
import { Demo, LabHeader, OptionGroups, flat } from "../../_mock/panels";
import { DialogDemo } from "../../_mock/r3-demos";

export default function Page(props: PageProps<"/lab/patterns/dialog">) {
  return (
    <Suspense>
      <Variant {...props} />
    </Suspense>
  );
}

const SAMPLES = [
  confirmCopy({ kind: "verify", form: "TDW_12", student: "Dino Aquino" }),
  confirmCopy({ kind: "endorse1a", student: "Bea Santos" }),
  confirmCopy({ kind: "endorse1b", student: "Dino Aquino" }),
  confirmCopy({ kind: "gate2", student: "Dino Aquino" }),
  confirmCopy({ kind: "verdict", student: "Hugo Ramos" }),
  confirmCopy({ kind: "scanMatches", form: "TDW_08", student: "Hugo Ramos" }),
  confirmCopy({ kind: "closeStage", student: "Hugo Ramos" }),
];

async function Variant({ searchParams }: PageProps<"/lab/patterns/dialog">) {
  const q = flat(await searchParams);
  // R3-e A (chosen at UX-P-03). The query still reaches option B for a comparison. R3-g A is the one backdrop (R3.10).
  const focus = q.focus === "confirm" ? "confirm" : "cancel";
  const keep = (extra: string) => `?${new URLSearchParams({ ...(q.focus ? { focus: q.focus } : {}), ...Object.fromEntries(new URLSearchParams(extra)) })}`;
  return (
    <>
      <LabHeader
        title="Confirm dialog (R3.5)"
        round="R3 · UX-P-03"
        states={["each permanent action of UX-010", "focus start (R3-e)", "backdrop (R3-g)", "pending", "server error inside the dialog", "Escape and focus return"]}
      />
      <p className="mb-2 max-w-[72ch] text-sm text-text-secondary">Chosen at UX-P-03: R3-e A (focus starts on Cancel), R3-g A (the --scrim backdrop).</p>
      <OptionGroups
        base="/lab/patterns/dialog"
        groups={[
          {
            label: "Open on load (for shots)",
            links: [
              { label: "Verify", query: keep("open=verify") },
              { label: "Gate 1b", query: keep("open=endorse1b") },
            ],
          },
        ]}
      />
      <div className="flex flex-col gap-8">
        <Demo title="Open each dialog (follows the lab theme). Confirm waits 0.7 s; the last one shows a server error.">
          <DialogDemo key={`${focus}-${q.open ?? ""}`} focus={focus} initialOpen={q.open} />
        </Demo>
        <Demo title="The copy of each dialog (title, one-sentence body, confirm label)">
          <table className="w-full max-w-[960px] text-left text-sm">
            <caption className="sr-only">Dialog copy</caption>
            <thead>
              <tr className="border-b border-divider-strong text-[0.8rem] text-muted-foreground">
                <th scope="col" className="py-2 pr-4 font-semibold">Title</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Body</th>
                <th scope="col" className="py-2 font-semibold">Confirm</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLES.map((c) => (
                <tr key={c.title} className="border-b border-border">
                  <td className="py-2 pr-4">{c.title}</td>
                  <td className="py-2 pr-4 text-text-secondary">{c.body}</td>
                  <td className="py-2 font-medium">{c.confirmLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Demo>
      </div>
    </>
  );
}
