"use client";
// Lab only (Tasks R2.1 to R2.3): the R2 shell with mock facts, mock notifications and mock actions.
// Fake names only. No server import (eslint rule for src/app/lab). The actions only wait and show a toast.
import Link from "next/link";
import type { ReactNode } from "react";
import { AppShell } from "@/components/patterns/app-shell";
import { BrandMark } from "@/components/patterns/brand-mark";
import { Sidebar, type SidebarLook } from "@/components/patterns/sidebar";
import { navFor, type NavRole } from "@/components/patterns/sidebar/nav";
import { ThemeToggle } from "@/components/patterns/theme-toggle";
import { ToastProvider, useToast } from "@/components/patterns/toast";
import { FACTS, ROLE_LABEL, type FactsName } from "./shell-facts";
import { NotificationsSheet, RoutePalette, UserMenu, type TopBarNotification, type TopBarPreference } from "@/components/patterns/top-bar";

const HOME: Record<NavRole, string> = {
  student: "/student/dashboard",
  adviser: "/adviser/dashboard",
  panel_member: "/panel/dashboard",
  coordinator: "/coordinator/dashboard",
};

const NOTES: TopBarNotification[] = [
  { id: "n1", event: "Your Adviser endorsed the manuscript.", nextAction: "Wait for the Evaluation Committee review.", createdAt: new Date("2027-01-12T01:00:00Z"), read: false },
  { id: "n2", event: "The Coordinator confirmed the defense date.", nextAction: "Bring the printed copies by 5 Feb 2027.", createdAt: new Date("2027-01-10T06:30:00Z"), read: false },
  { id: "n3", event: "A Panel Member resolved a thread.", nextAction: "No action is needed.", createdAt: new Date("2027-01-08T02:15:00Z"), read: true },
];
const PREFS: TopBarPreference[] = [
  { code: "THREAD_REPLY", event: "A reply to your thread", optional: true, enabled: true },
  { code: "WEEKLY_DIGEST", event: "Weekly summary of open threads", optional: true, enabled: false },
  { code: "GATE_RESULT", event: "A gate result on your milestone", optional: false, enabled: true },
];

const wait = () => new Promise<void>((r) => setTimeout(r, 400));

function TopBar({ role, palette }: { role: NavRole; palette: boolean }) {
  const toast = useToast();
  return (
    <>
      {palette ? <RoutePalette items={navFor(role, FACTS.milestone3)} /> : null}
      <ThemeToggle compact />
      <NotificationsSheet items={NOTES} unread={2} actions={{ markRead: wait, markAllRead: wait }} />
      <UserMenu
        userName="Ana Cruz"
        roleLabel={ROLE_LABEL[role]}
        preferences={PREFS}
        actions={{ savePreferences: wait, signOut: wait }}
        onPreferencesSaved={() => toast.show({ label: "Preferences saved.", tone: "done" })}
      />
    </>
  );
}

export function ShellDemo({
  role,
  facts,
  look = "brand",
  palette = false,
  drawerOpen = false,
  contentWidth = 1280,
  children,
}: {
  role: NavRole;
  facts: FactsName;
  look?: SidebarLook;
  palette?: boolean;
  drawerOpen?: boolean;
  contentWidth?: 1200 | 1280;
  children?: ReactNode;
}) {
  const items = navFor(role, FACTS[facts]);
  return (
    <ToastProvider>
      <div className="overflow-hidden rounded-card border border-border">
        <AppShell
          frame
          drawerOpen={drawerOpen}
          contentWidth={contentWidth}
          brand={<BrandMark variant="text" />}
          roleLabel={ROLE_LABEL[role]}
          nav={<Sidebar items={items} activeHref={HOME[role]} label={`${ROLE_LABEL[role]} menu`} look={look} />}
          topBar={<TopBar role={role} palette={palette} />}
        >
          {children ?? <MockContent width={contentWidth} />}
        </AppShell>
      </div>
    </ToastProvider>
  );
}

function MockContent({ width }: { width: number }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-serif text-2xl font-semibold">Dashboard</h2>
      <p className="max-w-[72ch] text-sm text-muted-foreground">
        Mock content. The content area is {width} px wide at most, with 24 px gutters. Reading text keeps a 72ch measure.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {["Current step", "Next action", "Key dates"].map((t) => (
          <div key={t} className="h-28 rounded-card border border-border bg-card p-4 text-sm font-semibold">
            {t}
          </div>
        ))}
      </div>
      <p className="text-sm">
        <Link href="/lab/patterns/sidebar" className="text-link underline-offset-4 hover:underline">
          Every sidebar state
        </Link>
      </p>
    </div>
  );
}

/** One sidebar, framed, for the side-by-side sidebar page. */
export function SidebarFrame({ role, facts, look = "brand", active }: { role: NavRole; facts: FactsName; look?: SidebarLook; active?: string }) {
  return (
    <div className="w-60 overflow-hidden rounded-card border border-border bg-sidebar">
      <Sidebar items={navFor(role, FACTS[facts])} activeHref={active ?? HOME[role]} label={`${ROLE_LABEL[role]} menu, ${facts}`} look={look} />
    </div>
  );
}
