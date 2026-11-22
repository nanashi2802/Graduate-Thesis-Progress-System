// The Google sign-in returns here (D-23). See `afterSignInPath` for the rules.
import { NextResponse, type NextRequest } from "next/server";
import { afterSignInPath } from "@/server/auth/session";

export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL(await afterSignInPath(), request.url));
}
