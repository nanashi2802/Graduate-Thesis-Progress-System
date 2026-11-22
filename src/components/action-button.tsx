"use client";

import { Lock } from "lucide-react";
import { useId, type ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

type ButtonProps = ComponentProps<typeof Button>;

type NonEmpty<T extends string> = T extends "" ? never : T;

export type ActionButtonProps<R extends string = string> = Omit<ButtonProps, "disabled" | "focusableWhenDisabled"> & {
  /**
   * Why the action is blocked (BR-18). Use the UTP 3.6 text word for word, for
   * example "Locked until Gate 1b." `undefined` means the action is open.
   */
  blockedReason?: NonEmpty<R>;
  /** Extra class for the wrapper that holds the button and the reason. */
  wrapperClassName?: string;
};

/**
 * An action that shows its reason when it is blocked (BR-18, DESIGN.md §7.4).
 * A blocked button uses `aria-disabled`, not `disabled`, so it stays in the tab
 * order and a screen reader reads the reason through `aria-describedby`.
 * Never hide a blocked action. A flag (BR-17) never blocks: do not pass its text here.
 */
export function ActionButton<R extends string>({
  blockedReason,
  wrapperClassName,
  "aria-describedby": describedBy,
  ...props
}: ActionButtonProps<R>) {
  const reasonId = useId();
  if (blockedReason !== undefined && blockedReason.trim() === "") {
    throw new Error("ActionButton: a blocked action needs a reason (BR-18).");
  }
  const blocked = blockedReason !== undefined;
  const describedByIds = [describedBy, blocked ? reasonId : undefined].filter(Boolean).join(" ") || undefined;

  return (
    <span data-slot="action" className={cn("inline-flex flex-col items-start gap-1", wrapperClassName)}>
      <Button {...props} disabled={blocked} focusableWhenDisabled aria-describedby={describedByIds} />
      {blocked ? (
        <span id={reasonId} className="inline-flex items-center gap-1 text-xs leading-4 font-medium text-muted-foreground">
          <Lock aria-hidden="true" strokeWidth={1.5} className="size-3.5" />
          {blockedReason}
        </span>
      ) : null}
    </span>
  );
}
