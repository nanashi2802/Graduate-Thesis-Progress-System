// `/login` (SITEMAP §3, FR-ACC-01, D-23).
import { Suspense } from "react";
import { BrandMark } from "@/components/patterns/brand-mark";
import { ThemeToggle } from "@/components/patterns/theme-toggle";
import { LoginForm } from "./login-form";

const ERRORS: Record<string, string> = {
  no_account: "This sign-in has no account. Only the Coordinator makes accounts. Ask the Coordinator.",
  deactivated: "Your account is deactivated. Ask the Coordinator.",
};

async function ErrorBanner({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { error } = await searchParams;
  const message = typeof error === "string" ? ERRORS[error] : undefined;
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">
      {message}
    </p>
  );
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-6 px-4">
      {/* UX-D-01: the theme switch on LOGIN. UX-D-11 item 6: the full brand mark (text treatment until the artwork arrives). */}
      <div className="fixed top-4 right-4 sm:right-6">
        <ThemeToggle compact />
      </div>
      <BrandMark variant="full" descriptor />
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <Suspense fallback={null}>
        <ErrorBanner searchParams={searchParams} />
      </Suspense>
      <LoginForm />
    </main>
  );
}
