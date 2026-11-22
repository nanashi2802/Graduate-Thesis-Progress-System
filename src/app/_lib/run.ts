// Shared server-action plumbing for the role screens (NFR-01, BR-18). Server only.
import "server-only";
import { revalidatePath } from "next/cache";
import { getSessionState } from "@/server/auth/session";
import { AccessDeniedError, type DataContext } from "@/server/data/access";
import { InputProblem } from "@/server/data/coordinator";
import { getDb } from "@/server/data/db";

export type Result = { ok?: true; error?: string };

// Each action checks the session on the server. The data layer checks the role and the thesis again.
export async function context(): Promise<DataContext> {
  const state = await getSessionState();
  if (state.status !== "ok") throw new AccessDeniedError("sign in first");
  return { db: getDb(), actor: state.actor };
}

// Runs one write. A known refusal becomes the text of the screen (BR-18).
export async function run<T extends object = object>(work: (ctx: DataContext) => Promise<T | void>): Promise<Result & Partial<T>> {
  try {
    const out = await work(await context());
    revalidatePath("/", "layout");
    return { ok: true, ...(out ?? {}) } as Result & Partial<T>;
  } catch (e) {
    const fail = (error: string) => ({ error }) as Result & Partial<T>;
    if (e instanceof InputProblem) return fail(e.message);
    if (e instanceof AccessDeniedError) return fail("You cannot do this action.");
    console.error(e);
    return fail("The system could not save the change. Try again.");
  }
}

export const field = (form: FormData, key: string): string => String(form.get(key) ?? "").trim();

// A `datetime-local` value is Philippine Standard Time, UTC+8 (NFR-11).
export const pstDateTime = (value: string): Date => new Date(`${value}:00+08:00`);
