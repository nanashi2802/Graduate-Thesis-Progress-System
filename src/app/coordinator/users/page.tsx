// `/coordinator/users` (C9): users, roles and email addresses (FR-ACC-05, FR-ACC-06, BR-03).
import { listUsers } from "@/server/data/users";
import { sessionContext } from "../_lib/action";
import { PageHeader, Section } from "../_lib/page-header";
import { AddUserForm, EditUserForm, ROLE_LABEL } from "./user-forms";

export default async function Page() {
  const users = await listUsers(await sessionContext());
  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-12 px-4 py-8 sm:px-8">
      <PageHeader
        title="Users"
        detail="Each account has one role. A role cannot change after the account acts in it. Deactivate the account and make a new one instead."
      />
      <Section title="Add a user">
        <AddUserForm />
      </Section>
      <Section title={`All users (${users.length})`}>
        <ul className="flex flex-col">
          {users.map((u) => (
            <li key={u.id} className="flex flex-col gap-3 border-b border-border py-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{u.fullName}</span> · {ROLE_LABEL[u.role]}
                {u.isActive ? "" : " · Deactivated"}
              </p>
              <EditUserForm user={u} />
            </li>
          ))}
        </ul>
      </Section>
    </main>
  );
}
