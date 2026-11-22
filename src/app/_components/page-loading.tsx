// The fallback while a portal page reads the session and its data. Each page folder has a `loading.tsx`
// that uses it. A client navigation re-renders only below the shared layout, so the boundary must sit
// in the page's own segment, not in the portal folder (cacheComponents, instant navigation).
export function PageLoading() {
  return (
    <p role="status" className="text-sm text-muted-foreground">
      Loading…
    </p>
  );
}
