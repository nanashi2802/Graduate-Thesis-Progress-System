"use client";
// Source: DESIGN.md §5.1, design/screens/README.md (Sidebars), brand guide (Sample Application: Web), Task R2.1.
// Every item of the role. The active item has aria-current="page". A locked item is a focusable span with
// aria-disabled, a lock glyph, and its reason in a hidden text (aria-describedby) and a tooltip (BR-18, G10).
// Look (decision R2-a): "brand" = card-white sidebar, the active item on a maroon-50 fill with maroon text and a
// 3 px maroon left marker (option A, recommended). "neutral" = the v0.2 muted sidebar (option B).
// Brand rule: 20 px glyphs in the navigation, a label with each glyph.
import { Tooltip } from "@base-ui/react/tooltip";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId } from "react";
import { Glyph } from "@/components/patterns/glyphs";
import { cn } from "@/lib/utils";
import { isActive, type NavItem } from "./nav";

export type SidebarLook = "brand" | "neutral";

export type SidebarProps = {
  items: readonly NavItem[];
  /** The current path. `LiveSidebar` passes `usePathname()`; `/lab` passes a fixed path. */
  activeHref: string;
  /** The accessible name of the navigation, for example "Student menu". */
  label: string;
  look?: SidebarLook;
  /** Called when the user follows a link (the drawer closes). */
  onNavigate?: () => void;
};

const ROW =
  "flex h-11 items-center gap-3 border-l-[3px] px-4 text-sm outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-ring";

function Count({ n }: { n: number }) {
  return (
    <span className="ml-auto min-w-6 rounded-stamp bg-muted px-1.5 text-center font-mono text-[0.8rem] leading-5 text-muted-foreground tabular-nums">
      {n}
      <span className="sr-only"> items</span>
    </span>
  );
}

function LockedItem({ item }: { item: NavItem }) {
  const id = useId();
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        delay={300}
        render={
          <span
            tabIndex={0}
            aria-disabled="true"
            aria-describedby={id}
            data-locked="true"
            className={cn(ROW, "cursor-default border-transparent text-muted-foreground")}
          />
        }
      >
        <Glyph name={item.glyph} size={20} />
        <span>{item.label}</span>
        <Glyph name="lock" size={16} className="ml-auto" />
        <span id={id} className="sr-only">
          {item.lockedReason}
        </span>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner side="right" sideOffset={8} className="z-50">
          <Tooltip.Popup className="max-w-60 rounded-control border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-[var(--shadow-popover)] transition-opacity duration-(--motion-overlay) data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none">
            {item.lockedReason}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function Sidebar({ items, activeHref, label, look = "brand", onNavigate }: SidebarProps) {
  return (
    <nav aria-label={label} data-look={look} className={cn("flex-1 py-3", look === "neutral" && "bg-muted")}>
      <Tooltip.Provider>
        <ul className="flex flex-col gap-0.5">
          {items.map((item) => {
            if (item.lockedReason || !item.href) {
              return (
                <li key={item.label}>
                  <LockedItem item={item} />
                </li>
              );
            }
            const active = isActive(item.href, activeHref);
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    ROW,
                    active
                      ? look === "brand"
                        ? "border-primary bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                        : "border-primary font-semibold text-link"
                      : look === "brand"
                        ? "border-transparent text-sidebar-foreground hover:bg-muted"
                        : "border-transparent text-foreground hover:bg-border",
                  )}
                >
                  <Glyph name={item.glyph} size={20} />
                  <span>{item.label}</span>
                  {item.count ? <Count n={item.count} /> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </Tooltip.Provider>
    </nav>
  );
}

/** The live sidebar: the active item follows the route. */
export function LiveSidebar(props: Omit<SidebarProps, "activeHref">) {
  const pathname = usePathname() ?? "";
  return <Sidebar {...props} activeHref={pathname} />;
}
