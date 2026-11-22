// The shell of one portal: navigation for the role, the user name and the notification center.
// Wrap it inside `RoleGate`, so only the right role gets here. Server only.
import "server-only";
import { eq } from "drizzle-orm";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { getSessionState } from "@/server/auth/session";
import { getDb } from "@/server/data/db";
import { listMyNotifications, unreadCount } from "@/server/data/notifications";
import { appUser, type UserRole } from "@/server/data/schema";

// Only the routes that exist. Routes with an id in the path (workspace, results) open from the dashboards.
const NAV: Record<UserRole, { label: string; items: { href: string; label: string }[] }> = {
  student: {
    label: "Student",
    items: [
      { href: "/student/dashboard", label: "Dashboard" },
      { href: "/student/documents", label: "Documents" },
      { href: "/student/schedule", label: "Schedule" },
      { href: "/student/clearance", label: "Clearance" },
    ],
  },
  adviser: {
    label: "Adviser",
    items: [
      { href: "/adviser/dashboard", label: "Dashboard" },
      { href: "/adviser/consultations", label: "Consultations" },
      { href: "/adviser/availability", label: "Availability" },
    ],
  },
  panel_member: {
    label: "Panel Member",
    items: [
      { href: "/panel/dashboard", label: "Dashboard" },
      { href: "/panel/availability", label: "Availability" },
    ],
  },
  coordinator: {
    label: "Coordinator",
    items: [
      { href: "/coordinator/dashboard", label: "Dashboard" },
      { href: "/coordinator/students", label: "Accounts" },
      { href: "/coordinator/committees", label: "Committees" },
      { href: "/coordinator/documents", label: "Documents" },
      { href: "/coordinator/schedule", label: "Schedule" },
      { href: "/coordinator/clearance", label: "Clearance" },
      { href: "/coordinator/templates", label: "Templates" },
      { href: "/coordinator/users", label: "Users" },
    ],
  },
};

export async function RoleShell({ role, children }: { role: UserRole; children: ReactNode }) {
  const state = await getSessionState();
  if (state.status !== "ok") return <>{children}</>; // The role gate already blocks this case.
  const ctx = { db: getDb(), actor: state.actor };
  const [user] = await ctx.db.select({ name: appUser.fullName }).from(appUser).where(eq(appUser.id, state.actor.userId));
  const [notifications, unread] = await Promise.all([listMyNotifications(ctx, { limit: 10 }), unreadCount(ctx)]);
  return (
    <AppShell roleLabel={NAV[role].label} userName={user?.name ?? NAV[role].label} nav={NAV[role].items} notifications={notifications} unread={unread}>
      {children}
    </AppShell>
  );
}
