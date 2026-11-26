"use client";
// The buttons and forms of the PR workspace. Each shows the refusal reason as text (BR-18).
// R5.9 (UX-011, UX-D-16, UX-P-05): every form is on the form-feedback contract: a PendingButton that keeps its width
// and a fixed-height FormFeedback slot. Each form keeps its server action, its `Result` shape and `router.refresh()`.
// Return is the ReturnComposer pattern (R5-c A). The S2, A2 and P2 markup moves onto the R5 patterns in R7 (R5-e A).
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";
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
import { BlockedAction } from "@/components/patterns/blocked-action";
import { ConfirmDialog, confirmCopy, GATE1B_LABEL } from "@/components/patterns/dialog";
import { FormFeedback, PendingButton, type FormFeedbackState } from "@/components/patterns/form-feedback";
import { control, FormField } from "@/components/patterns/form-field";
import { Glyph } from "@/components/patterns/glyphs";
import { ReturnComposer } from "@/components/patterns/return-composer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NOT_SAVED = "The change was not saved.";

/** One server action: the pending state, the message slot state, and a refresh after a saved action. */
function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [state, setState] = useState<FormFeedbackState>({ status: "idle" });
  function run(work: () => Promise<Result>, done?: () => void) {
    if (pending) return;
    start(async () => {
      setState({ status: "pending" });
      const res = await work();
      if (res.ok) {
        setState({ status: "idle" });
        done?.();
        router.refresh();
      } else {
        setState({ status: "error", message: res.error ?? NOT_SAVED });
      }
    });
  }
  return { pending, state, run };
}

export function ReadyButton({ milestoneId, commitId, moveToReady, blockedReason }: { milestoneId: string; commitId: string | null; moveToReady: boolean; blockedReason?: string }) {
  const id = useId();
  const { pending, state, run } = useAction();
  return (
    <form
      aria-label="Mark Ready"
      className="flex flex-col gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        if (commitId && blockedReason === undefined) run(() => markReady(milestoneId, commitId, moveToReady));
      }}
    >
      {blockedReason !== undefined ? (
        <BlockedAction type="submit" reason={blockedReason}>
          Mark Ready
        </BlockedAction>
      ) : (
        <PendingButton pending={pending} label="Mark Ready" pendingLabel="Saving…" />
      )}
      <FormFeedback state={state} id={id} lines={2} />
    </form>
  );
}

const ENDORSE = {
  gate1a: { label: "Endorse (Gate 1a)", copy: "endorse1a", act: endorseGate1a },
  // UX-P-05 (owner, option A): the opener and the confirm button say the same words for every endorser.
  gate1b: { label: GATE1B_LABEL, copy: "endorse1b", act: endorseCommit },
  // The opener keeps its label until the owner decides UX-X-05. The dialog says Endorse (Gate 2).
  gate2: { label: "Approve the final manuscript (Gate 2)", copy: "gate2", act: approveFinalAction },
} as const;

// R3.10 (R3-h A, UX-010, BR-19): a gate endorsement asks once more in a ConfirmDialog, then runs the same server
// action. An error stays in the dialog. On success the page refreshes, as before.
// R5.9 (UX-P-05): `student` names the Student in the dialog title (the R3.10 gap).
export function EndorseButton({
  milestoneId,
  kind,
  blockedReason,
  locks,
  student,
}: {
  milestoneId: string;
  kind: "gate1a" | "gate1b" | "gate2";
  blockedReason?: string;
  /** Gate 1b: this endorsement is the last one (BR-07). */
  locks?: boolean;
  /** The Student's name, from `workspaceFor().identity`. */
  student?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const e = ENDORSE[kind];
  return (
    <div className="flex flex-col gap-1">
      <ActionButton type="button" blockedReason={blockedReason} onClick={() => blockedReason === undefined && setOpen(true)}>
        {e.label}
      </ActionButton>
      <ConfirmDialog
        {...confirmCopy(e.copy === "endorse1b" ? { kind: e.copy, locks, student } : { kind: e.copy, student })}
        open={open}
        onOpenChange={setOpen}
        onConfirm={async () => {
          const res = await e.act(milestoneId);
          if (!res.ok) return { error: res.error ?? NOT_SAVED };
          router.refresh();
        }}
      />
    </div>
  );
}

// R5-c A: the inline ReturnComposer, the same as C4. Return is never disabled and never a solid red fill (F3).
export function ReturnForm({ milestoneId }: { milestoneId: string }) {
  const router = useRouter();
  const opener = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const close = () => {
    setOpen(false);
    opener.current?.focus();
  };
  return (
    <div className="flex flex-col gap-3">
      <Button ref={opener} type="button" variant="return" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="self-start">
        <Glyph name="return" size={16} />
        Return to the Student
      </Button>
      {open ? (
        <div className="flex w-full max-w-[480px] flex-col gap-3 border-t border-border pt-3">
          <p className="text-sm text-muted-foreground">The Student sees this reason.</p>
          <ReturnComposer
            placeholder="Example: Chapter 3 does not answer the research questions. Revise it before the next commit."
            onCancel={close}
            onSend={async (reason) => {
              const res = await returnToStudent(milestoneId, reason);
              if (!res.ok) return { error: res.error ?? NOT_SAVED };
              setOpen(false);
              router.refresh();
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

export function NewThreadForm({ commitId, blockedReason }: { commitId: string | null; blockedReason?: string }) {
  const id = useId();
  const { pending, state, run } = useAction();
  const [body, setBody] = useState("");
  const [page, setPage] = useState("");
  const blocked = blockedReason !== undefined;
  return (
    <form
      aria-label="New thread"
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!commitId || blocked || body.trim() === "") return;
        // FR-REV-04, D-26: the page is optional. The server checks the range.
        const pageNo = page.trim() === "" ? null : Number(page);
        run(
          () => postThreadAction(commitId, body.trim(), pageNo),
          () => {
            setBody("");
            setPage("");
          },
        );
      }}
    >
      <FormField label="New thread on this commit" id={`${id}-body`} reserve={false}>
        <textarea name="body" rows={3} value={body} onChange={(e) => setBody(e.target.value)} readOnly={blocked} aria-disabled={blocked || undefined} className={control.textarea} />
      </FormField>
      <FormField label="Page (optional)" id={`${id}-page`} hint="From 1 to 9999." className="w-48">
        <input
          type="number"
          min={1}
          max={9999}
          step={1}
          inputMode="numeric"
          name="page"
          value={page}
          onChange={(e) => setPage(e.target.value)}
          readOnly={blocked}
          aria-disabled={blocked || undefined}
          className={cn(control.input, "font-mono")}
        />
      </FormField>
      <div className="flex items-start">
        {blocked ? (
          <BlockedAction type="submit" variant="secondary" reason={blockedReason}>
            Post thread
          </BlockedAction>
        ) : (
          <PendingButton pending={pending} label="Post thread" pendingLabel="Posting…" variant="outline" size="sm" />
        )}
      </div>
      <FormFeedback state={state} id={id} lines={2} />
    </form>
  );
}

export function ReplyForm({ threadId }: { threadId: string }) {
  const id = useId();
  const { pending, state, run } = useAction();
  const [body, setBody] = useState("");
  return (
    <form
      aria-label="Reply"
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (body.trim() === "") return;
        run(() => replyAction(threadId, body.trim()), () => setBody(""));
      }}
    >
      <FormField label="Reply" id={`${id}-body`} reserve={false}>
        <textarea name="body" rows={2} value={body} onChange={(e) => setBody(e.target.value)} className={cn(control.textarea, "min-h-16")} />
      </FormField>
      <div className="flex items-start">
        <PendingButton pending={pending} label="Send reply" pendingLabel="Sending…" variant="outline" size="sm" />
      </div>
      <FormFeedback state={state} id={id} lines={2} />
    </form>
  );
}

export function ResolveButton({ threadId }: { threadId: string }) {
  const id = useId();
  const { pending, state, run } = useAction();
  return (
    <form
      aria-label="Resolve"
      className="flex flex-col gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => resolveAction(threadId));
      }}
    >
      <div className="flex items-start">
        <PendingButton pending={pending} label="Resolve" pendingLabel="Saving…" variant="outline" size="sm" />
      </div>
      <FormFeedback state={state} id={id} lines={2} />
    </form>
  );
}
