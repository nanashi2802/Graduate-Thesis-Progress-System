// Neon Auth's middleware turns `neon_auth_session_verifier` into the session cookie after a
// Google sign-in (FR-ACC-01, D-23, issue #53). Portal pages keep their own role checks (NFR-01).
import type { NextRequest } from "next/server";
import { getAuth } from "@/server/auth/neon-auth";

export function proxy(request: NextRequest) {
  return getAuth().middleware({ loginUrl: "/login" })(request);
}

export const config = { matcher: ["/auth/after-sign-in"] };
