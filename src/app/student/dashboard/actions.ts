"use server";
// S1 action: the Student edits the working thesis title until Gate 1b (FR-ACC-09, BR-07, D-24).
// The data layer checks the role, the thesis and the lock (NFR-01).
import { run, type Result } from "@/app/_lib/run";
import { updateThesisTitle } from "@/server/data/students";

export async function updateTitleAction(title: string): Promise<Result> {
  return run(async (ctx) => {
    await updateThesisTitle(ctx, { title });
  });
}
