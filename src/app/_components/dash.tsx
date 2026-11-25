// Small parts for the role dashboards (DESIGN.md §5.3 Overview: ruled sections, no card grid).
import type { ReactNode } from "react";

export function DashSection({ title, id, children }: { title: string; id?: string; children: ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-8 flex-col gap-4 border-t border-border pt-8">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

export const th = "border-b border-border px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground";
export const td = "border-b border-border px-3 py-2 align-top text-sm text-foreground";
export const linkClass = "text-sm font-medium text-link underline-offset-4 hover:underline";

export const MILESTONE_LABEL: Record<string, string> = { proposal: "Proposal", pre_final: "Pre-Final", final: "Final" };

/** `2 days`, `1 day`, `Today`: how long a record waits. Information only (BR-17). */
export const waiting = (days: number) => (days === 0 ? "Today" : days === 1 ? "1 day" : `${days} days`);
