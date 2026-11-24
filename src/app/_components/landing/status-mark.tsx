import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/*
 * Status mark: a small glyph that morphs from an idle dashed ring to a progress arc, then to a
 * check. Adapted from the React Bits "Status Mark" micro component, trimmed to the three states
 * the landing page needs and rewritten with CSS transitions, so it adds no dependency.
 * The styles are `.sm-*` in landing.css. Set `status` to change state. Sample content only.
 */

export type StatusMarkStatus = "pending" | "running" | "done";

const SPOKEN: Record<StatusMarkStatus, string> = { pending: "Pending", running: "In progress", done: "Done" };

export function StatusMark({
  status,
  label,
  size = 16,
  strokeWidth = 2,
  className,
}: {
  status: StatusMarkStatus;
  label?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const r = 10 - strokeWidth / 2;
  const c = 2 * Math.PI * r;
  const dash = {
    pending: `${(c / 8) * 0.3} ${(c / 8) * 0.7}`,
    running: `${c * 0.68} ${c * 0.32}`,
    done: `${c} 0`,
  }[status];

  return (
    <span className={cn("sm", className)} data-status={status} style={{ "--sm-stroke": strokeWidth } as CSSProperties}>
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className="sm-svg">
        <circle className="sm-track" cx="12" cy="12" r={r} />
        <g className="sm-spin">
          <circle className="sm-ring" cx="12" cy="12" r={r} transform="rotate(-90 12 12)" style={{ strokeDasharray: dash }} />
        </g>
        <path className="sm-check" d="M7.5 12.25 10.5 15.25 16.75 8.75" pathLength={1} />
      </svg>
      {label ? <span>{label}</span> : null}
      <span className="sr-only">{SPOKEN[status]}</span>
    </span>
  );
}
