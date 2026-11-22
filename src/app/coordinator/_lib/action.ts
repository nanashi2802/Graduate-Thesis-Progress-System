// Shared server-action plumbing for the Coordinator screens (NFR-01, BR-18). Server only.
import "server-only";
import { AccessDeniedError, type DataContext } from "@/server/data/access";
import { DuplicateEmailError } from "@/server/data/accounts";
import { InputProblem } from "@/server/data/coordinator";
import { getDb } from "@/server/data/db";
import { getSessionState } from "@/server/auth/session";

export type FormState = { ok?: string; error?: string };

// Each action checks the session on the server. The data layer checks the role again.
export async function sessionContext(): Promise<DataContext> {
  const state = await getSessionState();
  if (state.status !== "ok") throw new AccessDeniedError("sign in first");
  return { db: getDb(), actor: state.actor };
}

// Runs a write and turns a known refusal into a message for the form.
export async function runAction(work: (ctx: DataContext) => Promise<string>): Promise<FormState> {
  try {
    return { ok: await work(await sessionContext()) };
  } catch (e) {
    if (e instanceof InputProblem || e instanceof DuplicateEmailError) return { error: e.message };
    if (e instanceof AccessDeniedError) return { error: "You cannot do this action. Only an active Coordinator can." };
    console.error(e);
    return { error: "The system could not save the change. Try again." };
  }
}

export const text = (form: FormData, key: string): string => String(form.get(key) ?? "").trim();
export const optionalText = (form: FormData, key: string): string | null => text(form, key) || null;
export const int = (form: FormData, key: string): number => Number(text(form, key));
