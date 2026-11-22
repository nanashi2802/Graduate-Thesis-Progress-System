// The Student dossier export (FR-DOC-10, BR-02 role check, NFR-03). Coordinator only. Server only.
// It lists commits, scans, Minutes and audit records with an index. File bytes stay in the store: each row keeps its key and SHA-256.
import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { requireActive, type DataContext } from "./access";
import { recordAudit } from "./audit";
import { InputProblem, requireCoordinator } from "./coordinator";
import { auditRecord, defenseAttempt, documentFile, documentRecord, manuscriptCommit, milestoneInstance, minutes, submissionPr, thesisInstance } from "./schema";

export async function exportDossier(ctx: DataContext, thesisId: string) {
  requireActive(ctx.actor);
  requireCoordinator(ctx, "exports a dossier");
  const [thesis] = await ctx.db.select().from(thesisInstance).where(eq(thesisInstance.id, thesisId));
  if (!thesis) throw new InputProblem("This thesis does not exist.");

  const ms = await ctx.db.select().from(milestoneInstance).where(eq(milestoneInstance.thesisInstanceId, thesisId));
  const msIds = ms.map((m) => m.id);
  const code = new Map(ms.map((m) => [m.id, m.milestoneCode]));
  const none = <T,>(ids: string[], q: (ids: string[]) => Promise<T[]>) => (ids.length ? q(ids) : Promise.resolve([] as T[]));

  const prs = await none(msIds, (ids) => ctx.db.select().from(submissionPr).where(inArray(submissionPr.milestoneInstanceId, ids)));
  const prMs = new Map(prs.map((p) => [p.id, p.milestoneInstanceId]));
  const commits = await none(prs.map((p) => p.id), (ids) =>
    ctx.db.select().from(manuscriptCommit).where(inArray(manuscriptCommit.submissionPrId, ids)).orderBy(asc(manuscriptCommit.ordinal)));
  const records = await none(msIds, (ids) => ctx.db.select().from(documentRecord).where(inArray(documentRecord.milestoneInstanceId, ids)));
  const recMap = new Map(records.map((r) => [r.id, r]));
  const scans = await none(records.map((r) => r.id), (ids) =>
    ctx.db.select().from(documentFile).where(inArray(documentFile.documentRecordId, ids)).orderBy(asc(documentFile.uploadedAt)));
  const attempts = await none(msIds, (ids) => ctx.db.select().from(defenseAttempt).where(inArray(defenseAttempt.milestoneInstanceId, ids)));
  const attMs = new Map(attempts.map((a) => [a.id, a.milestoneInstanceId]));
  const mins = await none(attempts.map((a) => a.id), (ids) => ctx.db.select().from(minutes).where(inArray(minutes.defenseAttemptId, ids)));

  const targets = [thesisId, ...msIds, ...prs.map((p) => p.id), ...commits.map((c) => c.id), ...records.map((r) => r.id), ...scans.map((s) => s.id), ...attempts.map((a) => a.id)];
  const logs = await none(targets, (ids) => ctx.db.select().from(auditRecord).where(inArray(auditRecord.targetId, ids)).orderBy(asc(auditRecord.id)));

  const out = {
    thesisId,
    exportedAt: new Date().toISOString(),
    commits: commits.map((c) => ({ milestone: code.get(prMs.get(c.submissionPrId)!), ordinal: c.ordinal, fileKey: c.fileKey, sha256: c.sha256, sizeBytes: c.sizeBytes, uploadedAt: c.uploadedAt })),
    scans: scans.map((s) => { const r = recMap.get(s.documentRecordId)!; return { milestone: code.get(r.milestoneInstanceId), form: r.formCode, version: s.versionNo, fileKey: s.fileKey, sha256: s.sha256, sizeBytes: s.sizeBytes, uploadedAt: s.uploadedAt }; }),
    minutes: mins.map((m) => ({ milestone: code.get(attMs.get(m.defenseAttemptId)!), body: m.body, issuedAt: m.issuedAt })),
    logs: logs.map((l) => ({ at: l.createdAt, role: l.actorRole, action: l.action, table: l.targetTable, targetId: l.targetId, detail: l.detail })),
  };
  const index = { commits: out.commits.length, scans: out.scans.length, minutes: out.minutes.length, logs: out.logs.length };
  await recordAudit(ctx, { action: "dossier.export", targetTable: "thesis_instance", targetId: thesisId, detail: index });
  return { index, ...out };
}
