"use client";
// Source: Carbon data table (DESIGN.md §7.4 `consultation-log`), design/screens/A3.md, FR-SCH-05, FR-SCH-06, Task R6.5.
// The TDW 03 columns on the queue-table pattern, comfortable density: date and time, place or platform, topics, and
// the Adviser's confirmation. The page gives the row action (Confirm), if any.
import type { ReactNode } from "react";
import { QueueTable, type RowAction } from "@/components/patterns/queue-table";
import { StatusPill } from "@/components/patterns/status";
import { formatPht } from "@/lib/date";

export type ConsultationEntry = { id: string; heldAt: Date; place: string; topics: string | null; confirmed: boolean };

export type ConsultationLogProps = {
  rows: readonly ConsultationEntry[];
  /** An EmptyState with the first-day text. */
  empty: ReactNode;
  action?: (row: ConsultationEntry) => RowAction | null;
  caption?: string;
};

export function ConsultationLog({ rows, empty, action, caption = "Consultation log (TDW 03)" }: ConsultationLogProps) {
  return (
    <QueueTable
      caption={caption}
      density="comfortable"
      rows={rows}
      rowKey={(r) => r.id}
      empty={empty}
      action={action}
      columns={[
        { key: "heldAt", label: "Date and time", width: "240px", mono: true, text: (r) => formatPht(r.heldAt) },
        { key: "place", label: "Place or platform", width: "180px", text: (r) => r.place },
        {
          key: "topics",
          label: "Topics",
          long: true,
          text: (r) => r.topics ?? "No topics yet",
        },
        {
          key: "confirmed",
          label: "Adviser confirmation",
          width: "180px",
          text: (r) => (r.confirmed ? "Confirmed" : "To confirm"),
          render: (r) => <StatusPill tone={r.confirmed ? "done" : "pending"} label={r.confirmed ? "Confirmed" : "To confirm"} />,
        },
      ]}
    />
  );
}
