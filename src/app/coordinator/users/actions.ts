"use server";
// C9 actions (FR-ACC-05, FR-ACC-06, BR-03, AD-A-016). The data layer checks the role (NFR-01).
import { revalidatePath } from "next/cache";
import { neonCreateAuthUser, neonSendSetLink } from "@/server/auth/admin";
import { createAccount } from "@/server/data/accounts";
import { defaultMailPort } from "@/server/data/recipients";
import { InputProblem } from "@/server/data/coordinator";
import type { UserRole } from "@/server/data/schema";
import { setUserActive, updateUser } from "@/server/data/users";
import { runAction, text, type FormState } from "../_lib/action";

// Student accounts come only from C2, with their thesis (FR-ACC-04).
const STAFF_ROLES: UserRole[] = ["adviser", "panel_member", "coordinator"];

async function done(result: FormState): Promise<FormState> {
  if (result.ok) revalidatePath("/coordinator/users");
  return result;
}

export async function addUserAction(_prev: FormState, form: FormData): Promise<FormState> {
  return done(
    await runAction(async (ctx) => {
      const role = text(form, "role") as UserRole;
      if (!STAFF_ROLES.includes(role)) throw new InputProblem("Make Student accounts on the Accounts page.");
      if (!text(form, "fullName")) throw new InputProblem("Enter the name.");
      await createAccount(ctx, { fullName: text(form, "fullName"), email: text(form, "email"), role }, neonCreateAuthUser, undefined, {
        sendSetLink: neonSendSetLink,
        sendMail: defaultMailPort(),
      });
      return "Account made. The user gets the sign-in email.";
    }),
  );
}

export async function updateUserAction(_prev: FormState, form: FormData): Promise<FormState> {
  return done(
    await runAction(async (ctx) => {
      await updateUser(ctx, text(form, "userId"), {
        fullName: text(form, "fullName"),
        email: text(form, "email"),
        role: text(form, "role") as UserRole,
      });
      return "Saved.";
    }),
  );
}

export async function setActiveAction(_prev: FormState, form: FormData): Promise<FormState> {
  return done(
    await runAction(async (ctx) => {
      const active = text(form, "active") === "true";
      await setUserActive(ctx, text(form, "userId"), active);
      return active ? "Account reactivated." : "Account deactivated. The user can no longer sign in to the portal.";
    }),
  );
}
