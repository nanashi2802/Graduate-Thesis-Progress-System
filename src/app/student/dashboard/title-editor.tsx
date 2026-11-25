"use client";
// S1: the "Edit title" control. It shows only before Gate 1b (FR-ACC-09, D-24).
// After Gate 1b the title is a record, so the page shows no control.
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateTitleAction } from "./actions";

export function TitleEditor({ title }: { title: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(title);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setOpen(true)}>
        Edit title
      </Button>
    );
  }
  return (
    <form
      className="flex max-w-[72ch] flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await updateTitleAction(value);
          if (res.error) setError(res.error);
          else {
            setError(null);
            setOpen(false);
            router.refresh();
          }
        });
      }}
    >
      <label className="flex flex-col gap-1 text-sm font-medium">
        Working thesis title
        <input
          className="rounded-control border border-input bg-card p-2 text-sm font-normal"
          value={value}
          maxLength={300}
          required
          onChange={(e) => setValue(e.target.value)}
        />
      </label>
      <p className="text-xs text-muted-foreground">You can edit the title until Gate 1b. Then it locks.</p>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save title"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => {
            setValue(title);
            setError(null);
            setOpen(false);
          }}
        >
          Cancel
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </form>
  );
}
