// Auth API paths that the browser never needs (FR-ACC-06, BR-19, D-23, AD-A-010).
// Admin calls (for example remove-user or impersonate) would break "accounts are deactivated,
// never deleted". Sign-up is off. The server calls `admin/create-user` directly (AD-A-006).
// Email sign-in goes only through the server action `signInWithEmail`, so the app's own
// rate limit always runs (issue #57). The browser uses this proxy for Google sign-in only.
export function isBlockedAuthPath(path: string[]): boolean {
  const [head, next] = path;
  return (
    head === "admin" ||
    (head === "sign-up" && next === "email") ||
    (head === "sign-in" && next === "email") ||
    head === "delete-user"
  );
}
