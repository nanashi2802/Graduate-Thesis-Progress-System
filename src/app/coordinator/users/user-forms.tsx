"use client";
import { ActionForm, Field, fieldClass } from "../_lib/form-parts";
import { addUserAction, setActiveAction, updateUserAction } from "./actions";

export const ROLE_LABEL = {
  student: "Student",
  adviser: "Adviser",
  panel_member: "Panel Member",
  coordinator: "Coordinator",
} as const;
type Role = keyof typeof ROLE_LABEL;

export function AddUserForm() {
  return (
    <ActionForm action={addUserAction} submit="Add the user">
      <Field label="Full name" htmlFor="new-fullName">
        <input id="new-fullName" name="fullName" required className={fieldClass} />
      </Field>
      <Field label="Email address" htmlFor="new-email" hint="The system sends emails only to this address (FR-NTF-08).">
        <input id="new-email" name="email" type="email" required className={fieldClass} />
      </Field>
      <Field label="Role" htmlFor="new-role" hint="One role for each account (BR-03). Make Student accounts on the Accounts page.">
        <select id="new-role" name="role" className={fieldClass} defaultValue="adviser">
          <option value="adviser">Adviser</option>
          <option value="panel_member">Panel Member</option>
          <option value="coordinator">Coordinator</option>
        </select>
      </Field>
    </ActionForm>
  );
}

export function EditUserForm({
  user,
}: {
  user: { id: string; fullName: string; email: string; role: Role; isActive: boolean };
}) {
  const id = (k: string) => `${k}-${user.id}`;
  return (
    <div className="flex flex-col gap-4">
      <ActionForm action={updateUserAction} submit="Save" variant="outline" className="grid gap-4 sm:grid-cols-[1fr_1fr_12rem_auto] sm:items-end">
        <input type="hidden" name="userId" value={user.id} />
        <Field label="Name" htmlFor={id("name")}>
          <input id={id("name")} name="fullName" defaultValue={user.fullName} required className={fieldClass} />
        </Field>
        <Field label="Email address" htmlFor={id("email")}>
          <input id={id("email")} name="email" type="email" defaultValue={user.email} required className={fieldClass} />
        </Field>
        <Field label="Role" htmlFor={id("role")}>
          <select id={id("role")} name="role" defaultValue={user.role} className={fieldClass}>
            {(user.role === "student" ? (["student"] as Role[]) : (["adviser", "panel_member", "coordinator"] as Role[])).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </Field>
      </ActionForm>
      <ActionForm action={setActiveAction} submit={user.isActive ? "Deactivate" : "Reactivate"} variant="link" className="flex">
        <input type="hidden" name="userId" value={user.id} />
        <input type="hidden" name="active" value={user.isActive ? "false" : "true"} />
      </ActionForm>
    </div>
  );
}
