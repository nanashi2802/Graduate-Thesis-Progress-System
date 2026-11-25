"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/*
 * Thought line: a one-line header with a live clock. While `working`, the label shimmers and the
 * clock runs. When it settles, the label changes to `doneLabel` and the clock stops at `elapsed`.
 * Adapted from the React Bits "Thought Line" micro component, trimmed to one line (no step list)
 * and rewritten with CSS, so it adds no dependency. The styles are `.tl-*` in landing.css. It has
 * no AI glyph: the landing page uses it for a person writing a reply (AGENTS.md §9).
 * Sample content only.
 */

const fmt = (ds: number) => `${(ds / 10).toFixed(1)}s`;

export function ThoughtLine({
  label,
  doneLabel,
  working,
  elapsed,
  className,
}: {
  label: string;
  doneLabel: string;
  working: boolean;
  /** Seconds shown once it has settled. */
  elapsed: number;
  className?: string;
}) {
  const [live, setLive] = useState(0);

  useEffect(() => {
    if (!working) return;
    const start = performance.now();
    const id = window.setInterval(() => setLive(Math.floor((performance.now() - start) / 100)), 100);
    return () => {
      window.clearInterval(id);
      setLive(0);
    };
  }, [working]);

  const shown = working ? live : Math.round(elapsed * 10);

  return (
    <div
      className={cn("tl inline-flex items-center gap-1.5 text-xs leading-[1.2] font-medium whitespace-nowrap text-maroon-800", className)}
      data-working={working || undefined}
    >
      <span className="tl-dot size-1.5 rounded-full bg-current" />
      {/* The two labels share one cell, so the label can change in place. */}
      <span className="inline-grid">
        <span className="tl-work [grid-area:1/1]">{label}</span>
        <span className="tl-done [grid-area:1/1]">{doneLabel}</span>
      </span>
      <span className="tl-time tabular-nums">{fmt(shown)}</span>
    </div>
  );
}
