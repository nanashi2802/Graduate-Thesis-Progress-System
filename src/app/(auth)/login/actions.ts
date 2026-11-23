"use server";
// Email and password sign-in (FR-ACC-01).
import { redirect } from "next/navigation";
import { appLink } from "@/server/notify/link";
import { getAuth } from "@/server/auth/neon-auth";
import { afterSignInPath } from "@/server/auth/session";

export type SignInState = { error?: string };

export async function signInWithEmail(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email address and your password." };
  const { data, error } = await getAuth().signIn.email({ email, password });
  if (error || !data?.user) return { error: "The email address or the password is not correct." };
  redirect(await afterSignInPath(data.user));
}

export async function signOut(): Promise<void> {
  await getAuth().signOut();
  redirect("/login");
}

const SENT = "If this address has an account, an email with a reset link is on its way.";

// The same message for a known and an unknown address (FR-ACC-08). Neon Auth sends the email.
export async function requestReset(_prev: SignInState, formData: FormData): Promise<SignInState & { message?: string }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Enter your email address." };
  try {
    await getAuth().requestPasswordReset({ email, redirectTo: appLink("/login/reset") });
  } catch {
    // Show no difference to the user.
  }
  return { message: SENT };
}

export async function setNewPassword(_prev: SignInState, formData: FormData): Promise<SignInState & { message?: string }> {
  const token = String(formData.get("token") ?? "");
  const newPassword = String(formData.get("password") ?? "");
  if (!token) return { error: "This reset link is not valid. Ask for a new one." };
  if (newPassword.length < 8) return { error: "Use at least 8 characters." };
  const { error } = await getAuth().resetPassword({ newPassword, token });
  if (error) return { error: "This reset link is not valid or has expired. Ask for a new one." };
  redirect("/login");
}
