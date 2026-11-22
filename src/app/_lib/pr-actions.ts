"use server";
// Server actions of the PR workspace (S2, A2, P2): commits, Ready, gates, threads (FR-REV-02 to 07, FR-WFL-03, FR-WFL-04, NFR-01).
// Each action checks the session on the server. The data layer checks the role and the thesis again.
// The browser sends the bytes to storage. The server never gets them (NFR-12).
import { revalidatePath } from "next/cache";
import { getSessionState } from "@/server/auth/session";
import { AccessDeniedError, type DataContext } from "@/server/data/access";
import { InputProblem } from "@/server/data/coordinator";
import { getDb } from "@/server/data/db";
import { commitReadLink, confirmCommitUpload, markCommitReady, postThread, replyToThread, requestCommitUpload, resolveThread } from "@/server/data/manuscript";
import { endorseGate1b, transitionMilestone } from "@/server/data/milestones";
import { checkStoredFile, createReadLink, createUploadLink, type UploadLink } from "@/server/files/storage";

const files = { createUploadLink, checkStoredFile, createReadLink };

export type Result = { ok?: true; error?: string };

async function context(): Promise<DataContext> {
  const state = await getSessionState();
  if (state.status !== "ok") throw new AccessDeniedError("sign in first");
  return { db: getDb(), actor: state.actor };
}

// Runs one write. A known refusal becomes the text of the screen (BR-18).
async function run<T extends object>(work: (ctx: DataContext) => Promise<T | void>): Promise<Result & Partial<T>> {
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

type Meta = { sha256: string; size: number; contentType: string };

export async function requestCommit(input: Meta & { milestoneId: string }): Promise<Result & { link?: UploadLink }> {
  return run(async (ctx) => ({ link: (await requestCommitUpload(ctx, input, files)).link }));
}

export async function confirmCommit(
  input: Meta & { milestoneId: string; key: string; changeNote?: string; addressesThreadIds?: string[] },
): Promise<Result> {
  return run(async (ctx) => {
    await confirmCommitUpload(ctx, input, files);
  });
}

// FR-REV-07: mark a commit Ready. In DRAFT the milestone then moves to READY (ERD §7.1). Before Gate 1b, after a
// new commit cleared the mark (INV-06), only the mark changes.
export async function markReady(milestoneId: string, commitId: string, moveToReady: boolean): Promise<Result> {
  return run(async (ctx) => {
    await markCommitReady(ctx, milestoneId, commitId);
    if (moveToReady) await transitionMilestone(ctx, milestoneId, "READY");
  });
}

export async function endorseGate1a(milestoneId: string): Promise<Result> {
  return run(async (ctx) => {
    await transitionMilestone(ctx, milestoneId, "ADVISER_ENDORSED");
  });
}

export async function returnToStudent(milestoneId: string, reason: string): Promise<Result> {
  return run(async (ctx) => {
    await transitionMilestone(ctx, milestoneId, "RETURNED", { reason, purpose: "content" });
  });
}

export async function endorseCommit(milestoneId: string): Promise<Result> {
  return run(async (ctx) => {
    await endorseGate1b(ctx, milestoneId);
  });
}

export async function postThreadAction(commitId: string, body: string): Promise<Result> {
  return run(async (ctx) => {
    await postThread(ctx, { commitId, body });
  });
}

export async function replyAction(threadId: string, body: string): Promise<Result> {
  return run(async (ctx) => {
    await replyToThread(ctx, threadId, body);
  });
}

export async function resolveAction(threadId: string): Promise<Result> {
  return run(async (ctx) => {
    await resolveThread(ctx, threadId);
  });
}

// A signed read link for the viewer (INV-24: the data layer checks the access first).
export async function commitUrl(commitId: string): Promise<{ url?: string; error?: string }> {
  try {
    return { url: await commitReadLink(await context(), commitId, files) };
  } catch (e) {
    if (e instanceof InputProblem || e instanceof AccessDeniedError) return { error: e instanceof InputProblem ? e.message : "You cannot read this manuscript." };
    console.error(e);
    return { error: "The system could not open the file." };
  }
}
