// The /lab showcase of the UI/UX retrofit (IMPLEMENTATION_PLAN.md §7, Task 2.1, UX-D-05).
// Development only: a production build returns a 404. Mock data only, no sign-in, no server import.
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { ThemeToggle } from "@/components/patterns/theme-toggle";
import "./_mock/brand-preview.css";
import { inter, jetbrains, poppins } from "./_mock/fonts";

// Brand fonts (UX-D-11): the lab shows them before R1.5 puts them in the root layout. The `font-serif` class
// becomes the title face (Poppins), `font-sans` the UI face (Inter), `font-mono` the data face (JetBrains Mono).
const BRAND_FONTS = {
  "--font-source-serif": "var(--font-lab-poppins)",
  "--font-plex-sans": "var(--font-lab-inter)",
  "--font-plex-mono": "var(--font-lab-jetbrains)",
} as CSSProperties;

export default function LabLayout({ children }: { children: ReactNode }) {
  // Read at call time, so the guard test can set NODE_ENV.
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className={`${poppins.variable} ${inter.variable} ${jetbrains.variable} r1-preview flex min-h-screen flex-col bg-background font-sans text-foreground`} style={BRAND_FONTS}>
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
