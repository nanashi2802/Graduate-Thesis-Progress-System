// P1-E01: database invariants from ERD §6 (INV-02 to INV-11, INV-18, INV-19, INV-26, INV-31, INV-34).
import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/server/data/db";
import * as s from "@/server/data/schema";
import { makeThesisChain, makeUser, SHA } from "../../support/fixtures";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let c: Awaited<ReturnType<typeof makeThesisChain>>;

beforeEach(async () => {
  ({ db } = await makeTestDb());
  c = await makeThesisChain(db);
});

const commitValues = (over: Partial<typeof s.manuscriptCommit.$inferInsert> = {}) => ({
  submissionPrId: c.pr.id,
  ordinal: 2,
  fileKey: `test/manuscript/${crypto.randomUUID()}.pdf`,
  sha256: SHA,
  sizeBytes: 1000,
  uploadedByUserId: c.student.id,
  ...over,
});

// PGlite wraps the Postgres error. The message with the INV ID is in the cause chain.
async function rejects(p: Promise<unknown>, match?: RegExp) {
  const err = await p.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err, "the database must refuse this").not.toBeNull();
  if (match) {
    const text = [err, (err as { cause?: unknown }).cause].map((e) => String((e as Error)?.message ?? e)).join(" | ");
    expect(text).toMatch(match);
  }
}

describe("INV-02: thesis roles", () => {
  it("refuses an Adviser column that points to a Student", async () => {
    const other = await makeUser(db, "student");
    await rejects(
      db.insert(s.thesisInstance).values({
        studentUserId: other.id,
        adviserUserId: c.student.id,
        degreeLevel: "masters",
        programStartTerm: "2025-1",
        writing1Course: "RSH_641",
        createdByUserId: c.coordinator.id,
      }),
      /INV-02/,
    );
  });
});

describe("INV-03: seats go to Panel Members only", () => {
  it("refuses a seat for the Adviser and accepts a Panel Member", async () => {
    const [committee] = await db
      .insert(s.committee)
      .values({ thesisInstanceId: c.thesis.id, kind: "evaluation_committee" })
      .returning();
    await rejects(db.insert(s.committeeMember).values({ committeeId: committee!.id, memberUserId: c.adviser.id }), /INV-03/);
    const panel = await makeUser(db, "panel_member");
    await db.insert(s.committeeMember).values({ committeeId: committee!.id, memberUserId: panel.id });
  });
});

describe("INV-04: one thesis per Student, one milestone per code", () => {
  it("refuses a second thesis for the same Student", async () => {
    await rejects(
      db.insert(s.thesisInstance).values({
        studentUserId: c.student.id,
        adviserUserId: c.adviser.id,
        degreeLevel: "masters",
        programStartTerm: "2025-1",
        writing1Course: "RSH_641",
        createdByUserId: c.coordinator.id,
      }),
    );
  });
  it("refuses a second Proposal milestone for the same thesis", async () => {
    await rejects(
      db.insert(s.milestoneInstance).values({ thesisInstanceId: c.thesis.id, templateVersionId: c.version.id, milestoneCode: "proposal" }),
    );
  });
});

describe("INV-05: no commit while the manuscript is locked", () => {
  it("refuses a commit after Gate 1b locks the PR, and accepts one after unlock", async () => {
    await db.update(s.submissionPr).set({ lockedAt: new Date() }).where(eq(s.submissionPr.id, c.pr.id));
    await rejects(db.insert(s.manuscriptCommit).values(commitValues()), /INV-05/);
    await db.update(s.submissionPr).set({ lockedAt: null }).where(eq(s.submissionPr.id, c.pr.id));
    await db.insert(s.manuscriptCommit).values(commitValues());
  });
});

describe("INV-08: append-only tables", () => {
  it("refuses UPDATE and DELETE on a commit", async () => {
    await rejects(db.update(s.manuscriptCommit).set({ changeNote: "x" }).where(eq(s.manuscriptCommit.id, c.commit.id)), /INV-08/);
    await rejects(db.delete(s.manuscriptCommit).where(eq(s.manuscriptCommit.id, c.commit.id)), /INV-08/);
  });

  it.each(["manuscript_commit", "document_file", "document_event", "gate_action", "audit_record"])(
    "refuses TRUNCATE on %s",
    async (table) => {
      await rejects(db.execute(sql.raw(`truncate app.${table} cascade`)), /INV-08/);
    },
  );

  it("refuses UPDATE on a gate action and an audit record", async () => {
    const [g] = await db
      .insert(s.gateAction)
      .values({ milestoneInstanceId: c.milestone.id, gate: "gate_1a", result: "endorsed", actorUserId: c.adviser.id, actorRole: "adviser" })
      .returning();
    await rejects(db.update(s.gateAction).set({ reason: "x" }).where(eq(s.gateAction.id, g!.id)), /INV-08/);
    const [a] = await db
      .insert(s.auditRecord)
      .values({ actorUserId: c.coordinator.id, actorRole: "coordinator", action: "test", targetTable: "app_user" })
      .returning();
    await rejects(db.delete(s.auditRecord).where(eq(s.auditRecord.id, a!.id)), /INV-08/);
  });

  it("refuses UPDATE on a document file and a document event", async () => {
    const [rec] = await db.insert(s.documentRecord).values({ milestoneInstanceId: c.milestone.id, formCode: "TDW_06" }).returning();
    const [f] = await db
      .insert(s.documentFile)
      .values({ documentRecordId: rec!.id, versionNo: 1, fileKey: "test/scan/1.pdf", sha256: SHA, sizeBytes: 10, mimeType: "application/pdf", uploadedByUserId: c.coordinator.id })
      .returning();
    await rejects(db.update(s.documentFile).set({ sizeBytes: 11 }).where(eq(s.documentFile.id, f!.id)), /INV-08/);
    const [e] = await db
      .insert(s.documentEvent)
      .values({ documentRecordId: rec!.id, fromState: "not_started", toState: "prepared", actorUserId: c.coordinator.id })
      .returning();
    await rejects(db.delete(s.documentEvent).where(eq(s.documentEvent.id, e!.id)), /INV-08/);
  });
});

describe("INV-09 to INV-11: file keys, hashes and sizes", () => {
  it("refuses a reused file key (INV-09)", async () => {
    await rejects(db.insert(s.manuscriptCommit).values(commitValues({ fileKey: c.commit.fileKey })));
  });
  it("refuses a hash that is not 64 lowercase hex characters (INV-10)", async () => {
    await rejects(db.insert(s.manuscriptCommit).values(commitValues({ sha256: "A".repeat(64) })));
  });
  it("refuses a commit over 50 MB (INV-11)", async () => {
    await rejects(db.insert(s.manuscriptCommit).values(commitValues({ sizeBytes: s.MAX_FILE_BYTES + 1 })));
  });
  it("refuses a scan that is not a PDF or an image (INV-11)", async () => {
    const [rec] = await db.insert(s.documentRecord).values({ milestoneInstanceId: c.milestone.id, formCode: "TDW_06" }).returning();
    await rejects(
      db.insert(s.documentFile).values({ documentRecordId: rec!.id, versionNo: 1, fileKey: "test/scan/2.doc", sha256: SHA, sizeBytes: 10, mimeType: "application/msword", uploadedByUserId: c.coordinator.id }),
    );
  });
});

describe("INV-18: a Return keeps its reason", () => {
  it("refuses RETURNED with no reason", async () => {
    await rejects(db.update(s.milestoneInstance).set({ status: "RETURNED" }).where(eq(s.milestoneInstance.id, c.milestone.id)));
    await db
      .update(s.milestoneInstance)
      .set({ status: "RETURNED", returnReason: "Chapter 3 needs the method." })
      .where(eq(s.milestoneInstance.id, c.milestone.id));
  });
});

describe("INV-19: a returned gate action needs a reason", () => {
  it("refuses a blank reason", async () => {
    await rejects(
      db.insert(s.gateAction).values({ milestoneInstanceId: c.milestone.id, gate: "gate_1a", result: "returned", reason: "  ", actorUserId: c.adviser.id, actorRole: "adviser" }),
    );
  });
  it("refuses a returned or mismatch document event with no reason", async () => {
    const [rec] = await db.insert(s.documentRecord).values({ milestoneInstanceId: c.milestone.id, formCode: "TDW_06" }).returning();
    await rejects(
      db.insert(s.documentEvent).values({ documentRecordId: rec!.id, fromState: "verified", toState: "mismatch", actorUserId: c.coordinator.id }),
    );
  });
});

describe("INV-26: a running milestone keeps its template version", () => {
  it("refuses a change of template_version_id", async () => {
    const [v2] = await db
      .insert(s.templateVersion)
      .values({ milestoneTemplateId: c.template.id, versionNo: 999, panelSizeMasters: 2, panelSizeDoctoral: 3, printedCopiesMasters: 3, printedCopiesDoctoral: 4 })
      .returning();
    await rejects(
      db.update(s.milestoneInstance).set({ templateVersionId: v2!.id }).where(eq(s.milestoneInstance.id, c.milestone.id)),
      /INV-26/,
    );
  });
});

describe("INV-31: a document comment has exactly one target", () => {
  it("refuses no target and two targets", async () => {
    const panel = await makeUser(db, "panel_member");
    await rejects(db.insert(s.documentComment).values({ authorUserId: panel.id, body: "x" }));
    const [rec] = await db.insert(s.documentRecord).values({ milestoneInstanceId: c.milestone.id, formCode: "TDW_06" }).returning();
    const [f] = await db
      .insert(s.documentFile)
      .values({ documentRecordId: rec!.id, versionNo: 1, fileKey: "test/scan/3.pdf", sha256: SHA, sizeBytes: 10, mimeType: "application/pdf", uploadedByUserId: c.coordinator.id })
      .returning();
    await rejects(db.insert(s.documentComment).values({ authorUserId: panel.id, body: "x", documentFileId: f!.id, commitId: c.commit.id }));
    await db.insert(s.documentComment).values({ authorUserId: panel.id, body: "x", commitId: c.commit.id });
  });
});

describe("INV-34: signed documents name the signed commit", () => {
  it("refuses a CERTIFICATION with no linked commit", async () => {
    await rejects(db.insert(s.documentRecord).values({ milestoneInstanceId: c.milestone.id, formCode: "CERTIFICATION" }));
  });
  it("refuses a second CERTIFICATION in the same milestone", async () => {
    await db.insert(s.documentRecord).values({ milestoneInstanceId: c.milestone.id, formCode: "CERTIFICATION", linkedCommitId: c.commit.id });
    await rejects(
      db.insert(s.documentRecord).values({ milestoneInstanceId: c.milestone.id, formCode: "CERTIFICATION", linkedCommitId: c.commit.id }),
    );
  });
  it("refuses a commit from another milestone", async () => {
    const other = await makeThesisChain(db);
    await rejects(
      db.insert(s.documentRecord).values({ milestoneInstanceId: c.milestone.id, formCode: "CERTIFICATION", linkedCommitId: other.commit.id }),
      /INV-34/,
    );
  });
});
