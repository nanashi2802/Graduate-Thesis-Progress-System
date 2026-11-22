// Auth API paths that the browser never needs (FR-ACC-06, BR-19, D-23, AD-A-010).
// Admin calls (for example remove-user or impersonate) would break "accounts are deactivated,
// never deleted". Sign-up is off. The server calls `admin/create-user` directly (AD-A-006).
export function isBlockedAuthPath(path: string[]): boolean {
  const [head, next] = path;
  return head === "admin" || (head === "sign-up" && next === "email") || head === "delete-user";
}
