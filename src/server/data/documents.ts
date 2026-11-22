// Deliverables, scan upload and Coordinator review (S3, C4): FR-DOC-01, FR-DOC-03,
// FR-DOC-06, FR-DOC-07, FR-DOC-11, BR-12, BR-13, BR-19, NFR-01, NFR-02, NFR-03, AD-B-019.
// Server only. Each change calls `decideDocumentChange`, then writes the new state, one
// `document_event` history row for each step and one audit record, in one transaction.
// The browser sends the bytes straight to storage (NFR-12). The server never gets them.
import "server-only";
import { and, asc, eq, isNull, max, ne } from "drizzle-orm";
import { canUploadScan, decideDocumentChange, type DocumentActor, type DocumentState } from "@/server/domain/documents";
import { uploadProblem, type UploadRequest } from "@/server/files/rules";
import type { UploadLink } from "@/server/files/storage";
import { AccessDeniedError, requireActive, type DataContext } from "./access";
import { recordAudit } from "./audit";
import {
  committee,
  committeeMember,
  documentEvent,
  documentFile,
  documentRecord,
  milestoneInstance,
  templateRequiredItem,
  type UserRole,
} from "./schema";
import { requireThesisRead } from "./scope";

/** The two storage calls this module needs. The app passes `src/server/files/storage.ts`; tests pass a fake. */
export type FilePort = {
  createUploadLink(req: UploadRequest): Promise<UploadLink>;
  checkStoredFile(key: string, sha256: string, size: number): Promise<boolean>;
};

export type DocBlockCode =
  | "not_found"
  | "wrong_actor"
  | "not_allowed"
  | "reason_required"
  | "locked"
  | "bad_file"
  | "bad_key"
  | "hash_mismatch"
  | "subject_required"
  | "subject_not_seat";

export type DocResult<T> = { ok: true; value: T } | { ok: false; code: DocBlockCode; reason: string };

const MESSAGES: Record<DocBlockCode, string> = {
  not_found: "The record does not exist.",
  wrong_actor: "Your role cannot make this change.",
  not_allowed: "This document change is not allowed.",
  reason_required: "Write a reason.",
  locked: "The scan is locked. A new file needs a Return or a Mismatch first.",
  bad_file: "The file is not allowed.",
  bad_key: "The upload is not valid. Start the upload again.",
  hash_mismatch: "The stored file does not match the hash from your browser. No record is made.",
  subject_required: "Choose the member for this NDA.",
  subject_not_seat: "This person has no seat on the committee of this thesis.",
};

const refuse = <T>(code: DocBlockCode, reason?: string): DocResult<T> => ({ ok: false, code, reason: reason ?? MESSAGES[code] });

// A scan key from `newFileKey(prefix, "scan", ...)`.
const SCAN_KEY = /(^|\/)scan\/[^/]+\.(pdf|jpg|png)$/;

async function loadMilestone(ctx: DataContext, milestoneId: string) {
  const [m] = await ctx.db.select().from(milestoneInstance).where(eq(milestoneInstance.id, milestoneId));
  if (!m) throw new AccessDeniedError("no access to this milestone");
  await requireThesisRead(ctx, m.thesisInstanceId);
  return m;
}

async function loadDocument(ctx: DataContext, documentId: string) {
  const [row] = await ctx.db
    .select({ doc: documentRecord, uploaderRole: templateRequiredItem.uploaderRole })
    .from(documentRecord)
    .leftJoin(templateRequiredItem, eq(templateRequiredItem.id, documentRecord.templateRequiredItemId))
    .where(eq(documentRecord.id, documentId));
  if (!row) throw new AccessDeniedError("no access to this document");
  await loadMilestone(ctx, row.doc.milestoneInstanceId);
  return row;
}

// TDW 05, 06 and 11 come from the Coordinator (FR-CMT-04). Other items name their uploader.
function uploaderRoleOf(formCode: string, itemRole: UserRole | null): UserRole {
  if (itemRole) return itemRole;
  return ["TDW_05", "TDW_06", "TDW_11"].includes(formCode) ? "coordinator" : "student";
}

type Tx = Parameters<Parameters<DataContext["db"]["transaction"]>[0]>[0];

async function step(tx: Tx, ctx: DataContext, documentId: string, from: DocumentState, to: DocumentState, reason: string | null) {
  await tx.insert(documentEvent).values({ documentRecordId: documentId, fromState: from, toState: to, reason, actorUserId: ctx.actor.userId });
}

export type Deliverable = {
  requiredItemId: string;
  formCode: string;
  label: string;
  paperSigners: string | null;
  uploaderRole: UserRole;
  neededForDateConfirmation: boolean;
  records: { id: string; subjectUserId: string | null; state: DocumentState }[];
};

/** FR-DOC-01: the template items of the milestone, with the signers and the state of each record. */
export async function deliverables(ctx: DataContext, milestoneId: string): Promise<Deliverable[]> {
  const m = await loadMilestone(ctx, milestoneId);
  const items = await ctx.db
    .select()
    .from(templateRequiredItem)
    .where(eq(templateRequiredItem.templateVersionId, m.templateVersionId));
  const docs = await ctx.db.select().from(documentRecord).where(eq(documentRecord.milestoneInstanceId, milestoneId));
  return items.map((i) => ({
    requiredItemId: i.id,
    formCode: i.formCode,
    label: i.label,
    paperSigners: i.paperSigners,
    uploaderRole: i.uploaderRole,
    neededForDateConfirmation: i.neededForDateConfirmation,
    records: docs
      .filter((d) => d.templateRequiredItemId === i.id)
      .map((d) => ({ id: d.id, subjectUserId: d.subjectUserId, state: d.state })),
  }));
}

/**
 * FR-DOC-03: check the uploader and the file, find or make the record (state Prepared),
 * and sign a write-once upload link (INV-09). Nothing locks until `confirmScanUpload`.
 */
export async function requestScanUpload(
  ctx: DataContext,
  input: { milestoneId: string; requiredItemId: string; subjectUserId: string | null; sha256: string; size: number; contentType: string },
  files: FilePort,
): Promise<DocResult<{ documentId: string; link: UploadLink }>> {
  requireActive(ctx.actor);
  const m = await loadMilestone(ctx, input.milestoneId);
  const [item] = await ctx.db
    .select()
    .from(templateRequiredItem)
    .where(and(eq(templateRequiredItem.id, input.requiredItemId), eq(templateRequiredItem.templateVersionId, m.templateVersionId)));
  if (!item) return refuse("not_found");
  if (ctx.actor.role !== uploaderRoleOf(item.formCode, item.uploaderRole)) return refuse("wrong_actor");
  if (item.formCode === "TDW_05" && !input.subjectUserId) return refuse("subject_required");
  const req: UploadRequest = { kind: "scan", sha256: input.sha256, size: input.size, contentType: input.contentType };
  const problem = uploadProblem(req);
  if (problem) return refuse("bad_file", problem);

  const subject = item.formCode === "TDW_05" ? input.subjectUserId : null;
  if (subject) {
    // An NDA belongs to a Panel Member with a seat that is not declined (FR-CMT-03).
    const [seat] = await ctx.db
      .select({ id: committeeMember.id })
      .from(committeeMember)
      .innerJoin(committee, eq(committee.id, committeeMember.committeeId))
      .where(and(eq(committee.thesisInstanceId, m.thesisInstanceId), eq(committeeMember.memberUserId, subject), ne(committeeMember.status, "declined")));
    if (!seat) return refuse("subject_not_seat");
  }
  const record = await ctx.db.transaction(async (tx) => {
    const [found] = await tx
      .select()
      .from(documentRecord)
      .where(
        and(
          eq(documentRecord.milestoneInstanceId, m.id),
          eq(documentRecord.templateRequiredItemId, item.id),
          subject ? eq(documentRecord.subjectUserId, subject) : isNull(documentRecord.subjectUserId),
        ),
      );
    if (found) return found;
    // FR-DOC-04: the app sets Prepared. The prefilled PDF comes with the form pack (FR-DOC-05, Phase 4).
    const [doc] = await tx
      .insert(documentRecord)
      .values({ milestoneInstanceId: m.id, templateRequiredItemId: item.id, formCode: item.formCode, subjectUserId: subject, state: "prepared" })
      .returning();
    await step(tx, ctx, doc!.id, "not_started", "prepared", null);
    await recordAudit({ db: tx, actor: ctx.actor }, {
      action: "document.prepared",
      targetTable: "document_record",
      targetId: doc!.id,
      detail: { formCode: item.formCode },
    });
    return doc!;
  });
  if (!canUploadScan(record.state)) return refuse("locked");
  return { ok: true, value: { documentId: record.id, link: await files.createUploadLink(req) } };
}

/**
 * FR-DOC-03, NFR-02, BR-19: after the browser upload, check the stored hash and size,
 * then write the file row and lock the scan. A Mismatch file locks again in one step.
 */
export async function confirmScanUpload(
  ctx: DataContext,
  input: { documentId: string; key: string; sha256: string; size: number; contentType: string },
  files: FilePort,
): Promise<DocResult<null>> {
  requireActive(ctx.actor);
  const { doc, uploaderRole } = await loadDocument(ctx, input.documentId);
  if (ctx.actor.role !== uploaderRoleOf(doc.formCode, uploaderRole)) return refuse("wrong_actor");
  if (!canUploadScan(doc.state)) return refuse("locked");
  if (uploadProblem({ kind: "scan", sha256: input.sha256, size: input.size, contentType: input.contentType })) return refuse("bad_file");
  if (!SCAN_KEY.test(input.key)) return refuse("bad_key");
  const [used] = await ctx.db.select({ id: documentFile.id }).from(documentFile).where(eq(documentFile.fileKey, input.key));
  if (used) return refuse("bad_key");
  if (!(await files.checkStoredFile(input.key, input.sha256, input.size))) return refuse("hash_mismatch");

  const actor: DocumentActor = "uploader";
  const path: [DocumentState, DocumentState, DocumentActor][] =
    doc.state === "mismatch"
      ? [["mismatch", "locked_as_submitted", actor]]
      : [
          [doc.state, "scan_uploaded", actor],
          ["scan_uploaded", "locked_as_submitted", "system"],
        ];
  for (const [from, to, who] of path) {
    const d = decideDocumentChange(from, to, who);
    if (!d.ok) return refuse(d.code, d.reason);
  }

  return ctx.db.transaction(async (tx) => {
    const [last] = await tx
      .select({ n: max(documentFile.versionNo) })
      .from(documentFile)
      .where(eq(documentFile.documentRecordId, doc.id));
    const versionNo = (last?.n ?? 0) + 1;
    await tx.insert(documentFile).values({
      documentRecordId: doc.id,
      versionNo,
      fileKey: input.key,
      sha256: input.sha256,
      sizeBytes: input.size,
      mimeType: input.contentType,
      uploadedByUserId: ctx.actor.userId,
    });
    for (const [from, to] of path) await step(tx, ctx, doc.id, from, to, null);
    await tx.update(documentRecord).set({ state: "locked_as_submitted" }).where(eq(documentRecord.id, doc.id));
    await recordAudit({ db: tx, actor: ctx.actor }, {
      action: "document.upload_scan",
      targetTable: "document_record",
      targetId: doc.id,
      detail: { formCode: doc.formCode, versionNo },
    });
    return { ok: true, value: null };
  });
}

/** FR-DOC-06, FR-DOC-07: the Coordinator marks received, verifies, returns or marks a Mismatch. */
export async function reviewDocument(
  ctx: DataContext,
  input: { documentId: string; to: "physical_received" | "verified" | "mismatch" | "returned"; reason?: string | null },
): Promise<DocResult<null>> {
  requireActive(ctx.actor);
  if (ctx.actor.role !== "coordinator") throw new AccessDeniedError("only the Coordinator reviews documents");
  const { doc } = await loadDocument(ctx, input.documentId);
  const reason = input.reason?.trim() ? input.reason.trim() : null;
  // BR-13 for a Return. The ERD check also needs a reason for a Mismatch (BR-12: say what differs).
  if ((input.to === "returned" || input.to === "mismatch") && !reason) return refuse("reason_required");
  const d = decideDocumentChange(doc.state, input.to, "coordinator", reason);
  if (!d.ok) return refuse(d.code, d.reason);
  return ctx.db.transaction(async (tx) => {
    await step(tx, ctx, doc.id, doc.state, input.to, reason);
    await tx.update(documentRecord).set({ state: input.to }).where(eq(documentRecord.id, doc.id));
    await recordAudit({ db: tx, actor: ctx.actor }, {
      action: `document.${input.to}`,
      targetTable: "document_record",
      targetId: doc.id,
      detail: { formCode: doc.formCode, from: doc.state },
    });
    return { ok: true, value: null };
  });
}

/** FR-DOC-11: the state history and the file versions of one document. No file keys leave the server. */
export async function documentHistory(ctx: DataContext, documentId: string) {
  requireActive(ctx.actor);
  const { doc } = await loadDocument(ctx, documentId);
  const events = await ctx.db
    .select({
      fromState: documentEvent.fromState,
      toState: documentEvent.toState,
      reason: documentEvent.reason,
      actorUserId: documentEvent.actorUserId,
      createdAt: documentEvent.createdAt,
    })
    .from(documentEvent)
    .where(eq(documentEvent.documentRecordId, doc.id))
    .orderBy(asc(documentEvent.id));
  const fileRows = await ctx.db
    .select({
      versionNo: documentFile.versionNo,
      sha256: documentFile.sha256,
      sizeBytes: documentFile.sizeBytes,
      mimeType: documentFile.mimeType,
      uploadedByUserId: documentFile.uploadedByUserId,
      uploadedAt: documentFile.uploadedAt,
    })
    .from(documentFile)
    .where(eq(documentFile.documentRecordId, doc.id))
    .orderBy(asc(documentFile.versionNo));
  return { state: doc.state, events, files: fileRows };
}
