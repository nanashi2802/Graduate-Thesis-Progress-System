"use server";
// Server action for the outside statuses (FR-WFL-10, BR-14, INV-27): only the Coordinator sets one.
import { field, run, type Result } from "@/app/_lib/run";
import { setOutsideStatus } from "@/server/data/outside";
import type { OutsideKind, OutsideValue } from "@/server/data/schema";

export async function setOutsideAction(milestoneId: string, kind: OutsideKind, form: FormData): Promise<Result> {
  return run(async (ctx) => setOutsideStatus(ctx, milestoneId, kind, field(form, "value") as OutsideValue));
}
