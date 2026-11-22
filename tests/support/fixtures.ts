// Fake rows for schema and data-layer tests (AGENTS.md §11: fake data only).
import { and, eq } from "drizzle-orm";
import type { Db } from "@/server/data/db";
import * as s from "@/server/data/schema";

export const SHA = "0".repeat(64);
let n = 0;
const next = () => ++n;

export async function makeUser(db: Db, role: s.UserRole) {
  const i = next();
  const [u] = await db
    .insert(s.appUser)
    .values({ fullName: `Fake ${role} ${i}`, email: `${role}.${i}@example.test`, role })
    .returning();
  return u!;
}

// One Student with an Adviser, a Proposal milestone, its Submission PR and commit v1.
export async function makeThesisChain(db: Db) {
  const coordinator = await makeUser(db, "coordinator");
  const student = await makeUser(db, "student");
  const adviser = await makeUser(db, "adviser");
  // The default templates come from migration 0003 (FR-TPL-02).
  const [tpl] = await db.select().from(s.milestoneTemplate).where(eq(s.milestoneTemplate.code, "proposal"));
  const [version] = await db
    .select()
    .from(s.templateVersion)
    .where(and(eq(s.templateVersion.milestoneTemplateId, tpl!.id), eq(s.templateVersion.versionNo, 1)));
  const [thesis] = await db
    .insert(s.thesisInstance)
    .values({
      studentUserId: student.id,
      adviserUserId: adviser.id,
      degreeLevel: "masters",
      programStartTerm: "2025-1",
      writing1Course: "RSH_641",
      createdByUserId: coordinator.id,
    })
    .returning();
  const [milestone] = await db
    .insert(s.milestoneInstance)
    .values({ thesisInstanceId: thesis!.id, templateVersionId: version!.id, milestoneCode: "proposal" })
    .returning();
  const [pr] = await db.insert(s.submissionPr).values({ milestoneInstanceId: milestone!.id }).returning();
  const [commit] = await db
    .insert(s.manuscriptCommit)
    .values({
      submissionPrId: pr!.id,
      ordinal: 1,
      fileKey: `test/manuscript/${crypto.randomUUID()}.pdf`,
      sha256: SHA,
      sizeBytes: 1000,
      uploadedByUserId: student.id,
    })
    .returning();
  return { coordinator, student, adviser, template: tpl!, version: version!, thesis: thesis!, milestone: milestone!, pr: pr!, commit: commit! };
}
