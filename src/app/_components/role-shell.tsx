// The shell of one portal (R2.8, DESIGN.md §5.1): the AppShell pattern with the role's sidebar, the top bar and
// the notification center. Wrap it inside `RoleGate`, so only the right role gets here. Server only.
// The sidebar facts come from data functions that exist and check access (approved at UX-P-02):
// Student studentTracker + submissionFor, Adviser adviserDashboard, Panel Member panelDashboard. Coordinator: none.
import "server-only";
import { eq } from "drizzle-orm";
import type { ReactNode } from "react";
import { signOut } from "@/app/(auth)/login/actions";
import { ShellTopBar } from "@/app/_components/shell-top-bar";
import { markAllReadAction, markReadAction, savePreferencesAction } from "@/app/_lib/notification-actions";
import { adviserNavFacts, panelNavFacts, studentNavFacts } from "@/app/_lib/nav-facts";
import { AppShell } from "@/components/patterns/app-shell";
import { BrandMark } from "@/components/patterns/brand-mark";
import { LiveSidebar } from "@/components/patterns/sidebar";
import { NO_FACTS, navFor, type NavFacts } from "@/components/patterns/sidebar/nav";
import { getSessionState } from "@/server/auth/session";
import type { DataContext } from "@/server/data/access";
import { getDb } from "@/server/data/db";
import { submissionFor } from "@/server/data/manuscript";
import { listMyNotifications, unreadCount } from "@/server/data/notifications";
import { listMyPreferences } from "@/server/data/preferences";
import { adviserDashboard, panelDashboard } from "@/server/data/queues";
import { appUser, type UserRole } from "@/server/data/schema";
import { studentTracker } from "@/server/data/tracker";

const LABEL: Record<UserRole, string> = { student: "Student", adviser: "Adviser", panel_member: "Panel Member", coordinator: "Coordinator" };

// A failed fact read never breaks the shell: the sidebar then shows the items with no facts (locked or open).
async function factsFor(role: UserRole, ctx: DataContext): Promise<NavFacts> {
  try {
    if (role === "student") {
      const t = await studentTracker(ctx);
      const prId = t ? await submissionFor(ctx, t.current.milestoneId).then((s) => s.pr.id, () => null) : null;
      return studentNavFacts(t, prId);
    }
    if (role === "adviser") return adviserNavFacts(await adviserDashboard(ctx));
    if (role === "panel_member") return panelNavFacts(await panelDashboard(ctx));
  } catch {
    return NO_FACTS;
  }
  return NO_FACTS;
}

export async function RoleShell({ role, children }: { role: UserRole; children: ReactNode }) {
  const state = await getSessionState();
  if (state.status !== "ok") return <>{children}</>; // The role gate already blocks this case.
  const ctx = { db: getDb(), actor: state.actor };
  const [user] = await ctx.db.select({ name: appUser.fullName }).from(appUser).where(eq(appUser.id, state.actor.userId));
  const [notifications, unread, preferences, facts] = await Promise.all([
    listMyNotifications(ctx, { limit: 10 }),
    unreadCount(ctx),
    listMyPreferences(ctx),
    factsFor(role, ctx),
  ]);
  const label = LABEL[role];
  return (
    <AppShell
      brand={<BrandMark variant="text" />}
      roleLabel={label}
      nav={<LiveSidebar items={navFor(role, facts)} label={`${label} menu`} />}
      topBar={
        <ShellTopBar
          userName={user?.name ?? label}
          roleLabel={label}
          notifications={notifications}
          unread={unread}
          preferences={preferences}
          actions={{ markRead: markReadAction, markAllRead: markAllReadAction, savePreferences: savePreferencesAction, signOut }}
        />
      }
    >
      {children}
    </AppShell>
  );
}
