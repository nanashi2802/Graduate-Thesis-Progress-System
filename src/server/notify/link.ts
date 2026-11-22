// The link in an email (FR-NTF-03): it opens the app, and sign-in is required. No other data goes in the link.
export function appLink(path: string): string {
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
