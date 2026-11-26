"use client";
// Lab only (Task R2.6, D-10): motion timing options side by side. Page entry animations: none in every option.
// "Reduce motion" sets every duration to 0 here; the real path is `prefers-reduced-motion` (globals.css rule and
// `motion-reduce:` classes), which the `pnpm lab:shots` reduced run uses.
import { useState, type CSSProperties } from "react";
import { MilestoneStatusPill } from "@/components/patterns/status";
import { ThemeToggle } from "@/components/patterns/theme-toggle";
import { Button } from "@/components/ui/button";

type Option = { id: string; name: string; state: number; overlay: number; drawer: number; drawerEase: string; toast: number; note: string };

const OPTIONS: Option[] = [
  { id: "A", name: "A (recommended)", state: 120, overlay: 160, drawer: 280, drawerEase: "cubic-bezier(0.32,0.72,0,1)", toast: 160, note: "Short state changes, a spring-like ease for the drawer. Matches the theme switch springs (UX-D-13)." },
  { id: "B", name: "B (faster)", state: 100, overlay: 120, drawer: 200, drawerEase: "cubic-bezier(0.2,0,0,1)", toast: 120, note: "Shortest. The drawer feels abrupt on a tablet." },
  { id: "C", name: "C (slower)", state: 200, overlay: 240, drawer: 400, drawerEase: "cubic-bezier(0.32,0.72,0,1)", toast: 240, note: "Calm, but a queue with many updates feels slow." },
];

function Column({ o, reduce }: { o: Option; reduce: boolean }) {
  const [on, setOn] = useState(false);
  const ms = (n: number) => `${reduce ? 0 : n}ms`;
  const vars = { "--m-state": ms(o.state), "--m-overlay": ms(o.overlay), "--m-drawer": ms(o.drawer), "--m-ease": o.drawerEase, "--m-toast": ms(o.toast) } as CSSProperties;
  return (
    <section aria-label={`Option ${o.id}`} style={vars} className="flex flex-col gap-4 rounded-card border border-border bg-card p-4">
      <header className="flex flex-col gap-1">
        <h3 className="font-semibold">{o.name}</h3>
        <p className="font-mono text-xs text-muted-foreground">
          state {o.state} · overlay {o.overlay} · drawer {o.drawer} · toast {o.toast} ms
        </p>
        <p className="text-sm text-muted-foreground">{o.note}</p>
      </header>
      <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setOn((v) => !v)}>
        {on ? "Play back" : "Play"}
      </Button>
      <div>
        <p className="mb-1 font-mono text-xs text-muted-foreground">State change (row and pill)</p>
        <div className={`flex h-12 items-center justify-between rounded-control border border-border px-3 transition-colors duration-(--m-state) ${on ? "bg-accent" : "bg-card"}`}>
          <span className="text-sm">Ana Cruz · Pre-Final</span>
          <span key={String(on)} className="animate-none">
            <MilestoneStatusPill status={on ? "ADVISER_ENDORSED" : "READY"} />
          </span>
        </div>
      </div>
      <div>
        <p className="mb-1 font-mono text-xs text-muted-foreground">Dialog or side sheet</p>
        <div className="relative h-24 overflow-hidden rounded-control border border-dashed border-border">
          <div className={`absolute inset-3 rounded-card border border-border bg-popover p-3 text-sm shadow-[var(--shadow-popover)] transition-[opacity,scale] duration-(--m-overlay) ${on ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
            Return the manuscript?
          </div>
        </div>
      </div>
      <div>
        <p className="mb-1 font-mono text-xs text-muted-foreground">Drawer (sidebar below 1024 px)</p>
        <div className="relative h-28 overflow-hidden rounded-control border border-dashed border-border">
          <div className={`absolute inset-y-0 left-0 w-2/3 border-r border-border bg-sidebar p-3 text-sm transition-transform duration-(--m-drawer) ease-(--m-ease) ${on ? "translate-x-0" : "-translate-x-full"}`}>
            Dashboard · Manuscript · Documents
          </div>
        </div>
      </div>
      <div>
        <p className="mb-1 font-mono text-xs text-muted-foreground">Toast</p>
        <div className="relative h-16 overflow-hidden rounded-control border border-dashed border-border">
          <div className={`absolute inset-x-3 bottom-3 rounded-card border border-border bg-popover px-3 py-2 text-sm shadow-[var(--shadow-popover)] transition-[opacity,translate] duration-(--m-toast) ease-out ${on ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
            Preferences saved.
          </div>
        </div>
      </div>
    </section>
  );
}

export function MotionLab() {
  const [reduce, setReduce] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={reduce} onChange={(e) => setReduce(e.target.checked)} className="size-4 accent-primary" />
          Reduce motion (every duration 0)
        </label>
        <span className="flex items-center gap-2 text-sm">
          Theme switch springs (UX-D-13): <ThemeToggle compact />
        </span>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {OPTIONS.map((o) => (
          <Column key={o.id} o={o} reduce={reduce} />
        ))}
      </div>
      <p className="max-w-[72ch] text-sm text-muted-foreground">
        In every option: no page entry animation, no counting numbers, no decorative motion on working screens. CSS transitions use
        the --motion-* tokens after the gate; motion/react only for springs and exit animations.
      </p>
    </div>
  );
}
