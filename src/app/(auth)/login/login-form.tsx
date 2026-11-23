"use client";
// Sign-in form: email and password, or Google (FR-ACC-01, D-23).
import { useActionState } from "react";
import { createAuthClient } from "@neon/auth/next";
import { Button } from "@/components/ui/button";
import { requestReset, signInWithEmail, type SignInState } from "./actions";

const authClient = createAuthClient();

export function LoginForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signInWithEmail, {});
  const [reset, resetAction, resetPending] = useActionState<SignInState & { message?: string }, FormData>(requestReset, {});
  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Email address
          <input name="email" type="email" autoComplete="email" required className="rounded-md border px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="rounded-md border px-3 py-2"
          />
        </label>
        {state.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <Button
        type="button"
        variant="outline"
        onClick={() => authClient.signIn.social({ provider: "google", callbackURL: "/auth/after-sign-in" })}
      >
        Sign in with Google
      </Button>
      <details className="text-sm">
        <summary className="cursor-pointer">Forgot password</summary>
        <form action={resetAction} className="mt-2 flex flex-col gap-2">
          <input name="email" type="email" autoComplete="email" required aria-label="Email address" className="rounded-md border px-3 py-2" />
          <Button type="submit" variant="outline" disabled={resetPending}>
            Send reset link
          </Button>
          {(reset.message || reset.error) && <p role="status">{reset.message ?? reset.error}</p>}
        </form>
      </details>
    </div>
  );
}
