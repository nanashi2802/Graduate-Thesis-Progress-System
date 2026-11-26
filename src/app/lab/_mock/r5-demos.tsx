"use client";
// Mock demos of the R5 patterns (Task R5.1 to R5.8): the merge box, the gate box, the commit selector, the thread feed,
// the PDF viewer and the whole workspace for S2, A2 and P2. Mock data only, no server import (eslint rule for src/app/lab).
// The actions wait 600 ms and change nothing. The PDF is a fake 12-page file made in the browser (a blob link), so no
// storage call runs. `?pdf=error` gives a link that does not load, for the Round H error state (UX-009).
import dynamic from "next/dynamic";
import { useEffect, useId, useState, type ReactNode } from "react";
import { BlockedAction } from "@/components/patterns/blocked-action";
import { CommitSelector } from "@/components/patterns/commit-selector";
import { confirmCopy, GATE1B_LABEL } from "@/components/patterns/dialog";
import { EmptyState } from "@/components/patterns/empty-state";
import { FormFeedback, PendingButton, type FormFeedbackState } from "@/components/patterns/form-feedback";
import { control, FormField } from "@/components/patterns/form-field";
import { GateBox, type GateBoxProps } from "@/components/patterns/gate-box";
import { IdentityLine } from "@/components/patterns/identity-line";
import { MergeBox, type MergeBoxProps } from "@/components/patterns/merge-box";
import { MilestoneStatusPill } from "@/components/patterns/status";
import { ThreadFeed, type FeedThread, type ThreadFeedProps } from "@/components/patterns/thread-feed";
import { Workspace } from "@/components/patterns/workspace";
import { PdfLoadError, pdfNextStep } from "@/components/pdf-load-error";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MilestoneStatus } from "@/server/domain/milestone";
import { GATE1A_CHECKS, GATE1B_CHECKS, LOCKED_TEXT, commitsFor, threadsFor, type LabRole, type LabState } from "./r5-data";

const wait = (ms = 600) => new Promise((r) => setTimeout(r, ms));
const ok = async () => {
  await wait();
};

// ---- The fake PDF ----

/** A plain PDF 1.4 file with `pages` pages of fake text. Built by hand, so no package and no file in the repository. */
export function fakePdf(pages = 12): string {
  const objs: string[] = [];
  const add = (s: string) => objs.push(s); // the new length is the object number (1, 2, …)
  add("<< /Type /Catalog /Pages 2 0 R >>");
  const pagesIdx = add("PAGES");
  const font = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const kids: number[] = [];
  for (let p = 1; p <= pages; p++) {
    const lines = [
      `BT /F1 20 Tf 72 700 Td (Mock manuscript, page ${p} of ${pages}) Tj ET`,
      `BT /F1 11 Tf 72 670 Td (Fake text for the /lab preview. No student data.) Tj ET`,
      ...Array.from({ length: 22 }, (_, i) => `BT /F1 11 Tf 72 ${630 - i * 22} Td (Line ${i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod.) Tj ET`),
      `BT /F1 10 Tf 290 40 Td (${p}) Tj ET`,
    ].join("\n");
    const content = add(`<< /Length ${lines.length} >>\nstream\n${lines}\nendstream`);
    kids.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${content} 0 R >>`));
  }
  objs[pagesIdx - 1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(" ")}] /Count ${pages} >>`;
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((n) => `${String(n).padStart(10, "0")} 00000 n \n`).join("")}`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return out;
}

function useFakePdf(mode: "file" | "error") {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (mode === "error") return;
    // A blob link exists only in the browser, so it is made after the first paint.
    const link = URL.createObjectURL(new Blob([fakePdf()], { type: "application/pdf" }));
    setUrl(link); // eslint-disable-line react-hooks/set-state-in-effect -- an outside resource (a blob link), made once
    return () => URL.revokeObjectURL(link);
  }, [mode]);
  return mode === "error" ? "/lab/no-such-manuscript.pdf" : url;
}

const PdfViewer = dynamic(() => import("@/components/patterns/pdf-viewer"), {
  ssr: false,
  loading: () => <p className="text-sm text-muted-foreground">Loading the viewer…</p>,
});

export function LabPdf({ mode = "file", page, locked, nextFor }: { mode?: "file" | "error"; page?: number; locked?: string; /** UX-P-05 (approved): the role whose next step shows after a failed "Try again". */ nextFor?: "student" | "adviser" | "panel_member" }) {
  const url = useFakePdf(mode);
  const [attempt, setAttempt] = useState(0);
  if (!url) return <p className="text-sm text-muted-foreground">Opening the file…</p>;
  return (
    <PdfViewer
      key={`${url}-${attempt}`}
      url={url}
      page={page}
      locked={locked}
      nextStep={nextFor ? pdfNextStep(nextFor) : undefined}
      retried={attempt > 0}
      onRetry={() => setAttempt((n) => n + 1)}
    />
  );
}

/** The error box alone, before and after a failed "Try again" (UX-P-05, approved), so no 404 wait is needed. */
export function PdfErrorDemo({ role, retried }: { role?: "student" | "adviser" | "panel_member"; retried: boolean }) {
  return <PdfLoadError onRetry={() => {}} nextStep={role ? pdfNextStep(role) : undefined} retried={retried} />;
}

// ---- Single-pattern demos ----

export function GateBoxDemo(props: Omit<GateBoxProps, "onGate" | "onReturn"> & { withReturn?: boolean; gateError?: boolean }) {
  const { withReturn = true, gateError = false, ...rest } = props;
  return (
    <GateBox
      {...rest}
      onGate={async () => {
        await wait();
        if (gateError) return { error: "The change was not saved. The Student uploaded a new commit. Open the newest commit first." };
      }}
      onReturn={withReturn ? ok : undefined}
    />
  );
}

export function ThreadFeedDemo(props: Omit<ThreadFeedProps, "onReply" | "onResolve" | "onPost"> & { withPost?: boolean; replyError?: boolean }) {
  const { withPost = false, replyError = false, ...rest } = props;
  return (
    <ThreadFeed
      {...rest}
      onReply={async () => {
        await wait();
        if (replyError) return { error: "The reply was not saved. Check your connection and try again." };
      }}
      onResolve={ok}
      onPost={withPost ? ok : undefined}
    />
  );
}

// ---- The upload (S2, R5-b A adapted at UX-P-05: a plain region, never sticky) ----

/** A mock of the S2 upload: the file, the change note and the "Addressed" tags of the open threads (FR-REV-08). */
export function UploadDemo({ openThreads }: { openThreads: FeedThread[] }) {
  const id = useId();
  const [state, setState] = useState<FormFeedbackState>({ status: "idle" });
  const [pending, setPending] = useState(false);
  return (
    <form
      aria-label="Upload a new version"
      className="flex max-w-[640px] flex-col gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setState({ status: "pending" });
        await wait();
        setPending(false);
        setState({ status: "done", message: "Mock only. No file was uploaded." });
      }}
    >
      <FormField label="Manuscript PDF" id={`${id}-file`} reserve={false}>
        <input type="file" accept="application/pdf" className={cn(control.input, "py-1.5")} />
      </FormField>
      <FormField label="Change note (optional)" id={`${id}-note`} reserve={false}>
        <input type="text" className={control.input} placeholder="Example: Table 4 units added" />
      </FormField>
      {openThreads.length > 0 ? (
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-sm font-medium text-foreground">This version addresses (optional)</legend>
          {openThreads.map((t) => (
            <label key={t.id} className="flex min-h-11 items-center gap-2 text-sm text-foreground lg:min-h-8">
              <input type="checkbox" className="size-4 shrink-0 accent-primary" />
              <span className="shrink-0 font-mono text-[0.8rem] text-muted-foreground">v{t.commitOrdinal}</span>
              <span className="min-w-0 truncate">{t.body}</span>
            </label>
          ))}
        </fieldset>
      ) : null}
      <div>
        <PendingButton pending={pending} label="Upload version" pendingLabel="Uploading…" variant="outline" />
      </div>
      <FormFeedback state={state} id={id} lines={2} />
    </form>
  );
}

// ---- The whole workspace (R5.6, R5.8) ----

export type WorkspaceDemoProps = {
  role: LabRole;
  state: LabState;
  /** The lab page address with its query, so the commit and page links keep the role and the state. */
  base: string;
  commit?: number;
  page?: number;
  identity: "today" | "proposed";
  gatePass: boolean;
  pdf: "file" | "error";
};

const STATUS: Record<LabRole, Record<LabState, MilestoneStatus>> = {
  student: { "first-day": "DRAFT", working: "DRAFT", ready: "READY", locked: "COMMITTEE_ENDORSED" },
  adviser: { "first-day": "DRAFT", working: "DRAFT", ready: "READY", locked: "COMMITTEE_ENDORSED" },
  panel: { "first-day": "COMMITTEE_APPOINTED", working: "COMMITTEE_APPOINTED", ready: "COMMITTEE_APPOINTED", locked: "COMMITTEE_ENDORSED" },
};

function Header({ role, status, identity }: { role: LabRole; status: MilestoneStatus; identity: WorkspaceDemoProps["identity"] }) {
  return (
    <>
      {identity === "proposed" ? (
        // The identity line needs the thesis title and the Student name in `workspaceFor`: a data change for the gate.
        // The title is the working title from enrollment (FR-ACC-04, D-24), so it exists before the first upload.
        <IdentityLine
          title="Latency-aware task scheduling for campus edge networks"
          degreeLevel="masters"
          ownView={role === "student"}
          student="Juan Dela Cruz (mock)"
          adviser="Dr. Maria Santos (mock)"
        />
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-foreground">Proposal manuscript</h1>
        <MilestoneStatusPill status={status} milestone="proposal" />
      </div>
    </>
  );
}

function studentBox(state: LabState): MergeBoxProps {
  switch (state) {
    case "first-day":
      return {
        state: "first-day",
        sentence: "Upload your first version as a PDF. Then mark it Ready for your Adviser.",
        action: (
          <BlockedAction type="button" reason="Upload a commit first.">
            Mark Ready
          </BlockedAction>
        ),
      };
    case "working":
      return { state: "open", sentence: "Mark v4 Ready when you want your Adviser to read it.", action: <Button type="button">Mark Ready</Button> };
    case "ready":
      return { state: "ready", sentence: "Your Adviser reads v4 next. You can upload again after the Adviser decides.", action: null, lockedReason: "Wait for the Adviser to endorse or return this commit." };
    case "locked":
      return { state: "locked", sentence: "Your Evaluation Committee endorsed v4 for the defense.", action: null, lockedReason: "Locked until the defense is closed." };
  }
}

export function WorkspaceDemo(p: WorkspaceDemoProps) {
  const { role, state } = p;
  const status = STATUS[role][state];
  const firstDay = state === "first-day";
  const noCommits = firstDay && role !== "panel";
  const commits = noCommits ? [] : commitsFor(role);
  const newest = commits.at(-1);
  const selected = commits.find((c) => c.ordinal === p.commit) ?? newest;
  const readyId = state === "ready" || state === "locked" ? newest?.id : null;
  const locked = state === "locked";
  // Threads: none on the first day. The panel's first day has the Adviser's threads only.
  const all = threadsFor(role);
  const threads = noCommits ? [] : firstDay ? all.filter((t) => t.author === "Adviser") : role === "panel" && state === "ready" ? all.map((t) => (t.id === "t3" ? { ...t, state: "RESOLVED" as const } : t)) : role === "adviser" && state === "ready" && p.gatePass ? all.map((t) => (t.author === "Adviser" ? { ...t, state: "RESOLVED" as const } : t)) : all;
  const open = threads.filter((t) => t.state === "OPEN");
  const sep = p.base.includes("?") ? "&" : "?";

  let box: ReactNode;
  if (role === "student") {
    box = <MergeBox {...studentBox(state)} />;
  } else if (role === "adviser") {
    if (state === "ready") {
      box = <GateBoxDemo checks={GATE1A_CHECKS(p.gatePass)} gateLabel="Endorse (Gate 1a)" confirm={confirmCopy({ kind: "endorse1a" })} />;
    } else if (locked) {
      box = <GateBoxDemo checks={[]} gateLabel={GATE1B_LABEL} confirm={confirmCopy({ kind: "endorse1b" })} waiting="You endorsed v4. The manuscript is locked until the defense closes." withReturn={false} />;
    } else {
      box = <GateBoxDemo checks={[]} gateLabel="Endorse (Gate 1a)" confirm={confirmCopy({ kind: "endorse1a" })} waiting="Waiting for the Student to mark a version Ready." withReturn={false} />;
    }
  } else {
    const pass = state === "first-day" || state === "ready" || p.gatePass;
    box = locked ? (
      <GateBoxDemo checks={[]} gateLabel={GATE1B_LABEL} confirm={confirmCopy({ kind: "endorse1b" })} waiting="You endorsed v4. The manuscript is locked until the defense closes." withReturn={false} />
    ) : (
      <GateBoxDemo checks={GATE1B_CHECKS(pass)} gateLabel={GATE1B_LABEL} confirm={confirmCopy({ kind: "endorse1b", locks: state === "ready" })} withReturn={false} />
    );
  }

  const viewer = noCommits ? (
    <EmptyState title="No version yet." body={role === "student" ? "Upload your first version below. Your Adviser sees it after you mark it Ready." : "The Student has not uploaded a commit."} />
  ) : (
    <>
      {selected && selected.changeNote ? <p className="text-sm text-muted-foreground">Change note: {selected.changeNote}</p> : null}
      <LabPdf mode={p.pdf} page={p.page} locked={locked ? LOCKED_TEXT : undefined} nextFor={role === "panel" ? "panel_member" : role} />
    </>
  );

  const reviewer = role !== "student";
  const postBlockedReason = noCommits ? "Upload a commit first." : locked ? "The comment window is closed." : undefined;
  const feed = (
    <ThreadFeedDemo
      threads={threads}
      viewerRole={reviewer ? (role === "adviser" ? "adviser" : "panel_member") : "student"}
      withPost={reviewer}
      postOrdinal={selected?.ordinal}
      postBlockedReason={reviewer ? postBlockedReason : undefined}
      pageHref={(pg, ord) => `${p.base}${sep}commit=${ord}&page=${pg}`}
    />
  );

  // Ready and locked: no upload. The merge box already gives the reason, and a rule is said once (DESIGN.md §2.1).
  const canUpload = role === "student" && (state === "first-day" || state === "working");
  return (
    <Workspace
      header={<Header role={role} status={status} identity={p.identity} />}
      box={box}
      commits={commits.length > 0 ? <CommitSelector commits={commits} selectedId={selected?.id ?? null} readyId={readyId} hrefFor={(n) => `${p.base}${sep}commit=${n}`} /> : null}
      viewer={viewer}
      feed={feed}
      threadCount={open.length}
      upload={canUpload ? <UploadDemo openThreads={open} /> : undefined}
    />
  );
}
