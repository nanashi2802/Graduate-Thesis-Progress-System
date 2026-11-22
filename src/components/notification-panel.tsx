// The notification center (FR-NTF-01, UTP §3.7): a panel in the top bar, with read and unread states.
// It has no route. A `details` element opens it with no script. Texts come from the fixed catalog (FR-NTF-02).
import { Bell } from "lucide-react";
import { markAllReadAction, markReadAction } from "@/app/_lib/notification-actions";
import { Button } from "@/components/ui/button";
import type { NotificationItem } from "@/server/data/notifications";

const pst = (d: Date) => d.toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" });

export function NotificationPanel({ items, unread }: { items: readonly NotificationItem[]; unread: number }) {
  return (
    <details className="relative" data-slot="notification-panel">
      <summary
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications, none unread"}
        className="relative flex size-9 cursor-pointer list-none items-center justify-center rounded-control outline-none hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden"
      >
        <Bell aria-hidden="true" strokeWidth={1.5} className="size-5" />
        {unread > 0 ? (
          <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 min-w-4 rounded-full bg-primary px-1 text-center text-[11px] leading-4 font-medium text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </summary>
      <div className="absolute right-0 z-20 mt-2 flex w-[min(92vw,380px)] flex-col gap-3 rounded-panel border border-border bg-popover p-4 shadow-md">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Notifications</h2>
          {unread > 0 ? (
            <form action={markAllReadAction}>
              <Button type="submit" variant="link" size="sm">
                Mark all read
              </Button>
            </form>
          ) : null}
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notifications yet. New events appear here.</p>
        ) : (
          <ul className="flex max-h-[60vh] flex-col divide-y divide-border overflow-y-auto">
            {items.map((n) => (
              <li key={n.id} className="flex flex-col gap-1 py-3 first:pt-0">
                <p className={n.read ? "text-sm text-muted-foreground" : "text-sm font-semibold"}>
                  {!n.read ? <span className="sr-only">Unread. </span> : null}
                  {n.event}
                </p>
                <p className="text-xs text-muted-foreground">{n.nextAction}</p>
                <div className="flex items-center justify-between gap-3">
                  <time dateTime={n.createdAt.toISOString()} className="text-xs text-muted-foreground">
                    {pst(n.createdAt)}
                  </time>
                  {!n.read ? (
                    <form action={markReadAction}>
                      <input type="hidden" name="notificationId" value={n.id} />
                      <Button type="submit" variant="link" size="xs">
                        Mark read
                      </Button>
                    </form>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
