// The Student dossier export (FR-DOC-10, BR-02 role check, NFR-03). Coordinator only. Server only.
// It lists commits, scans, Minutes and audit records with an index. File bytes stay in the store: each row keeps its key and SHA-256.
import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { requireActive, type DataContext } from "./access";
import { recordAudit } from "./audit";
import { InputProblem, requireCoordinator } from "./coordinator";
import { auditRecord, booking, committee, committeeMember, consultationLogEntry, critiqueThread, defenseAttempt, documentFile, documentRecord, evaluationEntry, manuscriptCommit, milestoneInstance, minutes, revisionItem, submissionPr, thesisInstance } from "./schema";

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

  const attIds = attempts.map((a) => a.id);
  const consults = await none(msIds, (ids) => ctx.db.select().from(consultationLogEntry).where(inArray(consultationLogEntry.milestoneInstanceId, ids)).orderBy(asc(consultationLogEntry.heldAt)));
  const comms = await ctx.db.select().from(committee).where(eq(committee.thesisInstanceId, thesisId));
  const members = await none(comms.map((c) => c.id), (ids) => ctx.db.select().from(committeeMember).where(inArray(committeeMember.committeeId, ids)));
  const threads = await none(commits.map((c) => c.id), (ids) => ctx.db.select({ id: critiqueThread.id }).from(critiqueThread).where(inArray(critiqueThread.commitId, ids)));
  const evals = await none(attIds, (ids) => ctx.db.select({ id: evaluationEntry.id }).from(evaluationEntry).where(inArray(evaluationEntry.defenseAttemptId, ids)));
  const revs = await none(attIds, (ids) => ctx.db.select({ id: revisionItem.id }).from(revisionItem).where(inArray(revisionItem.defenseAttemptId, ids)));
  const books = await ctx.db.select({ id: booking.id }).from(booking).where(eq(booking.thesisInstanceId, thesisId));

  const targets = [
    thesisId, ...msIds, ...prs.map((p) => p.id), ...commits.map((c) => c.id), ...records.map((r) => r.id), ...scans.map((s) => s.id), ...attIds,
    ...mins.map((m) => m.id), ...consults.map((c) => c.id), ...comms.map((c) => c.id), ...members.map((m) => m.id),
    ...threads.map((t) => t.id), ...evals.map((e) => e.id), ...revs.map((r) => r.id), ...books.map((b) => b.id),
  ];
  const logs = await none(targets, (ids) => ctx.db.select().from(auditRecord).where(inArray(auditRecord.targetId, ids)).orderBy(asc(auditRecord.id)));

  const out = {
    thesisId,
    exportedAt: new Date().toISOString(),
    commits: commits.map((c) => ({ milestone: code.get(prMs.get(c.submissionPrId)!), ordinal: c.ordinal, fileKey: c.fileKey, sha256: c.sha256, sizeBytes: c.sizeBytes, uploadedAt: c.uploadedAt })),
    scans: scans.map((s) => { const r = recMap.get(s.documentRecordId)!; return { milestone: code.get(r.milestoneInstanceId), form: r.formCode, version: s.versionNo, fileKey: s.fileKey, sha256: s.sha256, sizeBytes: s.sizeBytes, uploadedAt: s.uploadedAt }; }),
    minutes: mins.map((m) => ({ milestone: code.get(attMs.get(m.defenseAttemptId)!), body: m.body, issuedAt: m.issuedAt })),
    consultationLogs: consults.map((c) => ({ milestone: code.get(c.milestoneInstanceId), heldAt: c.heldAt, place: c.placeOrPlatform, topic: c.topic, recommendations: c.recommendations, confirmedAt: c.confirmedAt })),
    logs: logs.map((l) => ({ at: l.createdAt, role: l.actorRole, action: l.action, table: l.targetTable, targetId: l.targetId, detail: l.detail })),
  };
  const index = { commits: out.commits.length, scans: out.scans.length, minutes: out.minutes.length, consultationLogs: out.consultationLogs.length, logs: out.logs.length };
  await recordAudit(ctx, { action: "dossier.export", targetTable: "thesis_instance", targetId: thesisId, detail: index });
  return { index, ...out };
}
