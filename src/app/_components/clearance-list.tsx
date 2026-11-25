// The clearance checklist rows, shared by S6 and C7 (FR-CLR-01, FR-CLR-04). A row is done or open.
import { CircleCheck, CircleDashed } from "lucide-react";
import type { ReactNode } from "react";
import type { ClearanceRow } from "@/server/data/clearance";

export function ClearanceList({ rows, action }: { rows: ClearanceRow[]; action?: (row: ClearanceRow) => ReactNode }) {
  return (
    <ul className="flex flex-col divide-y divide-border border-y border-border">
      {rows.map((r) => (
        <li key={r.kind} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-sm">
            {r.done ? <CircleCheck aria-hidden className="mt-0.5 size-4 text-link" /> : <CircleDashed aria-hidden className="mt-0.5 size-4 text-muted-foreground" />}
            <div>
              <p className="font-medium">{r.label}</p>
              <p className="text-xs text-muted-foreground">
                {r.done ? "Done." : "Open."} {r.source === "record" ? "Comes from its own record." : "The Coordinator verifies it."}
              </p>
            </div>
          </div>
          {action?.(r)}
        </li>
      ))}
    </ul>
  );
}
