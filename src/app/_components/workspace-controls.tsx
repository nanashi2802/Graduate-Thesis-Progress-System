"use client";
// The buttons and forms of the PR workspace. Each shows the refusal reason as text (BR-18).
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  endorseCommit,
  endorseGate1a,
  markReady,
  postThreadAction,
  replyAction,
  resolveAction,
  returnToStudent,
} from "@/app/_lib/pr-actions";
import type { Result } from "@/app/_lib/run";
import { ActionButton } from "@/components/action-button";
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

export function EndorseButton({ milestoneId, kind, blockedReason }: { milestoneId: string; kind: "gate1a" | "gate1b"; blockedReason?: string }) {
  const { pending, run, line } = useRun();
  return (
    <div className="flex flex-col gap-1">
      <ActionButton
        type="button"
        blockedReason={blockedReason}
        onClick={() => !pending && run(() => (kind === "gate1a" ? endorseGate1a(milestoneId) : endorseCommit(milestoneId)))}
      >
        {pending ? "Saving…" : kind === "gate1a" ? "Endorse (Gate 1a)" : "Endorse this commit (Gate 1b)"}
      </ActionButton>
      {line}
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
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (commitId && !blockedReason) run(() => postThreadAction(commitId, body), () => setBody(""));
      }}
    >
      <label className="flex flex-col gap-1 text-sm font-medium">
        New thread on this commit
        <textarea className="min-h-20 rounded-control border border-input bg-card p-2 text-sm font-normal" value={body} onChange={(e) => setBody(e.target.value)} aria-disabled={blockedReason ? true : undefined} readOnly={blockedReason ? true : false} />
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
