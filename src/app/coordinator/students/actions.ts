"use server";
// C2 actions (FR-ACC-04, FR-ACC-07). The data layer checks the role (NFR-01).
import { revalidatePath } from "next/cache";
import { neonCreateAuthUser } from "@/server/auth/admin";
import { createStudent } from "@/server/data/students";
import type { DegreeLevelValue, Writing1CourseValue } from "@/server/data/schema";
import { optionalText, runAction, text, type FormState } from "../_lib/action";

export async function createStudentAction(_prev: FormState, form: FormData): Promise<FormState> {
  const result = await runAction(async (ctx) => {
    await createStudent(
      ctx,
      {
        fullName: text(form, "fullName"),
        email: text(form, "email"),
        degreeLevel: text(form, "degreeLevel") as DegreeLevelValue,
        programStartTerm: text(form, "programStartTerm"),
        comprehensiveExamDate: optionalText(form, "comprehensiveExamDate"),
        writing1Course: text(form, "writing1Course") as Writing1CourseValue,
        adviserUserId: text(form, "adviserUserId"),
      },
      neonCreateAuthUser,
    );
    return "Account made. The Thesis Instance and Milestone 1 are open. The Student gets the sign-in email.";
  });
  if (result.ok) revalidatePath("/coordinator/students");
  return result;
}
