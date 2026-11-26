"use client";
// The rubric inputs of TDW 08 and TDW 13 with a running total (FR-DEF-05). The total is the plain sum. No grade equivalent (BR-15).
import { useState } from "react";
import { inputClass } from "@/app/_components/action-form";
import { cn } from "@/lib/utils";

type Line = { id: string; code: string; label: string; weightPct: number };

export function ScoreSheet({ rubric, initial, readOnly }: { rubric: Line[]; initial: Record<string, number>; readOnly: boolean }) {
  const [values, setValues] = useState<Record<string, string>>(Object.fromEntries(rubric.map((r) => [r.id, initial[r.id] !== undefined ? String(initial[r.id]) : ""])));
  const total = rubric.reduce((sum, r) => sum + (Number(values[r.id]) || 0), 0);
  return (
    <fieldset className="flex flex-col gap-2" disabled={readOnly}>
      <legend className="text-sm font-medium">Rubric (each score from 0 to its weight)</legend>
      <ul className="flex flex-col divide-y divide-border border-y border-border">
        {rubric.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <label htmlFor={`score_${r.id}`} className="flex-1">
              {r.code}. {r.label} <span className="text-muted-foreground">(weight {r.weightPct})</span>
            </label>
            <input
              id={`score_${r.id}`}
              name={`score_${r.id}`}
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              max={r.weightPct}
              value={values[r.id]}
              onChange={(e) => setValues({ ...values, [r.id]: e.target.value })}
              className={cn(inputClass, "w-24")}
            />
          </li>
        ))}
      </ul>
      <p className="text-sm font-medium" aria-live="polite">
        Total: {total} of 100
      </p>
    </fieldset>
  );
}
