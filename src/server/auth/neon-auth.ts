// The Neon Auth server instance (FR-ACC-01, D-23, AD-A-004). Server only.
import "server-only";
import { createNeonAuth, type NeonAuth } from "@neon/auth/next/server";

let auth: NeonAuth | undefined;

// Made on first use, so `next build` works without the variables (CI has no secrets).
export function getAuth(): NeonAuth {
  if (!auth) {
    const baseUrl = process.env.NEON_AUTH_BASE_URL;
    const secret = process.env.NEON_AUTH_COOKIE_SECRET;
    if (!baseUrl || !secret) throw new Error("NEON_AUTH_BASE_URL or NEON_AUTH_COOKIE_SECRET is not set");
    auth = createNeonAuth({ baseUrl, cookies: { secret } });
  }
  return auth;
}
