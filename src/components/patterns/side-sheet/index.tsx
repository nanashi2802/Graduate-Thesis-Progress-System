"use client";
// Source: Primer side sheet (DESIGN.md §7.4 side-sheet), Base UI drawer, Task R3.6. Screens: C2, C3, C8, C9, A4, P3,
// and the top-bar sheets (notifications, email preferences).
// A right side sheet. Base UI gives the focus trap; Escape closes it; focus returns to the trigger. Motion: D-10 A.
// Width (decision R3-d B): 480 px by default, 400 px for the top-bar panels, full width below 640 px. Backdrop
// (decision R3-g A): the `--scrim` token, the one backdrop of every dialog, sheet and drawer.
import { Drawer } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const SHEET_WIDTH = { "400": "w-full sm:w-[400px]", "480": "w-full sm:w-[480px]", "560": "w-full sm:w-[560px]" } as const;
export type SheetWidth = keyof typeof SHEET_WIDTH;

/** The one backdrop (R3-g A): dialogs, sheets, the nav drawer and the route palette. */
export const SCRIM = "bg-(--scrim)";

const CLOSE =
  "relative flex size-11 items-center justify-center rounded-control text-foreground outline-none hover:bg-muted focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring";

export type SheetPopupProps = {
  title: string;
  children: ReactNode;
  /** The sticky footer: the one primary action of the sheet, then Cancel. */
  footer?: ReactNode;
  width?: SheetWidth;
};

/** The popup part, for a caller that owns its own `Drawer.Root` (the top bar). */
export function SheetPopup({ title, children, footer, width = "400" }: SheetPopupProps) {
  return (
    <Drawer.Portal>
      <Drawer.Backdrop
        className={cn(
          "fixed inset-0 transition-opacity duration-(--motion-drawer) data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none",
          SCRIM,
        )}
      />
      <Drawer.Viewport className="fixed inset-0 flex items-stretch justify-end">
        <Drawer.Popup
          data-width={width}
          className={cn(
            "flex h-full flex-col border-l border-border bg-popover text-popover-foreground shadow-[var(--shadow-popover)] outline-none [transform:translateX(var(--drawer-swipe-movement-x))] transition-transform duration-(--motion-drawer) ease-(--ease-drawer) data-ending-style:[transform:translateX(100%)] data-starting-style:[transform:translateX(100%)] motion-reduce:transition-none",
            SHEET_WIDTH[width],
          )}
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
            <Drawer.Title className="text-base font-semibold">{title}</Drawer.Title>
            <Drawer.Close aria-label="Close" className={CLOSE}>
              <X aria-hidden="true" strokeWidth={1.75} className="size-5" />
            </Drawer.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">{children}</div>
          {footer ? (
            <div data-slot="sheet-footer" className="flex shrink-0 items-center gap-3 border-t border-border bg-popover px-4 py-3">
              {footer}
            </div>
          ) : null}
        </Drawer.Popup>
      </Drawer.Viewport>
    </Drawer.Portal>
  );
}

export type SideSheetProps = SheetPopupProps & {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  /** The opener. Base UI returns focus to it when the sheet closes. */
  trigger?: ReactElement;
};

export function SideSheet({ open, onOpenChange, defaultOpen, trigger, width = "480", ...popup }: SideSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={(o) => onOpenChange?.(o)} defaultOpen={defaultOpen} swipeDirection="right">
      {trigger ? <Drawer.Trigger render={trigger} /> : null}
      <SheetPopup width={width} {...popup} />
    </Drawer.Root>
  );
}

/** Close the sheet from a footer button ("Cancel"). */
export const SheetClose = Drawer.Close;
