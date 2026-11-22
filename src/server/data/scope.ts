// Row access for each role (NFR-01, FR-ACC-03, ERD §8) and manuscript access for
// Panel Members (INV-24, INV-33, BR-08, AD-A-013). Server only.
import { finalCopyRecorded } from "./clearance";
import "server-only";
import { and, eq, exists, ne, or, sql, type SQL } from "drizzle-orm";
import { memberAccess, type CommitteeBlockCode } from "@/server/domain/committee";
import { alias } from "drizzle-orm/pg-core";
import { AccessDeniedError, requireActive, type DataContext } from "./access";
import {
  committee,
  committeeMember,
  defenseAttempt,
  defenseSubstitute,
  documentRecord,
  milestoneInstance,
  thesisInstance,
  type ThesisInstance,
} from "./schema";

export type ThesisRelation = "student" | "adviser" | "panel_member" | "coordinator";

// A seat gives access unless it is declined (AD-A-013).
const seatOn = (thesisId: SQL | string, userId: string) =>
  and(eq(committee.thesisInstanceId, thesisId), eq(committeeMember.memberUserId, userId), ne(committeeMember.status, "declined"));

const substituteOn = (thesisId: SQL | string, userId: string) =>
  and(eq(milestoneInstance.thesisInstanceId, thesisId), eq(defenseSubstitute.substituteUserId, userId));

// The filter for a thesis list. A deactivated account matches no row (FR-ACC-06).
function thesisFilter(ctx: DataContext): SQL {
  const { actor, db } = ctx;
  if (!actor.isActive) return sql`false`;
  switch (actor.role) {
    case "coordinator":
      return sql`true`;
    case "student":
      return eq(thesisInstance.studentUserId, actor.userId);
    case "adviser":
      return eq(thesisInstance.adviserUserId, actor.userId);
    case "panel_member": {
      const id = sql`${thesisInstance.id}`;
      const seats = db
        .select({ one: sql`1` })
        .from(committeeMember)
        .innerJoin(committee, eq(committee.id, committeeMember.committeeId))
        .where(seatOn(id, actor.userId));
      const subs = db
        .select({ one: sql`1` })
        .from(defenseSubstitute)
        .innerJoin(defenseAttempt, eq(defenseAttempt.id, defenseSubstitute.defenseAttemptId))
        .innerJoin(milestoneInstance, eq(milestoneInstance.id, defenseAttempt.milestoneInstanceId))
        .where(substituteOn(id, actor.userId));
      return or(exists(seats), exists(subs))!;
    }
  }
}

// The theses the actor can read.
export async function readableTheses(ctx: DataContext): Promise<ThesisInstance[]> {
  return ctx.db.select().from(thesisInstance).where(thesisFilter(ctx));
}

// How the actor relates to one thesis, or null for no access.
export async function thesisRelation(ctx: DataContext, thesisId: string): Promise<ThesisRelation | null> {
  const [row] = await ctx.db
    .select({ id: thesisInstance.id })
    .from(thesisInstance)
    .where(and(eq(thesisInstance.id, thesisId), thesisFilter(ctx)));
  return row ? ctx.actor.role : null;
}

// Call first in every read or write of a thesis or its child rows.
export async function requireThesisRead(ctx: DataContext, thesisId: string): Promise<ThesisRelation> {
  requireActive(ctx.actor);
  const relation = await thesisRelation(ctx, thesisId);
  if (!relation) throw new AccessDeniedError("no access to this thesis");
  return relation;
}

// INV-33: a Panel Member's access ends at the BR-21 event (default: the Coordinator verifies
// the `final_copy` clearance item, AD-A-029).
export async function manuscriptAccessEnded(ctx: DataContext, thesisId: string): Promise<boolean> {
  return finalCopyRecorded(ctx.db, thesisId);
}

export type ManuscriptAccess =
  | { ok: true }
  | { ok: false; code: CommitteeBlockCode | "no_access"; reason: string };

const verified = (doc: { state: string } | null | undefined) => doc?.state === "verified";

// INV-24, BR-08: a Panel Member reads the manuscript only with the verified appointment form
// and the member's own verified NDA. A substitute needs its own NDA (FR-CMT-06).
export async function canReadManuscript(ctx: DataContext, thesisId: string): Promise<ManuscriptAccess> {
  const relation = ctx.actor.isActive ? await thesisRelation(ctx, thesisId) : null;
  if (!relation) return { ok: false, code: "no_access", reason: "You have no access to this thesis." };
  if (relation !== "panel_member") return { ok: true };

  const { db, actor } = ctx;
  const accessEnded = await manuscriptAccessEnded(ctx, thesisId);
  const form = alias(documentRecord, "form");
  const nda = alias(documentRecord, "nda");
  const seats = await db
    .select({ formState: form.state, ndaState: nda.state })
    .from(committeeMember)
    .innerJoin(committee, eq(committee.id, committeeMember.committeeId))
    .leftJoin(form, eq(form.id, committee.appointmentDocumentId))
    .leftJoin(nda, eq(nda.id, committeeMember.ndaDocumentId))
    .where(seatOn(thesisId, actor.userId));
  const subs = await db
    .select({ ndaState: nda.state })
    .from(defenseSubstitute)
    .innerJoin(defenseAttempt, eq(defenseAttempt.id, defenseSubstitute.defenseAttemptId))
    .innerJoin(milestoneInstance, eq(milestoneInstance.id, defenseAttempt.milestoneInstanceId))
    .leftJoin(nda, eq(nda.id, defenseSubstitute.ndaDocumentId))
    .where(substituteOn(thesisId, actor.userId));

  const decisions = [
    ...seats.map((r) =>
      memberAccess({
        kind: "seat",
        appointmentVerified: verified(r.formState ? { state: r.formState } : null),
        ndaVerified: verified(r.ndaState ? { state: r.ndaState } : null),
        accessEnded,
      }),
    ),
    ...subs.map((r) =>
      memberAccess({
        kind: "substitute",
        appointmentVerified: false,
        ndaVerified: verified(r.ndaState ? { state: r.ndaState } : null),
        accessEnded,
      }),
    ),
  ];
  return decisions.find((d) => d.ok) ?? decisions[0] ?? { ok: false, code: "no_access", reason: "You have no access to this thesis." };
}

// Call before every manuscript read and every signed read link (INV-24).
export async function requireManuscriptRead(ctx: DataContext, thesisId: string): Promise<void> {
  requireActive(ctx.actor);
  const res = await canReadManuscript(ctx, thesisId);
  if (!res.ok) throw new AccessDeniedError(res.reason);
}
