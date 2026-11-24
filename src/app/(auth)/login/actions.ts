"use server";
// Email and password sign-in (FR-ACC-01).
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { neonSendSetLink } from "@/server/auth/admin";
import { getAuth } from "@/server/auth/neon-auth";
import { afterSignInPath } from "@/server/auth/session";
import { getDb } from "@/server/data/db";
import { clearSignInFailures, clientIp, isSignInLimited, recordSignInFailure } from "@/server/data/sign-in-limit";

export type SignInState = { error?: string; message?: string };

export async function signInWithEmail(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email address and your password." };
  // The app's own rate limit (issue #57): Neon Auth sees only the server address.
  const db = getDb();
  const key = { email, ip: clientIp(await headers()) };
  if (await isSignInLimited(db, key)) {
    return { error: "Too many sign-in attempts. Wait 15 minutes, then try again, or sign in with Google." };
  }
  const { data, error } = await getAuth().signIn.email({ email, password });
  if (error || !data?.user) {
    await recordSignInFailure(db, key);
    return { error: "The email address or the password is not correct." };
  }
  await clearSignInFailures(db, key);
  redirect(await afterSignInPath(data.user));
}

export async function signOut(): Promise<void> {
  await getAuth().signOut();
  redirect("/login");
}

const SENT = "If this address has an account, an email with a reset link is on its way.";

// The same message for a known and an unknown address (FR-ACC-08). Neon Auth sends the email.
export async function requestReset(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Enter your email address." };
  try {
    await neonSendSetLink(email);
  } catch {
    // Show no difference to the user.
  }
  return { message: SENT };
}

export async function setNewPassword(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const token = String(formData.get("token") ?? "");
  const newPassword = String(formData.get("password") ?? "");
  if (!token) return { error: "This reset link is not valid. Ask for a new one." };
  if (newPassword.length < 8) return { error: "Use at least 8 characters." };
  const { error } = await getAuth().resetPassword({ newPassword, token });
  if (error) return { error: "This reset link is not valid or has expired. Ask for a new one." };
  redirect("/login");
}
