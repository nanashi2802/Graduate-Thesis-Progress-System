"use server";
// C6 actions: sheet scan, verify, Minutes, close and Certification (FR-DEF-08 to FR-DEF-10, FR-WFL-06, BR-12, BR-19).
// The data layer checks the role and the rules again (NFR-01).
import { revalidatePath } from "next/cache";
import { getSessionState } from "@/server/auth/session";
import { AccessDeniedError } from "@/server/data/access";
import { InputProblem } from "@/server/data/coordinator";
import { getDb } from "@/server/data/db";
import { closeDefense, confirmSheetUpload, issueMinutes, requestSheetUpload, verifySheet } from "@/server/data/defense";
import { transitionMilestone } from "@/server/data/milestones";
import { checkStoredFile, createUploadLink, type UploadLink } from "@/server/files/storage";
import { runAction, text, type FormState } from "../../_lib/action";

const files = { createUploadLink, checkStoredFile };
type Meta = { sha256: string; size: number; contentType: string };

async function context() {
  const state = await getSessionState();
  if (state.status !== "ok") throw new AccessDeniedError("sign in first");
  return { db: getDb(), actor: state.actor };
}

function problem(e: unknown): string {
  if (e instanceof InputProblem) return e.message;
  if (e instanceof AccessDeniedError) return "You cannot do this action. Only an active Coordinator can.";
  console.error(e);
  return "The system could not save the change. Try again.";
}

export async function requestSheetScan(input: Meta & { entryId: string }): Promise<{ link?: UploadLink; error?: string }> {
  try {
    const { link } = await requestSheetUpload(await context(), input.entryId, input, files);
    return { link };
  } catch (e) {
    return { error: problem(e) };
  }
}

export async function confirmSheetScan(input: Meta & { entryId: string; key: string }): Promise<{ ok?: true; error?: string }> {
  try {
    await confirmSheetUpload(await context(), input.entryId, input, files);
    revalidatePath("/coordinator/defense/[defenseId]", "page");
    return { ok: true };
  } catch (e) {
    return { error: problem(e) };
  }
}

async function done(result: FormState): Promise<FormState> {
  if (result.ok) revalidatePath("/coordinator/defense/[defenseId]", "page");
  return result;
}

export async function verifySheetAction(_prev: FormState, form: FormData): Promise<FormState> {
  const result = text(form, "result") === "mismatch" ? "mismatch" : "matched";
  return done(
    await runAction(async (ctx) => {
      await verifySheet(ctx, text(form, "entryId"), result);
      return result === "matched" ? "The sheet is verified and locked." : "Mismatch recorded. The member corrects the sheet. It does not stop the defense (BR-12).";
    }),
  );
}

export async function issueMinutesAction(_prev: FormState, form: FormData): Promise<FormState> {
  return done(
    await runAction(async (ctx) => {
      await issueMinutes(ctx, text(form, "attemptId"), text(form, "body"));
      return "The Minutes are issued. They cannot change (BR-19).";
    }),
  );
}

export async function closeDefenseAction(_prev: FormState, form: FormData): Promise<FormState> {
  return done(
    await runAction(async (ctx) => {
      await closeDefense(ctx, text(form, "milestoneId"));
      return "The stage is closed.";
    }),
  );
}

export async function certifyAction(_prev: FormState, form: FormData): Promise<FormState> {
  return done(
    await runAction(async (ctx) => {
      await transitionMilestone(ctx, text(form, "milestoneId"), "CERTIFIED");
      return "The Proposal is certified. The Adviser can approve data gathering.";
    }),
  );
}
