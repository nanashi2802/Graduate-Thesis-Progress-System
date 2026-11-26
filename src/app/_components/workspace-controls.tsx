"use client";
// The buttons and forms of the PR workspace. Each shows the refusal reason as text (BR-18).
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  endorseCommit,
  approveFinalAction,
  endorseGate1a,
  markReady,
  postThreadAction,
  replyAction,
  resolveAction,
  returnToStudent,
} from "@/app/_lib/pr-actions";
import type { Result } from "@/app/_lib/run";
import { ActionButton } from "@/components/action-button";
import { ConfirmDialog, confirmCopy } from "@/components/patterns/dialog";
import { Button } from "@/components/ui/button";

function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  function run(work: () => Promise<Result>, done?: () => void) {
    setMessage(null);
    start(async () => {
      const res = await work();
      if (res.ok) {
        done?.();
        router.refresh();
      } else {
        setMessage({ text: res.error ?? "The change was not saved.", error: true });
      }
    });
  }
  const line = message ? (
    <p role={message.error ? "alert" : "status"} className={message.error ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
      {message.text}
    </p>
  ) : null;
  return { pending, run, line };
}

export function ReadyButton({ milestoneId, commitId, moveToReady, blockedReason }: { milestoneId: string; commitId: string | null; moveToReady: boolean; blockedReason?: string }) {
  const { pending, run, line } = useRun();
  return (
    <div className="flex flex-col gap-1">
      <ActionButton type="button" blockedReason={blockedReason} onClick={() => commitId && !pending && run(() => markReady(milestoneId, commitId, moveToReady))}>
        {pending ? "Saving…" : "Mark Ready"}
      </ActionButton>
      {line}
    </div>
  );
}

const ENDORSE = {
  gate1a: { label: "Endorse (Gate 1a)", copy: "endorse1a", act: endorseGate1a },
  gate1b: { label: "Endorse this commit (Gate 1b)", copy: "endorse1b", act: endorseCommit },
  // The opener keeps its label until the owner decides UX-X-05. The dialog says Endorse (Gate 2).
  gate2: { label: "Approve the final manuscript (Gate 2)", copy: "gate2", act: approveFinalAction },
} as const;

// R3.10 (R3-h A, UX-010, BR-19): a gate endorsement asks once more in a ConfirmDialog, then runs the same server
// action. An error stays in the dialog. On success the page refreshes, as before.
export function EndorseButton({ milestoneId, kind, blockedReason, locks }: { milestoneId: string; kind: "gate1a" | "gate1b" | "gate2"; blockedReason?: string; /** Gate 1b: this endorsement is the last one (BR-07). */ locks?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const e = ENDORSE[kind];
  return (
    <div className="flex flex-col gap-1">
      <ActionButton type="button" blockedReason={blockedReason} onClick={() => blockedReason === undefined && setOpen(true)}>
        {e.label}
      </ActionButton>
      <ConfirmDialog
        {...confirmCopy(e.copy === "endorse1b" ? { kind: e.copy, locks } : { kind: e.copy })}
        open={open}
        onOpenChange={setOpen}
        onConfirm={async () => {
          const res = await e.act(milestoneId);
          if (!res.ok) return { error: res.error ?? "The change was not saved." };
          router.refresh();
        }}
      />
    </div>
  );
}

export function ReturnForm({ milestoneId }: { milestoneId: string }) {
  const { pending, run, line } = useRun();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  if (!open) {
    return (
      <Button type="button" variant="return" onClick={() => setOpen(true)}>
        Return to the Student
      </Button>
    );
  }
  return (
    <form
      className="flex flex-col gap-2 rounded-control border border-border p-3"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => returnToStudent(milestoneId, reason), () => setOpen(false));
      }}
    >
      <label className="flex flex-col gap-1 text-sm font-medium">
        Reason for the Return (the Student sees it)
        <textarea required className="min-h-20 rounded-control border border-input bg-card p-2 text-sm font-normal" value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>
      <div className="flex gap-2">
        <Button type="submit" variant="return" disabled={pending}>
          {pending ? "Returning…" : "Return"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
      {line}
    </form>
  );
}

export function NewThreadForm({ commitId, blockedReason }: { commitId: string | null; blockedReason?: string }) {
  const { pending, run, line } = useRun();
  const [body, setBody] = useState("");
  const [page, setPage] = useState("");
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        // FR-REV-04, D-26: the page is optional. The server checks the range.
        const pageNo = page.trim() === "" ? null : Number(page);
        if (commitId && !blockedReason)
          run(
            () => postThreadAction(commitId, body, pageNo),
            () => {
              setBody("");
              setPage("");
            },
          );
      }}
    >
      <label className="flex flex-col gap-1 text-sm font-medium">
        New thread on this commit
        <textarea className="min-h-20 rounded-control border border-input bg-card p-2 text-sm font-normal" value={body} onChange={(e) => setBody(e.target.value)} aria-disabled={blockedReason ? true : undefined} readOnly={blockedReason ? true : false} />
      </label>
      <label className="flex items-center gap-2 text-sm font-medium">
        Page <span className="font-normal text-muted-foreground">(optional)</span>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={9999}
          step={1}
          className="w-24 rounded-control border border-input bg-card p-1.5 font-mono text-sm font-normal"
          value={page}
          onChange={(e) => setPage(e.target.value)}
          aria-disabled={blockedReason ? true : undefined}
          readOnly={blockedReason ? true : false}
        />
      </label>
      <ActionButton type="submit" size="sm" blockedReason={blockedReason} className="self-start">
        {pending ? "Posting…" : "Post thread"}
      </ActionButton>
      {line}
    </form>
  );
}

export function ReplyForm({ threadId }: { threadId: string }) {
  const { pending, run, line } = useRun();
  const [body, setBody] = useState("");
  return (
    <form
      className="flex flex-col gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => replyAction(threadId, body), () => setBody(""));
      }}
    >
      <label className="flex flex-col gap-1 text-xs font-medium">
        Reply
        <textarea className="min-h-12 rounded-control border border-input bg-card p-2 text-sm font-normal" value={body} onChange={(e) => setBody(e.target.value)} />
      </label>
      <Button type="submit" variant="outline" size="sm" className="self-start" disabled={pending}>
        {pending ? "Sending…" : "Send reply"}
      </Button>
      {line}
    </form>
  );
}

export function ResolveButton({ threadId }: { threadId: string }) {
  const { pending, run, line } = useRun();
  return (
    <div className="flex flex-col gap-1">
      <Button type="button" variant="outline" size="sm" className="self-start" disabled={pending} onClick={() => run(() => resolveAction(threadId))}>
        {pending ? "Saving…" : "Resolve"}
      </Button>
      {line}
    </div>
  );
}
