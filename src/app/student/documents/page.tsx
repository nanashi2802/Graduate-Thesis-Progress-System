// `/student/documents` (S3): the deliverables of the current milestone and the scan upload (FR-DOC-01, FR-DOC-03, BR-18).
// The signed paper is the record (BR-01). A scan is a copy of it. It locks on upload (BR-19).
// R4.6: the rows use the `task-list` pattern (DESIGN.md §7.4): one stamp, the label, one reason, the actions. The data
// calls, the uploaders and the blocked reasons are the same as before. New: "Download form" on each TDW row (R4-b A, UX-032).
import { ActionButton } from "@/components/action-button";
import { EmptyState } from "@/components/patterns/empty-state";
import { TaskList, type TaskGroup, type TaskItem } from "@/components/patterns/task-list";
import { buttonVariants } from "@/components/ui/button";
import { blankFormHref } from "@/lib/forms";
import { cn } from "@/lib/utils";
import { getSessionState } from "@/server/auth/session";
import { getDb } from "@/server/data/db";
import { advisingCopies, deliverables, readableMilestones, type AdvisingForm } from "@/server/data/documents";
import { canUploadScan, type DocumentState } from "@/server/domain/documents";
import { ScanUploader } from "./scan-uploader";

// Why a locked scan takes no new file. The text follows the state (BR-18, BR-19).
function lockedReason(state: DocumentState | undefined): string {
  if (state === "verified") return "Verified against the paper. No action is needed.";
  return "The scan is locked. A new file needs a Return first.";
}

const ADVISING_NAME: Record<AdvisingForm, string> = {
  TDW_01: "Concept Paper Adviser Endorsement Form",
  TDW_04: "Adviser Appointment and Acknowledgement Form",
  TDW_02: "Advising Contract",
};

function DownloadForm({ code }: { code: string }) {
  const href = blankFormHref(code);
  if (!href) return null;
  return (
    // cn() merges the classes, so the outline border wins over the base `border-transparent`.
    <a href={href} download className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
      Download form<span className="sr-only">, {code.replace("_", " ")}, Word file</span>
    </a>
  );
}

export default async function Page() {
  const state = await getSessionState();
  if (state.status !== "ok") return null; // The portal layout already blocks this case.
  const ctx = { db: getDb(), actor: state.actor };
  const milestone = (await readableMilestones(ctx)).at(-1);
  const items = milestone ? await deliverables(ctx, milestone.id) : [];
  // FR-DOC-12, D-25: the advising-form copies live on Milestone 1 only.
  const proposal = (await readableMilestones(ctx)).find((m) => m.code === "proposal");
  const copies = proposal ? await advisingCopies(ctx, proposal.id) : [];

  const rows: TaskItem[] = milestone
    ? items.map((item) => {
        const record = item.records[0];
        const mine = item.uploaderRole === "student";
        const open = !record || canUploadScan(record.state);
        return {
          id: item.requiredItemId,
          stamp: { kind: "document", form: item.formCode, state: record?.state ?? "not_started" },
          label: item.label,
          // The template text as it is, with one label (UX-020).
          reason: item.paperSigners ? { text: `On paper: ${item.paperSigners}`, kind: "note" } : undefined,
          actions: (
            <>
              <DownloadForm code={item.formCode} />
              {mine && open ? (
                <ScanUploader milestoneId={milestone.id} requiredItemId={item.requiredItemId} label={item.label} />
              ) : (
                <ActionButton
                  type="button"
                  variant="outline"
                  size="sm"
                  blockedReason={mine ? lockedReason(record?.state) : `The ${item.uploaderRole === "adviser" ? "Adviser" : "Coordinator"} uploads this form.`}
                >
                  Upload {item.label}
                </ActionButton>
              )}
            </>
          ),
        };
      })
    : [];

  const groups: TaskGroup[] = [
    {
      label: "This milestone",
      items: rows,
      empty: <EmptyState title="No documents are due yet." body="The forms of your milestone appear here." />,
    },
  ];
  if (copies.length > 0) {
    groups.push({
      label: "Advising forms · optional",
      collapsed: true,
      hint: "Nobody reviews a copy, and a copy never blocks a step. You cannot replace a copy after the upload.",
      items: copies.map((c) => ({
        id: c.formCode,
        stamp: { kind: "document", form: c.formCode, state: c.state },
        label: ADVISING_NAME[c.formCode],
        actions:
          canUploadScan(c.state) || c.state === "not_started" ? (
            <ScanUploader advisingForm={c.formCode} label={`copy of ${c.formCode.replace("_", " ")}`} />
          ) : (
            <ActionButton type="button" variant="outline" size="sm" blockedReason="The copy is saved. A copy is write-once.">
              Upload copy
            </ActionButton>
          ),
      })),
    });
  }

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Documents</h1>
        <p className="max-w-[72ch] text-sm text-muted-foreground">
          Upload a scan of each signed form. The Coordinator checks the scan against the paper. A scan is locked after you upload it.
        </p>
      </header>
      <TaskList groups={groups} />
    </div>
  );
}
