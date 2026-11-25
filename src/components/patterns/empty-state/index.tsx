// Source: Vercel Geist empty states (DESIGN.md §8.11). An empty region says what will appear, from where,
// and the next step. No illustrations. Teaching text belongs here (DESIGN.md §2.1).
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type EmptyStateProps = { title: string; body?: string; action?: ReactNode; className?: string };

export function EmptyState({ title, body, action, className }: EmptyStateProps) {
  return (
    <div data-slot="empty-state" className={cn("flex flex-col items-start gap-2 py-6", className)}>
      <p className="text-base font-semibold text-foreground">{title}</p>
      {body ? <p className="max-w-[72ch] text-sm text-muted-foreground">{body}</p> : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}
