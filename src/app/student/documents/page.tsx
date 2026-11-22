// `/student/documents` (S3): the deliverables of the current milestone and the scan upload (FR-DOC-01, FR-DOC-03, BR-18).
// The signed paper is the record (BR-01). A scan is a copy of it. It locks on upload (BR-19).
import { ActionButton } from "@/components/action-button";
import { EmptyState } from "@/components/empty-state";
import { DocumentStamp } from "@/components/status";
import { getSessionState } from "@/server/auth/session";
import { getDb } from "@/server/data/db";
import { deliverables, readableMilestones } from "@/server/data/documents";
import { canUploadScan } from "@/server/domain/documents";
import { ScanUploader } from "./scan-uploader";

const SIGNERS = (s: string | null) => (s ? `Signed by ${s}.` : "");

export default async function Page() {
  const state = await getSessionState();
  if (state.status !== "ok") return null; // The portal layout already blocks this case.
  const ctx = { db: getDb(), actor: state.actor };
  const milestone = (await readableMilestones(ctx)).at(-1);
  const items = milestone ? await deliverables(ctx, milestone.id) : [];

  return (
    <main className="mx-auto flex max-w-[960px] flex-col gap-8 px-4 py-8 sm:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Documents</h1>
        <p className="max-w-[72ch] text-sm text-muted-foreground">
          Upload a scan of each signed form. The Coordinator checks the scan against the paper. A scan is locked after you upload it.
        </p>
      </header>
      {!milestone || items.length === 0 ? (
        <EmptyState title="No documents are due yet." detail="The forms of your milestone appear here." />
      ) : (
        <ul className="flex flex-col divide-y divide-border border-y border-border">
          {items.map((item) => {
            const record = item.records[0];
            const mine = item.uploaderRole === "student";
            const open = !record || canUploadScan(record.state);
            return (
              <li key={item.requiredItemId} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{SIGNERS(item.paperSigners)}</p>
                  <DocumentStamp form={item.formCode.replace("_", " ")} state={record?.state ?? "not_started"} />
                </div>
                {mine && open ? (
                  <ScanUploader milestoneId={milestone.id} requiredItemId={item.requiredItemId} label={item.label} />
                ) : (
                  <ActionButton type="button" variant="outline" size="sm" blockedReason={mine ? "The scan is locked. A new file needs a Return or a Mismatch first." : `The ${item.uploaderRole === "adviser" ? "Adviser" : "Coordinator"} uploads this form.`}>
                    Upload {item.label}
                  </ActionButton>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
