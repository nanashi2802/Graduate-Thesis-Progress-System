import type { ReactNode } from "react";

export function PageHeader({ title, detail }: { title: string; detail: string }) {
  return (
    <header className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <p className="max-w-[72ch] text-sm text-muted-foreground">{detail}</p>
    </header>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-6 border-t border-border pt-8">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

export const th = "border-b border-border px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground";
export const td = "border-b border-border px-3 py-2 align-top text-sm text-foreground";
