"use client";
// A form that calls a server action and shows its refusal reason as text (BR-18).
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type ReactNode } from "react";
import type { Result } from "@/app/_lib/run";
import { ActionButton } from "@/components/action-button";
import { useToast } from "@/components/patterns/toast";
import { Button } from "@/components/ui/button";

export function ActionForm({
  action,
  submitLabel,
  blockedReason,
  variant = "default",
  className,
  resetOnSuccess = true,
  successToast,
  children,
}: {
  action: (form: FormData) => Promise<Result>;
  submitLabel: string;
  blockedReason?: string;
  variant?: "default" | "outline" | "return";
  className?: string;
  resetOnSuccess?: boolean;
  /** A small confirmation only (UX-D-04), for example "Slot requested." A workflow result stays on the screen. */
  successToast?: string;
  children?: ReactNode;
}) {
  const router = useRouter();
  const toast = useToast();
  const ref = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  return (
    <form
      ref={ref}
      className={className ?? "flex flex-col gap-2"}
      onSubmit={(e) => {
        e.preventDefault();
        if (blockedReason || pending) return;
        const data = new FormData(e.currentTarget);
        setMessage(null);
        start(async () => {
          const res = await action(data);
          if (res.ok) {
            if (resetOnSuccess) ref.current?.reset();
            if (successToast) toast.show({ label: successToast, tone: "done" });
            router.refresh();
          } else {
            setMessage({ text: res.error ?? "The change was not saved.", error: true });
          }
        });
      }}
    >
      {children}
      {blockedReason !== undefined ? (
        <ActionButton type="submit" size="sm" variant={variant} blockedReason={blockedReason} className="self-start">
          {submitLabel}
        </ActionButton>
      ) : (
        <Button type="submit" size="sm" variant={variant} disabled={pending} className="self-start">
          {pending ? "Saving…" : submitLabel}
        </Button>
      )}
      {message ? (
        <p role="alert" className="text-xs text-destructive">
          {message.text}
        </p>
      ) : null}
    </form>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}

export const inputClass = "h-9 rounded-control border border-input bg-card px-2 text-sm font-normal";
export const areaClass = "min-h-16 rounded-control border border-input bg-card p-2 text-sm font-normal";
