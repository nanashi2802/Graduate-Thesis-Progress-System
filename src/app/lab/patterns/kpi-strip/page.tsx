// /lab/patterns/kpi-strip (Task R3.2): the C1 KPI strip. Each cell filters the queue (?q=…). The late style shows
// decision R3-a option A (chosen at UX-P-03): late after 5 days. First day: every count is 0. A 3-digit count keeps the height.
import { Suspense } from "react";
import { KpiStrip } from "@/components/patterns/kpi-strip";
import { LATE_POLICIES, type QueueKind } from "@/components/patterns/kpi-strip/late";
import { LoadingBlocks } from "@/components/patterns/loading";
import { Demo, LabHeader, ThemeStack, flat } from "../../_mock/panels";
import { C1_QUEUE, kpis } from "../../_mock/r3-data";

export default function Page(props: PageProps<"/lab/patterns/kpi-strip">) {
  return (
    <Suspense>
      <Variant {...props} />
    </Suspense>
  );
}

const KINDS: QueueKind[] = ["all", "scans", "dates", "committees", "defenses", "clearance"];

async function Variant({ searchParams }: PageProps<"/lab/patterns/kpi-strip">) {
  const q = flat(await searchParams);
  const sel = KINDS.includes(q.q as QueueKind) ? (q.q as QueueKind) : "all";
  const BIG: [number, number | null][] = [[128, 41], [64, 41], [9, 3], [0, null], [999, 12], [12, 7]];
  const big = kpis(C1_QUEUE, LATE_POLICIES.A, sel).map((k, i) => ({ ...k, count: BIG[i]![0], oldestDays: BIG[i]![1], late: (BIG[i]![1] ?? 0) > 5 }));
  return (
    <>
      <LabHeader
        title="KPI strip (R3.2)"
        round="R3 · UX-P-03"
        states={["working", "selected cell (aria-current)", "late age (R3-a A, 5 days)", "count 0 muted", "first day", "3-digit counts", "loading"]}
      />
      <ThemeStack>
        <Demo title="R3-a option A (chosen at UX-P-03): one value, late after 5 days">
          <div className="w-full">
            <KpiStrip items={kpis(C1_QUEUE, LATE_POLICIES.A, sel)} />
          </div>
        </Demo>
        <Demo title="First day: every count is 0 and muted, no age">
          <div className="w-full">
            <KpiStrip items={kpis([], LATE_POLICIES.C, "all")} label="Queues, first day" />
          </div>
        </Demo>
        <Demo title="3-digit counts: the cell keeps its height (UX-D-16)">
          <div className="w-full">
            <KpiStrip items={big} label="Queues, large counts" />
          </div>
        </Demo>
        <Demo title="Loading: the KPI shape (R3.8)">
          <div className="w-full">
            <LoadingBlocks shape="kpi" label="Loading the queues" />
          </div>
        </Demo>
      </ThemeStack>
    </>
  );
}
