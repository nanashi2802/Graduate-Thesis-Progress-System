"use client";
// Source: own (BR-18, DESIGN.md §8.3, §8.4). An action that shows its reason when it is blocked.
// A blocked action uses `aria-disabled`, not `disabled`, so it stays in the tab order, and the reason
// is linked with `aria-describedby`. A blocked primary action is neutral, never a faded maroon (UX-008, G8).
// Never hide a blocked action. A flag (BR-17) never blocks: do not pass its text as a reason.
import { useId, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Glyph } from "@/components/patterns/glyphs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type BlockedActionProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "disabled"> & {
  children: ReactNode;
  /** Why the action is blocked, word for word from SITEMAP §9. Leave it out when the action is open. */
  reason?: string;
  variant?: "primary" | "secondary" | "return" | "text";
  /** compact: the 132 × 32 px row action. defense: 48 px on Defense Day. */
  size?: "default" | "compact" | "defense";
  wrapperClassName?: string;
};

const VARIANT = { primary: "default", secondary: "outline", return: "return", text: "link" } as const;
const SIZE = { default: "default", compact: "sm", defense: "defense" } as const;

export function BlockedAction({
  children,
  reason,
  variant = "primary",
  size = "default",
  className,
  wrapperClassName,
  "aria-describedby": describedBy,
  ...props
}: BlockedActionProps) {
  const reasonId = useId();
  if (reason !== undefined && reason.trim() === "") throw new Error("BlockedAction: a blocked action needs a reason (BR-18).");
  const blocked = reason !== undefined;
  // A blocked action is shown as a neutral control, whatever its variant, so it never reads as "do this now".
  const look = blocked ? (variant === "text" ? "link" : "outline") : VARIANT[variant];
  return (
    <span data-slot="blocked-action" className={cn("inline-flex flex-col items-start gap-1", wrapperClassName)}>
      <Button
        {...props}
        variant={look}
        size={SIZE[size]}
        disabled={blocked}
        focusableWhenDisabled
        aria-describedby={[describedBy, blocked ? reasonId : undefined].filter(Boolean).join(" ") || undefined}
        className={cn(
          size === "compact" && "h-(--row-action-h) w-(--row-action-w) justify-center",
          blocked && "border-border text-muted-foreground aria-disabled:opacity-100",
          className,
        )}
      >
        {children}
      </Button>
      {blocked ? (
        <span id={reasonId} className="inline-flex items-center gap-1 text-[0.8rem] leading-4 font-medium text-muted-foreground">
          <Glyph name="lock" size={16} />
          {reason}
        </span>
      ) : null}
    </span>
  );
}
