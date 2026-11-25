// Lab-only layout parts: show one demo in light and in dark side by side (Task R1.4).
// The `.dark` class on a wrapper sets the dark tokens for everything inside it.
import type { ReactNode } from "react";

export function ThemePanels({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section aria-label="Light theme" className="light rounded-card border border-border bg-background p-6 text-foreground">
        <p className="mb-4 font-mono text-xs text-muted-foreground">Light</p>
        {children}
      </section>
      <section aria-label="Dark theme" className="dark rounded-card border border-border bg-background p-6 text-foreground">
        <p className="mb-4 font-mono text-xs text-muted-foreground">Dark (proposal for UX-P-01)</p>
        {children}
      </section>
    </div>
  );
}

export function Demo({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-6 last:border-b-0">
      <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </div>
  );
}

export function LabHeader({ title, round, states }: { title: string; round: string; states: string[] }) {
  return (
    <header className="mb-6 flex flex-col gap-2">
      <p className="font-mono text-xs text-muted-foreground">{round}</p>
      <h1 className="font-serif text-[28px] leading-9 font-semibold">{title}</h1>
      <p className="max-w-[72ch] text-sm text-muted-foreground">States shown: {states.join(", ")}.</p>
    </header>
  );
}
