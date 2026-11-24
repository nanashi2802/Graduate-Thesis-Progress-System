"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { setNewPassword, type SignInState } from "../actions";

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(setNewPassword, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      <label className="flex flex-col gap-1 text-sm">
        New password
        <input name="password" type="password" autoComplete="new-password" minLength={8} required className="rounded-md border px-3 py-2" />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        Save password
      </Button>
    </form>
  );
}
