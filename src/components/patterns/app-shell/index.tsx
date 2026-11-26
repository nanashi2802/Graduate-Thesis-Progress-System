// Source: DESIGN.md §5.1 and §10, brand guide (Spacing and Layout; Sample Application: Web), Task R2.1.
// The frame of every signed-in screen: a skip link (the first focusable element), the 3 px maroon masthead
// rule, the 56 px top bar, the 240 px sidebar (a drawer below 1024 px) and <main id="main">.
// Content width (decision R2-c, UX-006): 1280 px with 24 px gutters (option A, recommended); 1200 px is option B.
// Reading text keeps its own 72ch measure inside the content.
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { NavDrawer } from "./nav-drawer";

export type AppShellProps = {
  /** The brand mark (text treatment until the artwork arrives, UX-X-19). */
  brand: ReactNode;
  roleLabel: string;
  /** The sidebar navigation. The shell shows it in the aside from 1024 px and in the drawer below. */
  nav: ReactNode;
  /** The right part of the top bar: the D-08 controls, the theme switch, the bell, the user menu. */
  topBar: ReactNode;
  children?: ReactNode;
  contentWidth?: 1200 | 1280;
  /** Lab only: show the drawer open. */
  drawerOpen?: boolean;
  /** Lab only: a framed preview inside the lab page. The content is a div (the lab page has its own main). */
  frame?: boolean;
};

export function AppShell({ brand, roleLabel, nav, topBar, children, contentWidth = 1280, drawerOpen, frame }: AppShellProps) {
  const Main = frame ? "div" : "main";
  const mainId = frame ? "main-preview" : "main";
  return (
    <div className={cn("flex flex-col bg-background text-foreground", frame ? "min-h-[680px]" : "min-h-screen")}>
      <a
        href={`#${mainId}`}
        className="sr-only z-50 rounded-control bg-card px-4 py-2 text-sm font-semibold text-link shadow-[var(--shadow-popover)] outline-none focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Skip to content
      </a>
      <div aria-hidden="true" className="h-[3px] bg-primary" />
      <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4 sm:px-6">
        <NavDrawer label={`${roleLabel} menu`} defaultOpen={drawerOpen}>
          {nav}
        </NavDrawer>
        {brand}
        <span className="hidden text-sm text-muted-foreground sm:inline">{roleLabel}</span>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">{topBar}</div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">{nav}</aside>
        <Main id={mainId} tabIndex={-1} className="min-w-0 flex-1 outline-none">
          <div className={cn("mx-auto w-full px-4 py-6 sm:px-6", contentWidth === 1280 ? "max-w-[1280px]" : "max-w-[1200px]")}>{children}</div>
        </Main>
      </div>
    </div>
  );
}
