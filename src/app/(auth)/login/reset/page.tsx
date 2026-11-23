// `/login/reset`: the page a reset link opens (FR-ACC-08). The token comes from Neon Auth.
import { ResetForm } from "./reset-form";

export default async function ResetPage({ searchParams }: PageProps<"/login/reset">) {
  const { token } = await searchParams;
  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold">Set a password</h1>
      <ResetForm token={typeof token === "string" ? token : ""} />
    </main>
  );
}
