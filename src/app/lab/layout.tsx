// The /lab showcase of the UI/UX retrofit (IMPLEMENTATION_PLAN.md §7, Task 2.1, UX-D-05).
// Development only: a production build returns a 404. Mock data only, no sign-in, no server import.
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/patterns/theme-toggle";
// The brand tokens and fonts are in the root layout since R1.5 (src/styles/tokens.css, src/app/layout.tsx).

export default function LabLayout({ children }: { children: ReactNode }) {
  // Read at call time, so the guard test can set NODE_ENV.
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <div aria-hidden="true" className="h-[3px] bg-primary" />
      <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-4 sm:px-6">
        <Link href="/lab" className="font-serif text-base font-semibold">
          Lab
        </Link>
        <span className="text-sm text-muted-foreground">Development only. Mock data.</span>
        <div className="ml-auto">
          <ThemeToggle compact />
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-8">
        {children}
      </main>
    </div>
  );
}
