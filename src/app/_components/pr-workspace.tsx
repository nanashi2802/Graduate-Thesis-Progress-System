// The PR workspace for S2 (Student), A2 (Adviser) and P2 (Panel Member): commits, the viewer, threads and gates
// (FR-REV-01 to 08, FR-WFL-03, FR-WFL-04, BR-05 to BR-07, BR-18). One shared screen. The role decides the actions.
import Link from "next/link";
import { AccessDenied } from "@/app/_components/access-denied";
import { CommitUploader } from "@/app/_components/commit-uploader";
import { PdfPane } from "@/app/_components/pdf-pane";
import { EndorseButton, NewThreadForm, ReadyButton, ReplyForm, ResolveButton, ReturnForm } from "@/app/_components/workspace-controls";
import { EmptyState } from "@/components/empty-state";
import { LockedBanner } from "@/components/banners";
import { MilestoneStatusPill } from "@/components/status";
import { getSessionState } from "@/server/auth/session";
import { AccessDeniedError, type DataContext } from "@/server/data/access";
import { InputProblem } from "@/server/data/coordinator";
import { getDb } from "@/server/data/db";
import { threadPostBlock, workspaceFor } from "@/server/data/manuscript";
import { checkTransition, gate1bBlock } from "@/server/data/milestones";

const MILESTONE_NAME = { proposal: "Proposal", pre_final: "Pre-Final", final: "Final" } as const;
const CONTEXT_LABEL = { iteration: "Adviser review", committee_review: "Committee review", defense_day: "Defense Day" } as const;

const when = (d: Date) => d.toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" });

export async function PrWorkspace({ prId, commit }: { prId: string; commit?: string }) {
  const state = await getSessionState();
  if (state.status !== "ok") return null; // The portal layout already blocks this case.
  const ctx: DataContext = { db: getDb(), actor: state.actor };
  const role = ctx.actor.role;

  let ws: Awaited<ReturnType<typeof workspaceFor>>;
  try {
    ws = await workspaceFor(ctx, prId);
  } catch (e) {
    if (e instanceof AccessDeniedError) return <AccessDenied reason="You cannot open this manuscript. Panel Members need the verified appointment form and their own verified NDA." />;
    if (e instanceof InputProblem) return <main className="mx-auto max-w-[960px] px-4 py-8"><EmptyState title="This manuscript was not found." detail="Go back to your dashboard and open it from there." /></main>;
    throw e;
  }
  const { milestone, commits, pr, locked, threads } = ws;
  const newest = commits.at(-1) ?? null;
  const selected = commits.find((c) => String(c.ordinal) === commit) ?? newest;
  const status = milestone.status;
  const gate1bOpen = milestone.milestoneCode === "pre_final" ? status === "ADVISER_ENDORSED" : status === "COMMITTEE_APPOINTED";

  // Reasons for blocked actions (BR-18).
  let readyBlock: string | undefined;
  if (role === "student") {
    if (!newest) readyBlock = "Upload a commit first.";
    else if (locked) readyBlock = "The manuscript is locked.";
    else if (!["DRAFT", "ADVISER_ENDORSED", "COMMITTEE_APPOINTED"].includes(status)) readyBlock = "You cannot mark a commit Ready now.";
  }
  let gate1aBlock: string | undefined;
  if (role === "adviser" && status === "READY") {
    const d = await checkTransition(ctx, milestone.id, "ADVISER_ENDORSED");
    if (!d.ok) gate1aBlock = d.reason;
  }
  let gate1bReason: string | undefined;
  if ((role === "adviser" || role === "panel_member") && gate1bOpen) gate1bReason = (await gate1bBlock(ctx, milestone.id)) ?? undefined;
  const postBlock = role === "adviser" || role === "panel_member" ? ((await threadPostBlock(ctx, milestone.id)) ?? undefined) : undefined;
  const canUpload = role === "student" && !locked && status !== "READY";
  const openOwn = threads.filter((t) => t.thread.state === "OPEN").map((t) => ({ id: t.thread.id, label: `v${t.commitOrdinal}: ${t.thread.body.slice(0, 80)}` }));

  return (
    <main className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-8 sm:px-8">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{MILESTONE_NAME[milestone.milestoneCode]} manuscript</h1>
          <MilestoneStatusPill status={status} milestone={milestone.milestoneCode} />
        </div>
        {status === "DRAFT" && milestone.returnReason ? (
          <p role="note" className="rounded-control border border-border p-3 text-sm">
            <span className="font-medium">Returned. </span>
            {milestone.returnReason}
          </p>
        ) : null}
        {locked ? <LockedBanner>The manuscript is locked since Gate 1b. It unlocks when the defense closes.</LockedBanner> : null}
        {role === "student" && status === "READY" ? (
          <p className="text-sm text-muted-foreground">The Adviser reads your Ready commit. You can upload again after the Adviser decides.</p>
        ) : null}
      </header>

      <div className="flex flex-wrap items-start gap-3">
        {role === "student" ? <ReadyButton milestoneId={milestone.id} commitId={newest?.id ?? null} moveToReady={status === "DRAFT"} blockedReason={readyBlock} /> : null}
        {role === "adviser" && status === "READY" ? (
          <>
            <EndorseButton milestoneId={milestone.id} kind="gate1a" blockedReason={gate1aBlock} />
            <ReturnForm milestoneId={milestone.id} />
          </>
        ) : null}
        {(role === "adviser" || role === "panel_member") && gate1bOpen ? <EndorseButton milestoneId={milestone.id} kind="gate1b" blockedReason={gate1bReason} /> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section aria-label="Manuscript" className="flex min-w-0 flex-col gap-4">
          {commits.length === 0 ? (
            <EmptyState title="No commit yet." detail={role === "student" ? "Upload your manuscript as a PDF. Each upload is a new version." : "The Student has not uploaded a commit."} />
          ) : (
            <>
              <nav aria-label="Commits" className="flex flex-wrap gap-2">
                {commits.map((c) => (
                  <Link
                    key={c.id}
                    href={`?commit=${c.ordinal}`}
                    aria-current={selected?.id === c.id ? "true" : undefined}
                    className="rounded-control border border-border px-2.5 py-1 text-sm aria-[current=true]:border-primary aria-[current=true]:font-semibold"
                  >
                    v{c.ordinal}
                    {pr.readyCommitId === c.id ? " · Ready" : ""}
                  </Link>
                ))}
              </nav>
              {selected ? (
                <p className="text-xs text-muted-foreground">
                  v{selected.ordinal}, uploaded {when(selected.uploadedAt)}. {selected.changeNote ? `Change note: ${selected.changeNote}` : ""}
                </p>
              ) : null}
              {selected ? <PdfPane key={selected.id} commitId={selected.id} /> : null}
            </>
          )}
          {canUpload ? <CommitUploader milestoneId={milestone.id} openThreads={openOwn} /> : null}
        </section>

        <section aria-label="Threads" className="flex min-w-0 flex-col gap-4">
          <h2 className="text-lg font-semibold">Threads</h2>
          {role === "adviser" || role === "panel_member" ? <NewThreadForm commitId={selected?.id ?? null} blockedReason={postBlock ?? (selected ? undefined : "Upload a commit first.")} /> : null}
          {threads.length === 0 ? (
            <EmptyState title="No threads yet." detail="Threads on a commit appear here. The author of a thread resolves it." />
          ) : (
            <ul className="flex flex-col gap-3">
              {threads.map(({ thread, commitOrdinal, outdated, replies, addressedByOrdinals }) => (
                <li key={thread.id} className="flex flex-col gap-2 rounded-control border border-border p-3">
                  <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>v{commitOrdinal}</span>
                    <span>{CONTEXT_LABEL[thread.context]}</span>
                    <span>{thread.authorRole === "adviser" ? "Adviser" : "Panel Member"}</span>
                    <span className="font-medium text-foreground">{thread.state === "OPEN" ? "Open" : "Resolved"}</span>
                    {outdated ? <span className="rounded-full border border-border px-2">Outdated</span> : null}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{thread.body}</p>
                  {addressedByOrdinals.length > 0 ? (
                    <p className="text-xs text-muted-foreground">The Student says v{addressedByOrdinals.join(", v")} addresses this thread.</p>
                  ) : null}
                  {replies.length > 0 ? (
                    <ul className="flex flex-col gap-1 border-l border-border pl-3">
                      {replies.map((r) => (
                        <li key={r.id} className="text-sm whitespace-pre-wrap">
                          {r.body}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {thread.state === "OPEN" && role !== "coordinator" ? <ReplyForm threadId={thread.id} /> : null}
                  {thread.state === "OPEN" && thread.authorUserId === ctx.actor.userId ? <ResolveButton threadId={thread.id} /> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
