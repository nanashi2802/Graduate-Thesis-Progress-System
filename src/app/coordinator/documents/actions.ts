"use server";
// C4 action: the Coordinator reviews a document (FR-DOC-06, FR-DOC-07, BR-12, BR-13). The data layer checks the role (NFR-01).
import { revalidatePath } from "next/cache";
import { InputProblem } from "@/server/data/coordinator";
import { reviewDocument } from "@/server/data/documents";
import { runAction, text, type FormState } from "../_lib/action";

const DONE = {
  verified: "Verified against the paper.",
  returned: "Returned to the uploader with your reason.",
} as const;

export async function reviewDocumentAction(_prev: FormState, form: FormData): Promise<FormState> {
  const to = text(form, "to");
  if (!(to in DONE)) return { error: "Choose an action." };
  const step = to as keyof typeof DONE;
  const result = await runAction(async (ctx) => {
    const res = await reviewDocument(ctx, { documentId: text(form, "documentId"), to: step, reason: text(form, "reason") });
    if (!res.ok) throw new InputProblem(res.reason);
    return DONE[step];
  });
  if (result.ok) revalidatePath("/coordinator/documents");
  return result;
}
