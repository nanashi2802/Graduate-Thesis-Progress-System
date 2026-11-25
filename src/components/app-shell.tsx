// The app shell (DESIGN.md §5.1): maroon masthead rule, top bar, 240 px sidebar, content.
// Below 1024 px the sidebar becomes a menu in the top bar. The sign-out form posts to the server action.
import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { signOut } from "@/app/(auth)/login/actions";
import { NavLinks, type NavItem } from "@/components/nav-links";
import { NotificationPanel } from "@/components/notification-panel";
import { PreferencesForm } from "@/components/preferences-form";
import { Button } from "@/components/ui/button";
import type { NotificationItem } from "@/server/data/notifications";
import type { PreferenceRow } from "@/server/data/preferences";

export function AppShell({
  roleLabel,
  userName,
  nav,
  notifications,
  unread,
  preferences,
  children,
}: {
  roleLabel: string;
  userName: string;
  nav: readonly NavItem[];
  notifications: readonly NotificationItem[];
  unread: number;
  preferences: readonly PreferenceRow[];
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <div aria-hidden="true" className="h-[3px] bg-primary" />
      <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4 sm:px-6">
        <details className="relative lg:hidden">
          <summary
            aria-label="Menu"
            className="flex size-9 cursor-pointer list-none items-center justify-center rounded-control outline-none hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden"
          >
            <Menu aria-hidden="true" strokeWidth={1.5} className="size-5" />
          </summary>
          <nav aria-label={`${roleLabel} menu`} className="absolute left-0 z-20 mt-2 w-60 rounded-panel border border-border bg-popover py-2 shadow-md">
            <NavLinks items={nav} />
          </nav>
        </details>
        <p className="font-serif text-base font-semibold">PUP CpE Thesis Progress</p>
        <span className="hidden text-sm text-muted-foreground sm:inline">{roleLabel}</span>
        <div className="ml-auto flex items-center gap-2">
          <NotificationPanel items={notifications} unread={unread} />
          <details className="relative">
            <summary className="flex h-9 max-w-[200px] cursor-pointer list-none items-center rounded-control px-2 text-sm outline-none hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
              <span className="truncate">{userName}</span>
            </summary>
            <div className="absolute right-0 z-20 mt-2 flex w-[min(92vw,320px)] flex-col gap-2 rounded-panel border border-border bg-popover p-3 shadow-md">
              <p className="text-xs text-muted-foreground">Signed in as {userName}</p>
              <PreferencesForm rows={preferences} />
              <form action={signOut}>
                <Button type="submit" variant="outline" size="sm">
                  Sign out
                </Button>
              </form>
            </div>
          </details>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-border bg-neutral-100 py-4 lg:block">
          <nav aria-label={`${roleLabel} menu`}>
            <NavLinks items={nav} />
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
