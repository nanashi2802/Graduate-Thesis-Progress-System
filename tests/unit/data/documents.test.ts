// P1-E07-T02: deliverables, scan upload and Coordinator review
// (FR-DOC-01, 03, 06, 07, 11, BR-12, BR-13, BR-19, NFR-01, NFR-02, NFR-03, AD-B-019).
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { AccessDeniedError, type Actor } from "@/server/data/access";
import type { Db } from "@/server/data/db";
import {
  confirmScanUpload,
  deliverables,
  documentHistory,
  readableMilestones,
  requestScanUpload,
  reviewDocument,
  type FilePort,
} from "@/server/data/documents";
import * as s from "@/server/data/schema";
import { seedMilestone1 } from "../../support/seed-m1";
import { makeTestDb } from "../../support/test-db";

const SHA = "a".repeat(64);
let db: Db;
let seed: Awaited<ReturnType<typeof seedMilestone1>>;
let stored: boolean;
let keyNo: number;

// A fake file store: no S3 in unit tests. It records the keys it signed.
const files: FilePort = {
  createUploadLink: async (req) => ({ key: `agent-b/test/scan/${++keyNo}.pdf`, url: "https://store.test/put", headers: { "x-kind": req.kind } }),
  checkStoredFile: async () => stored,
};

const actorOf = (u: { id: string; role: s.UserRole }): Actor => ({ userId: u.id, role: u.role, isActive: true });
const student = () => ({ db, actor: actorOf(seed.student) });
const coord = () => ({ db, actor: actorOf(seed.coordinator) });
const upload = { sha256: SHA, size: 2048, contentType: "application/pdf" };

beforeEach(async () => {
  ({ db } = await makeTestDb());
  seed = await seedMilestone1(db);
  stored = true;
  keyNo = 0;
});

async function itemId(formCode: s.FormCode) {
  const rows = await db.select().from(s.templateRequiredItem).where(eq(s.templateRequiredItem.templateVersionId, seed.versions.proposal.id));
  return rows.find((r) => r.formCode === formCode)!.id;
}

async function seatPanelMember(userId: string, status: s.MemberStatus = "proposed") {
  const [c] = await db.insert(s.committee).values({ thesisInstanceId: seed.thesis.id, kind: "evaluation_committee" }).onConflictDoNothing().returning();
  const committeeId = c?.id ?? (await db.select().from(s.committee).where(eq(s.committee.thesisInstanceId, seed.thesis.id)))[0]!.id;
  await db.insert(s.committeeMember).values({ committeeId, memberUserId: userId, status });
}

async function uploadAs(ctx: ReturnType<typeof student>, requiredItemId: string, subjectUserId: string | null = null) {
  const req = await requestScanUpload(ctx, { milestoneId: seed.milestone.id, requiredItemId, subjectUserId, ...upload }, files);
  if (!req.ok) throw new Error(req.reason);
  const done = await confirmScanUpload(ctx, { documentId: req.value.documentId, key: req.value.link.key, ...upload }, files);
  if (!done.ok) throw new Error(done.reason);
  return req.value.documentId;
}

describe("a form signed for one commit (INV-34)", () => {
  async function addCommits(n: number) {
    const [pr] = await db.insert(s.submissionPr).values({ milestoneInstanceId: seed.milestone.id }).onConflictDoNothing().returning();
    const prId = pr?.id ?? (await db.select().from(s.submissionPr))[0]!.id;
    const ids: string[] = [];
    for (let i = 1; i <= n; i++) {
      const [c] = await db
        .insert(s.manuscriptCommit)
        .values({ submissionPrId: prId, ordinal: i, fileKey: `agent-b/test/manuscript/${i}.pdf`, sha256: SHA, sizeBytes: 1024, uploadedByUserId: seed.student.id })
        .returning();
      ids.push(c!.id);
    }
    return ids;
  }
  // The default templates (migration 0003) hold no Certification item. A Coordinator adds it on the template screen.
  async function certificationItemId() {
    const [row] = await db
      .insert(s.templateRequiredItem)
      .values({ templateVersionId: seed.versions.proposal.id, formCode: "CERTIFICATION", label: "Certification", uploaderRole: "student" })
      .returning();
    return row!.id;
  }
  const request = async (requiredItemId: string) =>
    requestScanUpload(student(), { milestoneId: seed.milestone.id, requiredItemId, subjectUserId: null, ...upload }, files);

  it("refuses the certification scan while no commit exists", async () => {
    expect(await request(await certificationItemId())).toMatchObject({ ok: false, code: "no_commit" });
    expect(await db.select().from(s.documentRecord)).toHaveLength(0);
  });

  it("links the record to the newest commit, and keeps one record for the milestone", async () => {
    const ids = await addCommits(2);
    const item = await certificationItemId();
    const first = await request(item);
    expect(first.ok).toBe(true);
    const [rec] = await db.select().from(s.documentRecord);
    expect(rec!.linkedCommitId).toBe(ids[1]);
    const again = await request(item);
    expect(again.ok && first.ok && again.value.documentId === first.value.documentId).toBe(true);
    expect(await db.select().from(s.documentRecord)).toHaveLength(1);
  });
});

describe("deliverables (FR-DOC-01)", () => {
  it("gives each user only the milestones of their own theses (ERD §8)", async () => {
    expect((await readableMilestones(student())).map((m) => m.id)).toEqual([seed.milestone.id]);
    expect((await readableMilestones(coord())).length).toBeGreaterThan(0);
    // A Panel Member with no seat reads nothing.
    expect(await readableMilestones({ db, actor: actorOf(seed.panel[0]!) })).toEqual([]);
  });

  it("lists the template items with the signers and a state for each", async () => {
    const list = await deliverables(student(), seed.milestone.id);
    expect(list.length).toBeGreaterThan(0);
    const tdw07 = list.find((d) => d.formCode === "TDW_07")!;
    expect(tdw07).toMatchObject({ uploaderRole: "student", records: [] });
  });

  it("refuses a user with no access to the thesis (NFR-01)", async () => {
    await expect(deliverables({ db, actor: actorOf(seed.panel[0]!) }, seed.milestone.id)).rejects.toThrow(AccessDeniedError);
  });
});

describe("scan upload (FR-DOC-03, BR-19, NFR-02)", () => {
  it("locks the scan on upload and keeps the history (FR-DOC-11)", async () => {
    const id = await uploadAs(student(), await itemId("TDW_07"));
    const [doc] = await db.select().from(s.documentRecord).where(eq(s.documentRecord.id, id));
    expect(doc!.state).toBe("locked_as_submitted");
    const history = await documentHistory(student(), id);
    expect(history.events.map((e) => `${e.fromState}>${e.toState}`)).toEqual([
      "not_started>prepared",
      "prepared>scan_uploaded",
      "scan_uploaded>locked_as_submitted",
    ]);
    expect(history.files).toHaveLength(1);
    expect(history.files[0]).toMatchObject({ versionNo: 1, sha256: SHA });
  });

  it("refuses a second upload while the scan is locked (BR-19)", async () => {
    const item = await itemId("TDW_07");
    await uploadAs(student(), item);
    const again = await requestScanUpload(student(), { milestoneId: seed.milestone.id, requiredItemId: item, subjectUserId: null, ...upload }, files);
    expect(again).toMatchObject({ ok: false, code: "locked" });
  });

  it("makes no file row when the stored file does not match the hash (NFR-02)", async () => {
    const req = await requestScanUpload(student(), { milestoneId: seed.milestone.id, requiredItemId: await itemId("OR"), subjectUserId: null, ...upload }, files);
    if (!req.ok) throw new Error("setup");
    stored = false;
    const done = await confirmScanUpload(student(), { documentId: req.value.documentId, key: req.value.link.key, ...upload }, files);
    expect(done).toMatchObject({ ok: false, code: "hash_mismatch" });
    expect(await db.select().from(s.documentFile)).toHaveLength(0);
  });

  it("refuses a key that is not a scan key, or a key already in use (INV-09)", async () => {
    const first = await uploadAs(student(), await itemId("TDW_07"));
    const [used] = await db.select().from(s.documentFile).where(eq(s.documentFile.documentRecordId, first));
    const req = await requestScanUpload(student(), { milestoneId: seed.milestone.id, requiredItemId: await itemId("OR"), subjectUserId: null, ...upload }, files);
    if (!req.ok) throw new Error("setup");
    const confirm = (key: string) => confirmScanUpload(student(), { documentId: req.value.documentId, key, ...upload }, files);
    expect(await confirm(used!.fileKey)).toMatchObject({ ok: false, code: "bad_key" });
    expect(await confirm("agent-b/test/manuscript/1.pdf")).toMatchObject({ ok: false, code: "bad_key" });
  });

  it("lets only the uploader role of the item upload (Student, Adviser for TDW 03, Coordinator for TDW 05 and 06)", async () => {
    const asAdviser = { db, actor: actorOf(seed.adviser) };
    expect(
      await requestScanUpload(asAdviser, { milestoneId: seed.milestone.id, requiredItemId: await itemId("TDW_07"), subjectUserId: null, ...upload }, files),
    ).toMatchObject({ ok: false, code: "wrong_actor" });
    await uploadAs(asAdviser, await itemId("TDW_03"));
    await seatPanelMember(seed.panel[0]!.id);
    await uploadAs(coord(), await itemId("TDW_05"), seed.panel[0]!.id);
  });

  it("refuses a TDW 05 for a person with no seat, or a declined seat (FR-CMT-03)", async () => {
    const req = async (subjectUserId: string) =>
      requestScanUpload(coord(), { milestoneId: seed.milestone.id, requiredItemId: await itemId("TDW_05"), subjectUserId, ...upload }, files);
    expect(await req(seed.panel[0]!.id)).toMatchObject({ ok: false, code: "subject_not_seat" });
    await seatPanelMember(seed.panel[0]!.id, "declined");
    expect(await req(seed.panel[0]!.id)).toMatchObject({ ok: false, code: "subject_not_seat" });
  });

  it("writes an audit record for the Prepared step (NFR-03)", async () => {
    await requestScanUpload(student(), { milestoneId: seed.milestone.id, requiredItemId: await itemId("TDW_07"), subjectUserId: null, ...upload }, files);
    const rows = await db.select().from(s.auditRecord).where(eq(s.auditRecord.action, "document.prepared"));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ actorUserId: seed.student.id, targetTable: "document_record" });
  });

  it("refuses a bad file before it signs a link (NFR-10)", async () => {
    const res = await requestScanUpload(
      student(),
      { milestoneId: seed.milestone.id, requiredItemId: await itemId("OR"), subjectUserId: null, ...upload, contentType: "text/plain" },
      files,
    );
    expect(res).toMatchObject({ ok: false, code: "bad_file" });
  });
});

describe("Coordinator review (FR-DOC-06, FR-DOC-07, BR-12, BR-13)", () => {
  it("marks received, then verified, with one history row and one audit record each", async () => {
    const id = await uploadAs(student(), await itemId("TDW_07"));
    expect(await reviewDocument(coord(), { documentId: id, to: "physical_received" })).toEqual({ ok: true, value: null });
    expect(await reviewDocument(coord(), { documentId: id, to: "verified" })).toEqual({ ok: true, value: null });
    const history = await documentHistory(coord(), id);
    expect(history.events.at(-1)).toMatchObject({ fromState: "physical_received", toState: "verified" });
    const audit = await db.select().from(s.auditRecord);
    expect(audit.filter((a) => a.action.startsWith("document.")).length).toBeGreaterThanOrEqual(2);
  });

  it("needs a reason for a Return and a Mismatch (BR-13)", async () => {
    const id = await uploadAs(student(), await itemId("TDW_07"));
    expect(await reviewDocument(coord(), { documentId: id, to: "returned", reason: " " })).toMatchObject({
      ok: false,
      code: "reason_required",
    });
    expect(await reviewDocument(coord(), { documentId: id, to: "mismatch" })).toMatchObject({ ok: false, code: "reason_required" });
    expect(await reviewDocument(coord(), { documentId: id, to: "mismatch", reason: "Page 3 differs" })).toMatchObject({ ok: true });
  });

  it("tells the Student about a Return with an in-app notice, and only about a Return (B3)", async () => {
    const id = await uploadAs(student(), await itemId("TDW_07"));
    await reviewDocument(coord(), { documentId: id, to: "mismatch", reason: "Page 3 differs" });
    expect(await db.select().from(s.notification)).toHaveLength(0);
    await uploadAs(student(), await itemId("TDW_07"));
    await reviewDocument(coord(), { documentId: id, to: "returned", reason: "Missing signature" });
    const rows = await db.select().from(s.notification);
    expect(rows).toEqual([expect.objectContaining({ recipientUserId: seed.student.id, eventCode: "B3", targetTable: "document_record", targetId: id })]);
  });

  it("lets the uploader replace a returned scan, and a mismatch file locks again", async () => {
    const item = await itemId("TDW_07");
    const id = await uploadAs(student(), item);
    await reviewDocument(coord(), { documentId: id, to: "returned", reason: "Missing signature" });
    expect(await uploadAs(student(), item)).toBe(id);
    await reviewDocument(coord(), { documentId: id, to: "mismatch", reason: "Wrong page" });
    expect(await uploadAs(student(), item)).toBe(id);
    const history = await documentHistory(student(), id);
    expect(history.files.map((f) => f.versionNo)).toEqual([1, 2, 3]);
    const [doc] = await db.select().from(s.documentRecord).where(eq(s.documentRecord.id, id));
    expect(doc!.state).toBe("locked_as_submitted");
  });

  it("refuses a skipped step and a non-Coordinator", async () => {
    const id = await uploadAs(student(), await itemId("TDW_07"));
    expect(await reviewDocument(coord(), { documentId: id, to: "verified" })).toMatchObject({ ok: false, code: "not_allowed" });
    await expect(reviewDocument(student(), { documentId: id, to: "physical_received" })).rejects.toThrow(AccessDeniedError);
  });
});
