"use client";
// One own slot with its status and a Remove button for an open slot (FR-SCH-01).
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { withdrawSlotAction } from "@/app/_lib/schedule-actions";
import { Button } from "@/components/ui/button";

export function WithdrawButton({ slotId }: { slotId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await withdrawSlotAction(slotId);
            if (res.ok) router.refresh();
            else setError(res.error ?? "The slot was not removed.");
          })
        }
      >
        Remove
      </Button>
      {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
