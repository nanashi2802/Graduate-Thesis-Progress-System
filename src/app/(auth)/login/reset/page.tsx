// `/login/reset`: the page a reset link opens (FR-ACC-08). The token comes from Neon Auth.
import { Suspense } from "react";
import { ResetForm } from "./reset-form";

async function Form({ searchParams }: { searchParams: PageProps<"/login/reset">["searchParams"] }) {
  const { token } = await searchParams;
  return <ResetForm token={typeof token === "string" ? token : ""} />;
}

export default function ResetPage({ searchParams }: PageProps<"/login/reset">) {
  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold">Set a password</h1>
      <Suspense fallback={null}>
        <Form searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
