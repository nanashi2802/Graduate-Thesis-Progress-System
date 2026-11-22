"use server";
// Server actions for revision items (FR-REV-13): the Coordinator enters them, the Student links them, members accept them.
import { field, run, type Result } from "@/app/_lib/run";
import { acceptRevision, addRevisionItems, linkRevisionToCommit } from "@/server/data/revisions";

export async function addItemsAction(attemptId: string, form: FormData): Promise<Result> {
  return run(async (ctx) => {
    await addRevisionItems(ctx, attemptId, field(form, "items").split(/\r?\n/));
  });
}

export async function linkItemAction(itemId: string, form: FormData): Promise<Result> {
  return run(async (ctx) => linkRevisionToCommit(ctx, itemId, field(form, "commitId")));
}

export async function acceptItemAction(itemId: string): Promise<Result> {
  return run(async (ctx) => acceptRevision(ctx, itemId));
}
