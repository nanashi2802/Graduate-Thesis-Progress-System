"use server";
// C7 actions: verify a clearance item and close to CLEARED (FR-CLR-02 to 04, BR-02). The data layer checks the role (NFR-01).
import { revalidatePath } from "next/cache";
import { COORDINATOR_KINDS, verifyClearanceItem } from "@/server/data/clearance";
import { transitionMilestone } from "@/server/data/milestones";
import { runAction, text } from "../_lib/action";

export async function verifyItemAction(_prev: { ok?: string; error?: string }, form: FormData) {
  const kind = COORDINATOR_KINDS.find((k) => k === text(form, "kind"));
  if (!kind) return { error: "Choose an item." };
  const result = await runAction(async (ctx) => {
    await verifyClearanceItem(ctx, { milestoneId: text(form, "milestoneId"), kind, matchesApproved: form.get("matches") === "on" });
    return "Verified.";
  });
  if (result.ok) revalidatePath("/coordinator/clearance");
  return result;
}

export async function closeClearanceAction(_prev: { ok?: string; error?: string }, form: FormData) {
  const result = await runAction(async (ctx) => {
    await transitionMilestone(ctx, text(form, "milestoneId"), "CLEARED");
    return "The thesis is Cleared.";
  });
  if (result.ok) revalidatePath("/coordinator/clearance");
  return result;
}
