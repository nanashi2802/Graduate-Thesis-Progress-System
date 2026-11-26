"use client";
// Source: DESIGN.md §5.1, decision D-08 (options), FR-NTF-01, FR-NTF-05, FR-NTF-09, INV-29, BR-18, UX-005, Task R2.2.
// The top-bar controls. Option A (recommended): the notifications in a right side sheet (Base UI drawer), the user
// menu as a Base UI menu, the email preferences in a side sheet, no search. Option B adds `RoutePalette`: a "/" key
// dialog that only jumps to the sidebar routes (no search feature exists).
// Behavior kept from `NotificationPanel` and `PreferencesForm`: mark read, mark all read, one form saves every
// optional switch, "Always on" rows show the reason. The server actions come in as props (the lab passes mocks).
import { Dialog } from "@base-ui/react/dialog";
import { Drawer } from "@base-ui/react/drawer";
import { Menu } from "@base-ui/react/menu";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import { Glyph } from "@/components/patterns/glyphs";
import { SheetPopup } from "@/components/patterns/side-sheet";
import type { NavItem } from "@/components/patterns/sidebar/nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** The fields of `NotificationItem` (src/server/data/notifications.ts) that the sheet shows. */
export type TopBarNotification = { id: string; event: string; nextAction: string; createdAt: Date; read: boolean };
/** The same shape as `PreferenceRow` (src/server/data/preferences.ts). */
export type TopBarPreference = { code: string; event: string; optional: boolean; enabled: boolean };

export type TopBarActions = {
  markRead: (form: FormData) => Promise<void>;
  markAllRead: () => Promise<void>;
  savePreferences: (form: FormData) => Promise<void>;
  signOut: () => Promise<void>;
};

const ICON_BUTTON =
  "relative flex size-11 items-center justify-center rounded-control text-foreground outline-none hover:bg-muted focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring data-popup-open:bg-muted";

const pht = (d: Date) => d.toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" }) + " PHT";

/** The unread badge: 12.8 px minimum (UX-005). The count is in the button name, so the badge is hidden. */
function Badge({ n }: { n: number }) {
  return (
    <span aria-hidden="true" className="absolute top-1 right-1 min-w-5 rounded-full bg-primary px-1 text-center text-[0.8rem] leading-5 font-semibold text-primary-foreground tabular-nums">
      {n > 9 ? "9+" : n}
    </span>
  );
}

export function NotificationsSheet({
  items,
  unread,
  actions,
  defaultOpen,
}: {
  items: readonly TopBarNotification[];
  unread: number;
  actions: Pick<TopBarActions, "markRead" | "markAllRead">;
  defaultOpen?: boolean;
}) {
  return (
    <Drawer.Root swipeDirection="right" defaultOpen={defaultOpen}>
      <Drawer.Trigger aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications, none unread"} className={ICON_BUTTON}>
        <Glyph name="bell" size={20} />
        {unread > 0 ? <Badge n={unread} /> : null}
      </Drawer.Trigger>
      <SheetPopup title="Notifications">
        {/* UX-D-16: the row keeps its height when "Mark all read" goes, so the list does not move up. */}
        <div data-slot="mark-all" className="mb-3 flex h-9 items-center justify-end">
          {unread > 0 ? (
            <form action={actions.markAllRead}>
              <Button type="submit" variant="link" size="sm">
                Mark all read
              </Button>
            </form>
          ) : null}
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notifications yet. New events appear here.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {items.map((n) => (
              <li key={n.id} className="flex gap-3 py-3 first:pt-0">
                <span aria-hidden="true" className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-primary")} />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className={n.read ? "text-sm text-muted-foreground" : "text-sm font-semibold"}>
                    {!n.read ? <span className="sr-only">Unread. </span> : null}
                    {n.event}
                  </p>
                  <p className="text-sm text-muted-foreground">{n.nextAction}</p>
                  <div className="flex items-center justify-between gap-3">
                    <time dateTime={n.createdAt.toISOString()} className="font-mono text-[0.8rem] text-muted-foreground">
                      {pht(n.createdAt)}
                    </time>
                    {!n.read ? (
                      <form action={actions.markRead}>
                        <input type="hidden" name="notificationId" value={n.id} />
                        <Button type="submit" variant="link" size="xs">
                          Mark read
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SheetPopup>
    </Drawer.Root>
  );
}

function PreferencesBody({ rows, save, onSaved }: { rows: readonly TopBarPreference[]; save: TopBarActions["savePreferences"]; onSaved?: () => void }) {
  return (
    <form
      action={async (form) => {
        await save(form);
        onSaved?.();
      }}
      className="flex flex-col gap-4"
    >
      <p className="text-sm text-muted-foreground">You always get the in-app notification. These switches set the email.</p>
      <ul className="flex flex-col divide-y divide-border">
        {rows.map((r) => (
          <li key={r.code} className="py-3 text-sm first:pt-0">
            {r.optional ? (
              <label className="flex items-start gap-3">
                <input type="checkbox" name={`on_${r.code}`} defaultChecked={r.enabled} className="mt-0.5 size-4 accent-primary" />
                <span>{r.event}</span>
              </label>
            ) : (
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-muted-foreground">
                  <Glyph name="lock" size={16} />
                </span>
                <p>
                  {r.event}
                  <span className="block text-[0.8rem] text-muted-foreground">Always on. The system needs you to see this event.</span>
                </p>
              </div>
            )}
          </li>
        ))}
      </ul>
      <Button type="submit" className="self-start">
        Save
      </Button>
    </form>
  );
}

const MENU_ITEM =
  "flex h-11 cursor-default items-center gap-3 rounded-control px-3 text-sm outline-none select-none data-highlighted:bg-muted focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring";

export function UserMenu({
  userName,
  roleLabel,
  preferences,
  actions,
  onPreferencesSaved,
  defaultOpen,
}: {
  userName: string;
  roleLabel: string;
  preferences: readonly TopBarPreference[];
  actions: Pick<TopBarActions, "savePreferences" | "signOut">;
  onPreferencesSaved?: () => void;
  defaultOpen?: boolean;
}) {
  const [prefsOpen, setPrefsOpen] = useState(false);
  return (
    <>
      <Menu.Root defaultOpen={defaultOpen}>
        <Menu.Trigger className={cn(ICON_BUTTON, "w-auto max-w-[200px] gap-1 px-2 text-sm")}>
          <span className="truncate">{userName}</span>
          <ChevronDown aria-hidden="true" strokeWidth={1.75} className="size-4 shrink-0" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner align="end" sideOffset={6} className="z-50">
            <Menu.Popup className="w-64 origin-(--transform-origin) rounded-card border border-border bg-popover p-1 text-popover-foreground shadow-[var(--shadow-popover)] outline-none transition-[opacity,scale] duration-(--motion-overlay) data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none motion-reduce:data-ending-style:scale-100 motion-reduce:data-starting-style:scale-100">
              <Menu.Group>
                <Menu.GroupLabel className="px-3 py-2 text-[0.8rem] text-muted-foreground">
                  Signed in as {userName} · {roleLabel}
                </Menu.GroupLabel>
              </Menu.Group>
              <Menu.Separator className="my-1 h-px bg-border" />
              <Menu.Item className={MENU_ITEM} onClick={() => setPrefsOpen(true)}>
                <Glyph name="bell" size={20} />
                Email preferences
              </Menu.Item>
              <Menu.Item className={MENU_ITEM} onClick={() => void actions.signOut()}>
                <Glyph name="export" size={20} className="rotate-90" />
                Sign out
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <Drawer.Root open={prefsOpen} onOpenChange={setPrefsOpen} swipeDirection="right">
        <SheetPopup title="Email preferences">
          <PreferencesBody
            rows={preferences}
            save={actions.savePreferences}
            onSaved={() => {
              setPrefsOpen(false);
              onPreferencesSaved?.();
            }}
          />
        </SheetPopup>
      </Drawer.Root>
    </>
  );
}

/**
 * D-08 option B: a "/" key dialog that jumps to a sidebar route. Routes only: it searches no record.
 * Open items only; a locked item is not listed.
 */
export function RoutePalette({ items, defaultOpen }: { items: readonly NavItem[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const [q, setQ] = useState("");
  const router = useRouter();
  const listId = useId();
  const routes = useMemo(() => items.filter((i) => i.href && !i.lockedReason && i.label.toLowerCase().includes(q.trim().toLowerCase())), [items, q]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key !== "/" || e.metaKey || e.ctrlKey || t?.closest("input, textarea, select, [contenteditable]")) return;
      e.preventDefault();
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <Dialog.Root open={open} onOpenChange={(o) => (setOpen(o), o || setQ(""))}>
      <Dialog.Trigger aria-label="Go to a page" aria-keyshortcuts="/" className={ICON_BUTTON}>
        <Glyph name="search" size={20} />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-foreground/30 transition-opacity duration-(--motion-overlay) data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none" />
        <Dialog.Popup className="fixed top-24 left-1/2 w-[min(92vw,480px)] -translate-x-1/2 rounded-panel border border-border bg-popover p-2 text-popover-foreground shadow-[var(--shadow-popover)] outline-none transition-opacity duration-(--motion-overlay) data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none">
          <Dialog.Title className="sr-only">Go to a page</Dialog.Title>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && routes[0]?.href) {
                router.push(routes[0].href);
                setOpen(false);
              }
            }}
            aria-controls={listId}
            placeholder="Type a page name"
            className="h-11 w-full rounded-control border border-input bg-card px-3 text-sm"
          />
          <ul id={listId} className="mt-2 flex flex-col">
            {routes.map((r) => (
              <li key={r.label}>
                <Dialog.Close
                  render={<button type="button" />}
                  onClick={() => r.href && router.push(r.href)}
                  className={cn(MENU_ITEM, "w-full text-left")}
                >
                  <Glyph name={r.glyph} size={20} />
                  {r.label}
                </Dialog.Close>
              </li>
            ))}
            {routes.length === 0 ? <li className="px-3 py-2 text-sm text-muted-foreground">No page has this name.</li> : null}
          </ul>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
