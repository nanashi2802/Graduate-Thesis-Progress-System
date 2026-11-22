"use server";
// Email and password sign-in (FR-ACC-01).
import { redirect } from "next/navigation";
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
