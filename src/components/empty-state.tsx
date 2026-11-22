import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * An empty region says what is missing, why, and the next step (DESIGN.md §7.11).
 * No illustrations. Example: "No endorsements are waiting." / "New items appear
 * when a Student marks a commit Ready."
 */
export function EmptyState({
  title,
  detail,
  action,
  className,
}: {
  title: string;
  detail: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div data-slot="empty-state" className={cn("flex flex-col items-start gap-2 py-6", className)}>
      <p className="text-base font-semibold text-foreground">{title}</p>
      <p className="max-w-[72ch] text-sm text-muted-foreground">{detail}</p>
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}
