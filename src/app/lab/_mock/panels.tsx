// Lab-only layout parts: show one demo in light and in dark side by side (Task R1.4).
// The `.dark` class on a wrapper sets the dark tokens for everything inside it.
import type { ReactNode } from "react";
import Link from "next/link";

export function ThemePanels({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section aria-label="Light theme" className="light rounded-card border border-border bg-background p-6 text-foreground">
        <p className="mb-4 font-mono text-xs text-muted-foreground">Light</p>
        {children}
      </section>
      <section aria-label="Dark theme" className="dark rounded-card border border-border bg-background p-6 text-foreground">
        <p className="mb-4 font-mono text-xs text-muted-foreground">Dark</p>
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

/** Light, then dark, one under the other: for wide parts (tables, the inbox) that need the full width. */
export function ThemeStack({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <section aria-label="Light theme" className="light rounded-card border border-border bg-background p-4 text-foreground sm:p-6">
        <p className="mb-4 font-mono text-xs text-muted-foreground">Light</p>
        {children}
      </section>
      <section aria-label="Dark theme" className="dark rounded-card border border-border bg-background p-4 text-foreground sm:p-6">
        <p className="mb-4 font-mono text-xs text-muted-foreground">Dark</p>
        {children}
      </section>
    </div>
  );
}

/** Links to the option variants of a page (?key=value). */
export function OptionLinks({ base, links }: { base: string; links: { label: string; query: string; current?: boolean }[] }) {
  return (
    <nav aria-label="Options" className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
      {links.map((l) => (
        <Link key={l.label} href={`${base}${l.query}`} aria-current={l.current ? "page" : undefined} className="text-link underline-offset-4 hover:underline aria-[current=page]:font-semibold">
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

/** The query of a /lab page as plain strings. */
export const flat = (raw: Record<string, string | string[] | undefined>) =>
  Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])) as Record<string, string | undefined>;

/**
 * Option rows for a decision page: one labelled row for each decision, with a "Shown now" mark on the option that
 * the page shows. `note` says why a default differs from the recommendation.
 */
export function OptionGroups({
  base,
  groups,
}: {
  base: string;
  groups: { label: string; note?: string; links: { label: string; query: string; current?: boolean; recommended?: boolean }[] }[];
}) {
  return (
    <div className="mb-6 flex flex-col gap-2 rounded-card border border-border bg-card p-4 text-sm">
      {groups.map((g) => (
        <div key={g.label} className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="w-44 shrink-0 font-semibold text-foreground">{g.label}</span>
          {g.links.map((l) => (
            <Link
              key={l.label}
              href={`${base}${l.query}`}
              aria-current={l.current ? "true" : undefined}
              className="inline-flex items-center gap-1.5 rounded-control px-2 py-1 text-link underline-offset-4 hover:underline aria-[current=true]:bg-accent aria-[current=true]:font-semibold aria-[current=true]:text-accent-foreground"
            >
              {l.label}
              {l.recommended ? <span className="text-[0.8rem] font-normal text-muted-foreground">(recommended)</span> : null}
              {l.current ? <span className="text-[0.8rem] font-normal">· shown now</span> : null}
            </Link>
          ))}
          {g.note ? <span className="basis-full pl-0 text-[0.8rem] text-muted-foreground sm:pl-48">{g.note}</span> : null}
        </div>
      ))}
    </div>
  );
}
