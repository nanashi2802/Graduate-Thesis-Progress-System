// P1-E02-T01, T02: row access for each role (NFR-01, FR-ACC-03, ERD §8) and manuscript
// access for Panel Members (INV-24, INV-33, BR-08, AD-A-013).
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { AccessDeniedError, type Actor } from "@/server/data/access";
import type { Db } from "@/server/data/db";
import * as s from "@/server/data/schema";
import {
  canReadManuscript,
  readableTheses,
  requireManuscriptRead,
  requireThesisRead,
  thesisRelation,
} from "@/server/data/scope";
import { makeThesisChain, makeUser } from "../../support/fixtures";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let c: Awaited<ReturnType<typeof makeThesisChain>>;
let other: Awaited<ReturnType<typeof makeThesisChain>>;

const actor = (u: { id: string; role: s.UserRole }, isActive = true): Actor => ({
  userId: u.id,
  role: u.role,
  isActive,
});

async function doc(formCode: s.FormCode, state: s.DocumentState, subjectUserId?: string) {
  const [d] = await db
    .insert(s.documentRecord)
    .values({ milestoneInstanceId: c.milestone.id, formCode, state, subjectUserId })
    .returning();
  return d!;
}

async function seat(status: s.MemberStatus = "accepted", opts: { form?: s.DocumentState; nda?: s.DocumentState } = {}) {
  const member = await makeUser(db, "panel_member");
  const form = opts.form ? await doc("TDW_06", opts.form) : undefined;
  const [com] = await db
    .insert(s.committee)
    .values({ thesisInstanceId: c.thesis.id, kind: "evaluation_committee", appointmentDocumentId: form?.id })
    .onConflictDoUpdate({
      target: [s.committee.thesisInstanceId, s.committee.kind],
      set: { appointmentDocumentId: form?.id ?? null },
    })
    .returning();
  const nda = opts.nda ? await doc("TDW_05", opts.nda, member.id) : undefined;
  const [row] = await db
    .insert(s.committeeMember)
    .values({ committeeId: com!.id, memberUserId: member.id, status, ndaDocumentId: nda?.id })
    .returning();
  return { member, seat: row! };
}

beforeEach(async () => {
  ({ db } = await makeTestDb());
  c = await makeThesisChain(db);
  other = await makeThesisChain(db);
});

describe("thesisRelation and requireThesisRead (ERD §8)", () => {
  it("gives the Student, the Adviser and the Coordinator their relation", async () => {
    expect(await thesisRelation({ db, actor: actor(c.student) }, c.thesis.id)).toBe("student");
    expect(await thesisRelation({ db, actor: actor(c.adviser) }, c.thesis.id)).toBe("adviser");
    expect(await thesisRelation({ db, actor: actor(c.coordinator) }, c.thesis.id)).toBe("coordinator");
  });

  it("denies another Student and another Adviser", async () => {
    await expect(requireThesisRead({ db, actor: actor(other.student) }, c.thesis.id)).rejects.toThrow(
      AccessDeniedError,
    );
    await expect(requireThesisRead({ db, actor: actor(other.adviser) }, c.thesis.id)).rejects.toThrow(
      AccessDeniedError,
    );
  });

  it("gives a seated Panel Member read, and a declined seat nothing (AD-A-013)", async () => {
    const accepted = await seat("accepted");
    const proposed = await seat("proposed");
    const declined = await seat("declined");
    expect(await thesisRelation({ db, actor: actor(accepted.member) }, c.thesis.id)).toBe("panel_member");
    expect(await thesisRelation({ db, actor: actor(proposed.member) }, c.thesis.id)).toBe("panel_member");
    expect(await thesisRelation({ db, actor: actor(declined.member) }, c.thesis.id)).toBeNull();
  });

  it("gives a defense substitute read", async () => {
    const absent = await seat("accepted");
    const sub = await makeUser(db, "panel_member");
    const [attempt] = await db
      .insert(s.defenseAttempt)
      .values({ milestoneInstanceId: c.milestone.id, attemptNo: 1 })
      .returning();
    await db
      .insert(s.defenseSubstitute)
      .values({ defenseAttemptId: attempt!.id, absentMemberId: absent.seat.id, substituteUserId: sub.id });
    expect(await thesisRelation({ db, actor: actor(sub) }, c.thesis.id)).toBe("panel_member");
  });

  it("denies a deactivated account, even the Coordinator (FR-ACC-06)", async () => {
    await expect(requireThesisRead({ db, actor: actor(c.coordinator, false) }, c.thesis.id)).rejects.toThrow(
      AccessDeniedError,
    );
  });
});

describe("readableTheses (list filter)", () => {
  const ids = async (a: Actor) => (await readableTheses({ db, actor: a })).map((t) => t.id).sort();

  it("lists only own theses for each role, and all for the Coordinator", async () => {
    expect(await ids(actor(c.student))).toEqual([c.thesis.id]);
    expect(await ids(actor(other.adviser))).toEqual([other.thesis.id]);
    expect(await ids(actor(c.coordinator))).toEqual([c.thesis.id, other.thesis.id].sort());
    const { member } = await seat("accepted");
    const declined = await seat("declined");
    expect(await ids(actor(member))).toEqual([c.thesis.id]);
    expect(await ids(actor(declined.member))).toEqual([]);
  });

  it("lists nothing for a deactivated account", async () => {
    expect(await ids(actor(c.coordinator, false))).toEqual([]);
  });
});

describe("INV-24: manuscript read for Panel Members (BR-08)", () => {
  it("allows the Student, the Adviser and the Coordinator", async () => {
    for (const u of [c.student, c.adviser, c.coordinator]) {
      expect(await canReadManuscript({ db, actor: actor(u) }, c.thesis.id)).toEqual({ ok: true });
    }
  });

  it("refuses a member until the appointment form is verified", async () => {
    const { member } = await seat("accepted", { form: "locked_as_submitted", nda: "verified" });
    const res = await canReadManuscript({ db, actor: actor(member) }, c.thesis.id);
    expect(res).toMatchObject({ ok: false, code: "appointment_not_verified" });
    await expect(requireManuscriptRead({ db, actor: actor(member) }, c.thesis.id)).rejects.toThrow(
      AccessDeniedError,
    );
  });

  it("refuses a member until the member's own NDA is verified", async () => {
    const { member } = await seat("accepted", { form: "verified", nda: "scan_uploaded" });
    expect(await canReadManuscript({ db, actor: actor(member) }, c.thesis.id)).toMatchObject({
      ok: false,
      code: "nda_not_verified",
    });
  });

  it("allows a member with the verified form and NDA", async () => {
    const { member } = await seat("accepted", { form: "verified", nda: "verified" });
    expect(await canReadManuscript({ db, actor: actor(member) }, c.thesis.id)).toEqual({ ok: true });
    await expect(requireManuscriptRead({ db, actor: actor(member) }, c.thesis.id)).resolves.toBeUndefined();
  });

  it("refuses a substitute without its own verified NDA, and allows it with one", async () => {
    const absent = await seat("accepted", { form: "verified", nda: "verified" });
    const sub = await makeUser(db, "panel_member");
    const [attempt] = await db
      .insert(s.defenseAttempt)
      .values({ milestoneInstanceId: c.milestone.id, attemptNo: 1 })
      .returning();
    const [row] = await db
      .insert(s.defenseSubstitute)
      .values({ defenseAttemptId: attempt!.id, absentMemberId: absent.seat.id, substituteUserId: sub.id })
      .returning();
    expect(await canReadManuscript({ db, actor: actor(sub) }, c.thesis.id)).toMatchObject({
      ok: false,
      code: "nda_not_verified",
    });
    const nda = await doc("TDW_05", "verified", sub.id);
    await db.update(s.defenseSubstitute).set({ ndaDocumentId: nda.id }).where(eq(s.defenseSubstitute.id, row!.id));
    expect(await canReadManuscript({ db, actor: actor(sub) }, c.thesis.id)).toEqual({ ok: true });
  });

  it("refuses a user with no relation", async () => {
    expect(await canReadManuscript({ db, actor: actor(other.student) }, c.thesis.id)).toMatchObject({ ok: false });
  });
});
