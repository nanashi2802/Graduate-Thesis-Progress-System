"use client";
// Source: DESIGN.md §5.1, Task R2.1. Below 1024 px the sidebar is a Base UI drawer from the left.
// Base UI gives the focus trap, Escape closes it, and focus returns to the menu button.
// Motion: D-10 option A (spring-like ease, 280 ms). With reduced motion it opens and closes with no movement.
// The drawer closes when the route changes (a link in it was followed).
import { Drawer } from "@base-ui/react/drawer";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

const ICON_BUTTON =
  "flex size-11 items-center justify-center rounded-control text-foreground outline-none hover:bg-muted focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring";

export function NavDrawer({ label, children, defaultOpen = false }: { label: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const pathname = usePathname();
  // Close on a route change. State from the previous render, not an effect (react-hooks/set-state-in-effect).
  const [shownFor, setShownFor] = useState(pathname);
  if (shownFor !== pathname) {
    setShownFor(pathname);
    setOpen(false);
  }
  return (
    <Drawer.Root open={open} onOpenChange={setOpen} swipeDirection="left">
      <Drawer.Trigger aria-label="Open menu" className={`${ICON_BUTTON} lg:hidden`}>
        <Menu aria-hidden="true" strokeWidth={1.75} className="size-5" />
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 bg-foreground/30 transition-opacity duration-(--motion-drawer) data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none lg:hidden" />
        <Drawer.Viewport className="fixed inset-0 flex items-stretch justify-start lg:hidden">
          <Drawer.Popup className="h-full w-72 max-w-[calc(100vw-3rem)] overflow-y-auto overscroll-contain border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-[var(--shadow-popover)] outline-none [transform:translateX(var(--drawer-swipe-movement-x))] transition-transform duration-(--motion-drawer) ease-(--ease-drawer) data-ending-style:[transform:translateX(-100%)] data-starting-style:[transform:translateX(-100%)] data-swiping:select-none motion-reduce:transition-none">
            <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
              <Drawer.Title className="text-sm font-semibold">{label}</Drawer.Title>
              <Drawer.Close aria-label="Close menu" className={ICON_BUTTON}>
                <X aria-hidden="true" strokeWidth={1.75} className="size-5" />
              </Drawer.Close>
            </div>
            {children}
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
