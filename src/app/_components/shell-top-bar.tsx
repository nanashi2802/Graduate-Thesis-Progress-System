"use client";
// The live top bar (R2.8, D-08 option A): theme switch, notification sheet, user menu with the email preferences
// sheet. The server actions come in as props from the role shell. A saved preference shows a toast (UX-D-04).
// The route or command palette of D-08 waits for its scope (later discussion).
import { ThemeToggle } from "@/components/patterns/theme-toggle";
import { useToast } from "@/components/patterns/toast";
import { NotificationsSheet, UserMenu, type TopBarActions, type TopBarNotification, type TopBarPreference } from "@/components/patterns/top-bar";

export function ShellTopBar({
  userName,
  roleLabel,
  notifications,
  unread,
  preferences,
  actions,
}: {
  userName: string;
  roleLabel: string;
  notifications: readonly TopBarNotification[];
  unread: number;
  preferences: readonly TopBarPreference[];
  actions: TopBarActions;
}) {
  const toast = useToast();
  return (
    <>
      <ThemeToggle compact />
      <NotificationsSheet items={notifications} unread={unread} actions={actions} />
      <UserMenu
        userName={userName}
        roleLabel={roleLabel}
        preferences={preferences}
        actions={actions}
        onPreferencesSaved={() => toast.show({ label: "Preferences saved.", tone: "done" })}
      />
    </>
  );
}
