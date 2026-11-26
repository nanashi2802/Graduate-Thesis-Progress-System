// /lab/patterns/queue-table (Task R3.1): the C1 action queue (compact, grouped, sortable), the C2 Student list (long
// title, flag glyph), the A1 queue (comfortable, one primary row action), the empty states and the loading shape.
// Query: ?phone=scroll (R3-b B), ?text=clamp (R3-c B), ?action=link (R3-f B).
import { Suspense } from "react";
import { LoadingBlocks } from "@/components/patterns/loading";
import { Demo, LabHeader, ThemeStack, flat } from "../../_mock/panels";
import { A1QueueDemo, BlockedRowActionSample, C1QueueDemo, C2StudentsDemo, type TableOptions } from "../../_mock/r3-demos";

export default function Page(props: PageProps<"/lab/patterns/queue-table">) {
  return (
    <Suspense>
      <Variant {...props} />
    </Suspense>
  );
}

async function Variant({ searchParams }: PageProps<"/lab/patterns/queue-table">) {
  const q = flat(await searchParams);
  const opts: TableOptions = {
    phone: q.phone === "scroll" ? "scroll" : "stack",
    longText: q.text === "clamp" ? "clamp" : "tooltip",
    actionLook: q.action === "link" ? "link" : "button",
  };
  return (
    <>
      <LabHeader
        title="Queue table (R3.1)"
        round="R3 · UX-P-03"
        states={["compact 48 px, fixed columns", "comfortable 56 px", "grouped by queue", "collapsible groups", "sortable headers (aria-sort)", "equal row actions", "blocked row action", "long title (R3-c)", "phone (R3-b)", "empty", "loading"]}
      />
      <p className="mb-6 max-w-[72ch] text-sm text-text-secondary">
        Chosen at UX-P-03: R3-b A (stacked rows on a phone), R3-c A (one line, full title in a tooltip), R3-f A (outline row actions). Group
        headers collapse and expand (owner, UX-P-03).
      </p>
      <ThemeStack>
        <Demo title="C1 action queue: compact, grouped by queue, sort by Student or Waiting. Click a group header to collapse or expand it.">
          <div className="w-full">
            <C1QueueDemo opts={opts} />
          </div>
        </Demo>
        <Demo title="The same queue with two groups collapsed on load (the count stays)">
          <div className="w-full">
            <C1QueueDemo opts={opts} collapsed={["Check scans", "Confirm dates"]} />
          </div>
        </Demo>
        <Demo title="C2 Students: a 200-character title on one line (hover or focus shows it all), a flag glyph with its reason">
          <div className="w-full">
            <C2StudentsDemo opts={opts} />
          </div>
        </Demo>
        <Demo title="A1 queue: comfortable, the one maroon row action of the screen (R3-f A)">
          <div className="w-full">
            <A1QueueDemo opts={opts} />
          </div>
        </Demo>
        <Demo title="Empty: C1 first day (the one maroon action is Add faculty), A1 first day">
          <div className="grid w-full gap-4 lg:grid-cols-2">
            <C1QueueDemo opts={opts} empty />
            <A1QueueDemo opts={opts} empty />
          </div>
        </Demo>
        <Demo title="Loading: the compact rows shape (R3.8)">
          <div className="w-full">
            <LoadingBlocks shape="rows-compact" rows={4} label="Loading the action queue" />
          </div>
        </Demo>
        <Demo title="A blocked row action: 132 × 32 px, the reason under it (BR-18)">
          <BlockedRowActionSample />
        </Demo>
      </ThemeStack>
    </>
  );
}
