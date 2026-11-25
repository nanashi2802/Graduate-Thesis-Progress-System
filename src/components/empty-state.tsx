// Thin adapter (R1.5, IMPLEMENTATION_PLAN.md §4.4): the pattern is in src/components/patterns/empty-state.
// The old prop `detail` maps to the pattern prop `body`. R7 moves the call sites, and R8 removes this file.
import type { ReactNode } from "react";
import { EmptyState as EmptyStatePattern } from "@/components/patterns/empty-state";

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
  return <EmptyStatePattern title={title} body={detail} action={action} className={className} />;
}
