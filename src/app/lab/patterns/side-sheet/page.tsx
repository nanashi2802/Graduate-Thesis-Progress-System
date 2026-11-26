// /lab/patterns/side-sheet (Task R3.6): the C2 "Add a Student" form in a side sheet. The page follows the lab theme.
// Query: ?width=400|480|560 (R3-d), ?scrim=token (R3-g A), ?open=1 (open on load, for shots), ?error=1 (the server
// names the email field).
import { Suspense } from "react";
import type { SheetWidth } from "@/components/patterns/side-sheet";
import { Demo, LabHeader, OptionGroups, flat } from "../../_mock/panels";
import { SideSheetDemo } from "../../_mock/r3-demos";

export default function Page(props: PageProps<"/lab/patterns/side-sheet">) {
  return (
    <Suspense>
      <Variant {...props} />
    </Suspense>
  );
}

async function Variant({ searchParams }: PageProps<"/lab/patterns/side-sheet">) {
  const q = flat(await searchParams);
  const width: SheetWidth = q.width === "400" || q.width === "560" ? q.width : "480";
  // R3-g A (chosen at UX-P-03). The query still reaches option B for a comparison.
  const scrim = q.scrim === "foreground" ? "foreground" : "token";
  const link = (extra: Record<string, string>) =>
    `?${new URLSearchParams({ width, ...(q.scrim ? { scrim: q.scrim } : {}), open: "1", ...extra })}`;
  return (
    <>
      <LabHeader
        title="Side sheet (R3.6)"
        round="R3 · UX-P-03"
        states={["opens from the right", "focus trap, Escape closes, focus returns", "width (R3-d)", "full width below 640 px", "backdrop (R3-g)", "sticky footer with the one primary action", "form fields (R3.7)", "server field error"]}
      />
      <p className="mb-2 max-w-[72ch] text-sm text-text-secondary">Chosen at UX-P-03: R3-d B (480 px, full width below 640 px), R3-g A (the --scrim backdrop).</p>
      <OptionGroups
        base="/lab/patterns/side-sheet"
        groups={[
          {
            label: "State",
            links: [
              { label: "Server accepts", query: link({}), current: q.error !== "1" },
              { label: "Server names the email field", query: link({ error: "1" }), current: q.error === "1" },
            ],
          },
        ]}
      />
      <Demo title={`C2 Add a Student: ${width} px, ${scrim === "token" ? "--scrim token" : "R2 backdrop"} (follows the lab theme)`}>
        <SideSheetDemo key={`${width}-${scrim}-${q.open}-${q.error}`} width={width} scrim={scrim} defaultOpen={q.open === "1"} fieldError={q.error === "1"} />
      </Demo>
    </>
  );
}
