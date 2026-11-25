"use client";
// Small form parts for the Coordinator screens (DESIGN.md §5.3 Form pattern: labels above fields).
import { useActionState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export type FormState = { ok?: string; error?: string };
type Action = (prev: FormState, form: FormData) => Promise<FormState>;

export const fieldClass =
  "h-9 w-full rounded-control border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring";

export function Field({ label, htmlFor, children, hint }: { label: string; htmlFor: string; children: ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

// A form that shows the result of its server action in a live region.
export function ActionForm({
  action,
  submit,
  children,
  className,
  variant = "default",
}: {
  action: Action;
  submit: string;
  children?: ReactNode;
  className?: string;
  variant?: "default" | "outline" | "link";
}) {
  const [state, run, pending] = useActionState(action, {});
  return (
    <form action={run} className={className ?? "flex max-w-[640px] flex-col gap-4"}>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant={variant} disabled={pending}>
          {pending ? "Saving…" : submit}
        </Button>
        <p role="status" aria-live="polite" className={state.error ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
          {state.error ?? state.ok ?? ""}
        </p>
      </div>
    </form>
  );
}
