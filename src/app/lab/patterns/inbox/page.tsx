// /lab/patterns/inbox (Task R3.3): the C4 scan inbox with the states of design/screens/C4.md. The page follows the lab
// theme (an open dialog renders at the page root). Query: ?state=checking|return|returned|verified|empty, ?scan=d1…d4.
// "Verify" opens the ConfirmDialog; "Return" swaps the actions for the Return composer. Mock actions only.
import { Suspense } from "react";
import { PageLoadingBlocks } from "@/components/patterns/loading";
import { Demo, LabHeader, OptionLinks, flat } from "../../_mock/panels";
import { InboxDemo, type InboxState } from "../../_mock/r3-demos";

export default function Page(props: PageProps<"/lab/patterns/inbox">) {
  return (
    <Suspense>
      <Variant {...props} />
    </Suspense>
  );
}

const STATES: InboxState[] = ["checking", "return", "returned", "verified", "empty"];
const LABEL: Record<InboxState, string> = { checking: "Checking", return: "Writing a Return", returned: "Returned", verified: "Verified", empty: "First day" };

async function Variant({ searchParams }: PageProps<"/lab/patterns/inbox">) {
  const q = flat(await searchParams);
  const state = STATES.includes(q.state as InboxState) ? (q.state as InboxState) : "checking";
  return (
    <>
      <LabHeader
        title="Inbox (R3.3)"
        round="R3 · UX-P-03"
        states={["list 300 px, viewer, record 300 px at laptop", "record under the viewer below 1024 px", "oldest first", "checking", "writing a Return", "returned", "verified", "first day", "loading"]}
      />
      <OptionLinks
        base="/lab/patterns/inbox"
        links={STATES.map((s) => ({ label: LABEL[s], query: `?state=${s}${q.scan ? `&scan=${q.scan}` : ""}`, current: s === state }))}
      />
      <div className="flex flex-col gap-8">
        <Demo title={`C4 Scans to check: ${LABEL[state]} (follows the lab theme)`}>
          <div className="w-full">
            <InboxDemo key={`${state}-${q.scan ?? ""}`} initial={state} selectedId={q.scan} />
          </div>
        </Demo>
        <Demo title="Loading: the inbox preset (R3.8)">
          <div className="w-full">
            <PageLoadingBlocks kind="inbox" label="Loading the scans" />
          </div>
        </Demo>
      </div>
    </>
  );
}
