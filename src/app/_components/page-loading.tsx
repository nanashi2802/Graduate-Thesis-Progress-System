// The fallback while a portal page reads the session and its data (UX-026, UX-D-15). Each page folder has a
// `loading.tsx`. A client navigation re-renders only below the shared layout, so the boundary must sit in the
// page's own segment, not in the portal folder (cacheComponents, instant navigation).
// R2.8: the R2 loading blocks by screen kind. R7 gives each screen its own composition.
import { PageLoadingBlocks, type PageKind } from "@/components/patterns/loading";

export function PageLoading({ kind = "queue" }: { kind?: PageKind }) {
  return <PageLoadingBlocks kind={kind} />;
}

export const DashboardLoading = () => <PageLoading kind="dashboard" />;
export const RecordLoading = () => <PageLoading kind="record" />;
export const FormLoading = () => <PageLoading kind="form" />;
