// Lab only (Round R3): fake data for the queue, KPI and inbox previews. Plain data, so server pages can import it.
import type { KpiItem } from "@/components/patterns/kpi-strip";
import { LATE_POLICIES, isLate, type LatePolicy, type QueueKind } from "@/components/patterns/kpi-strip/late";
import type { InboxItem } from "@/components/patterns/inbox";

export type QueueRow = {
  id: string;
  student: string;
  form: string | null;
  request: string;
  milestone: string;
  days: number;
  kind: string;
  action: string;
  blocked?: string;
};

export const C1_QUEUE: QueueRow[] = [
  { id: "q1", student: "Dino Aquino", form: "TDW_12", request: "Final Defense Endorsement", milestone: "Final", days: 6, kind: "Check scans", action: "Check scan" },
  { id: "q2", student: "Bea Santos", form: "TDW_07", request: "Proposal Defense Endorsement", milestone: "Proposal", days: 3, kind: "Check scans", action: "Check scan" },
  { id: "q3", student: "Carlo Mendoza", form: null, request: "Official receipt", milestone: "Pre-Final", days: 2, kind: "Check scans", action: "Check scan" },
  { id: "q4", student: "Ana Reyes", form: "TDW_03", request: "Consultation log", milestone: "Proposal", days: 1, kind: "Check scans", action: "Check scan" },
  { id: "q5", student: "Ella Bautista", form: null, request: "Proposed defense date, 12 Feb 2027", milestone: "Pre-Final", days: 3, kind: "Confirm dates", action: "Confirm date" },
  {
    id: "q6",
    student: "Franco Lim",
    form: null,
    request: "Proposed defense date, 15 Feb 2027",
    milestone: "Final",
    days: 1,
    kind: "Confirm dates",
    action: "Confirm date",
    blocked: "Opens when the printed copies are recorded.",
  },
  { id: "q7", student: "Gia Torres", form: "TDW_06", request: "Evaluation Committee", milestone: "Proposal", days: 2, kind: "Appoint committees", action: "Appoint" },
  { id: "q8", student: "Hugo Ramos", form: null, request: "Proposal defense, 8 Jan 2027", milestone: "Proposal", days: 1, kind: "Close defenses", action: "Open defense" },
  { id: "q9", student: "Iris Navarro", form: null, request: "Signed final manuscript", milestone: "Clearance", days: 4, kind: "Check clearance", action: "Check item" },
];

export type StudentRow = { id: string; student: string; title: string; adviser: string; milestone: string; status: string; flag?: string };

const LONG_TITLE =
  "A low-cost wearable electromyography system with on-device signal classification for the early detection of repetitive strain injury among call-center agents in Metro Manila";

export const C2_STUDENTS: StudentRow[] = [
  { id: "s1", student: "Dino Aquino", title: LONG_TITLE, adviser: "Dr. Rosa Villanueva", milestone: "Final", status: "In review" },
  { id: "s2", student: "Bea Santos", title: "Edge inference of crop disease on low-power microcontrollers", adviser: "Engr. Paolo Cruz", milestone: "Proposal", status: "Ready", flag: "Residency ends in 4 months." },
  { id: "s3", student: "Carlo Mendoza", title: "A digital twin of a campus microgrid for load forecasting", adviser: "Dr. Rosa Villanueva", milestone: "Pre-Final", status: "Draft" },
];

export type AdviserRow = { id: string; student: string; request: string; gate: string | null; days: number };

export const A1_QUEUE: AdviserRow[] = [
  { id: "a1", student: "Bea Santos", request: "Endorse the proposal for defense", gate: "Gate 1a", days: 5 },
  { id: "a2", student: "Dino Aquino", request: "Review version 4 of the manuscript", gate: null, days: 2 },
  { id: "a3", student: "Carlo Mendoza", request: "Record the consultation of 20 Jan 2027", gate: null, days: 1 },
];

const KPI_DEF: { kind: QueueKind; label: string; glyph: KpiItem["glyph"]; queue: string | null }[] = [
  { kind: "all", label: "All waiting", glyph: "overview", queue: null },
  { kind: "scans", label: "Check scans", glyph: "scan", queue: "Check scans" },
  { kind: "dates", label: "Confirm dates", glyph: "calendar", queue: "Confirm dates" },
  { kind: "committees", label: "Appoint committees", glyph: "seat", queue: "Appoint committees" },
  { kind: "defenses", label: "Close defenses", glyph: "defense", queue: "Close defenses" },
  { kind: "clearance", label: "Check clearance", glyph: "clear", queue: "Check clearance" },
];

/** The C1 KPI cells from the queue, as R7d will compute them in the page: the count and the oldest age by kind. */
export function kpis(rows: readonly QueueRow[], policy: LatePolicy = LATE_POLICIES.C, selected: QueueKind = "all", base = "/lab/patterns/kpi-strip"): KpiItem[] {
  return KPI_DEF.map((d) => {
    const mine = d.queue === null ? rows : rows.filter((r) => r.kind === d.queue);
    const oldest = mine.length ? Math.max(...mine.map((r) => r.days)) : null;
    return {
      label: d.label,
      count: mine.length,
      oldestDays: oldest,
      late: isLate(d.kind, oldest, policy),
      glyph: d.glyph,
      href: `${base}?q=${d.kind}`,
      selected: d.kind === selected,
    };
  });
}

export const INBOX_ITEMS: InboxItem[] = [
  { id: "d1", href: "/lab/patterns/inbox?scan=d1", student: "Ana Reyes", ageDays: 1, late: false, form: "TDW_03", state: "scan_uploaded", milestone: "Proposal" },
  { id: "d2", href: "/lab/patterns/inbox?scan=d2", student: "Dino Aquino", ageDays: 6, late: true, form: "TDW_12", state: "scan_uploaded", milestone: "Final" },
  { id: "d3", href: "/lab/patterns/inbox?scan=d3", student: "Bea Santos", ageDays: 3, late: false, form: "TDW_07", state: "scan_uploaded", milestone: "Proposal" },
  { id: "d4", href: "/lab/patterns/inbox?scan=d4", student: "Carlo Mendoza", ageDays: 2, late: false, form: "OR", state: "scan_uploaded", milestone: "Pre-Final" },
];

export const SCAN_NAMES: Record<string, string> = {
  TDW_03: "Consultation log",
  TDW_07: "Proposal Defense Endorsement",
  TDW_12: "Final Defense Endorsement",
  OR: "Official receipt",
};
