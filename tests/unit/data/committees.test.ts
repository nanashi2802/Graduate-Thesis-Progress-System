// P1-E05-T02: appointment board data and actions (FR-CMT-01 to 04, NFR-01, NFR-03, AD-B-018).
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { AccessDeniedError, type Actor } from "@/server/data/access";
import {
  advanceMilestone,
  appointmentBoard,
  linkAppointmentForm,
  linkNda,
  markAppointed,
  proposeSeat,
  recordSeatAnswer,
} from "@/server/data/committees";
import type { Db } from "@/server/data/db";
import * as s from "@/server/data/schema";
import type { Designation } from "@/server/domain/milestone";
import { seedMilestone1 } from "../../support/seed-m1";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let seed: Awaited<ReturnType<typeof seedMilestone1>>;
let coord: Actor;

const actorOf = (u: { id: string; role: s.UserRole }): Actor => ({ userId: u.id, role: u.role, isActive: true });

async function setStatus(status: (typeof s.milestoneStatus.enumValues)[number]) {
  await db.update(s.milestoneInstance).set({ status }).where(eq(s.milestoneInstance.id, seed.milestone.id));
}

async function doc(formCode: (typeof s.formCode.enumValues)[number], subjectUserId: string | null = null) {
  const [row] = await db
    .insert(s.documentRecord)
    .values({ milestoneInstanceId: seed.milestone.id, formCode, subjectUserId })
    .returning();
  return row!;
}

beforeEach(async () => {
  ({ db } = await makeTestDb());
  seed = await seedMilestone1(db);
  coord = actorOf(seed.coordinator);
  await setStatus("ADVISER_ENDORSED"); // Gate 1a done (FR-CMT-01)
});

const ctx = () => ({ db, actor: coord });
const propose = (memberUserId: string, designation: Designation = "none") =>
  proposeSeat(ctx(), { thesisId: seed.thesis.id, milestone: "proposal", memberUserId, designation });

async function fullCommittee() {
  const [p1, p2] = seed.panel;
  const a = await propose(p1!.id, "lead_panel_member");
  const b = await propose(p2!.id, "panel_chair");
  if (!a.ok || !b.ok) throw new Error("setup");
  for (const seat of [a.value, b.value]) await recordSeatAnswer(ctx(), { seatId: seat.id, status: "accepted" });
  return { lead: a.value, chair: b.value, committeeId: a.value.committeeId };
}

describe("proposeSeat (FR-CMT-01, FR-CMT-03)", () => {
  it("makes the Evaluation Committee on the first seat and writes an audit record (NFR-03)", async () => {
    const res = await propose(seed.panel[0]!.id, "lead_panel_member");
    expect(res.ok).toBe(true);
    const [c] = await db.select().from(s.committee);
    expect(c).toMatchObject({ thesisInstanceId: seed.thesis.id, kind: "evaluation_committee" });
    const audit = await db.select().from(s.auditRecord);
    expect(audit.map((a) => a.action)).toEqual(["committee_member.propose"]);
  });

  it("refuses the Adviser and a non-Panel Member, with a reason (BR-03, BR-18)", async () => {
    expect(await propose(seed.adviser.id)).toMatchObject({ ok: false, code: "adviser_on_committee" });
    const res = await propose(seed.student.id);
    expect(res).toMatchObject({ ok: false, code: "not_a_panel_member" });
    expect(res.ok === false && res.reason.length > 0).toBe(true);
  });

  it("refuses a second active seat for one member", async () => {
    await propose(seed.panel[0]!.id);
    expect(await propose(seed.panel[0]!.id)).toMatchObject({ ok: false, code: "duplicate_member" });
  });

  it("is allowed only after Gate 1a", async () => {
    await setStatus("READY");
    expect(await propose(seed.panel[0]!.id)).toMatchObject({ ok: false, code: "before_gate_1a" });
  });

  it("refuses Milestone 2, which has no appointment", async () => {
    const res = await proposeSeat(ctx(), {
      thesisId: seed.thesis.id,
      milestone: "pre_final",
      memberUserId: seed.panel[0]!.id,
      designation: "none",
    });
    expect(res).toMatchObject({ ok: false, code: "no_appointment_in_milestone" });
  });

  it("lets only the Coordinator write (NFR-01)", async () => {
    for (const u of [seed.adviser, seed.student, seed.panel[0]!]) {
      await expect(
        proposeSeat({ db, actor: actorOf(u) }, {
          thesisId: seed.thesis.id,
          milestone: "proposal",
          memberUserId: seed.panel[1]!.id,
          designation: "none",
        }),
      ).rejects.toThrow(AccessDeniedError);
    }
    await expect(
      proposeSeat({ db, actor: { ...coord, isActive: false } }, {
        thesisId: seed.thesis.id,
        milestone: "proposal",
        memberUserId: seed.panel[1]!.id,
        designation: "none",
      }),
    ).rejects.toThrow(AccessDeniedError);
  });
});

describe("recordSeatAnswer (FR-CMT-03, AD-B-011)", () => {
  it("records Accepted or Declined once", async () => {
    const res = await propose(seed.panel[0]!.id);
    if (!res.ok) throw new Error("setup");
    expect(await recordSeatAnswer(ctx(), { seatId: res.value.id, status: "declined" })).toMatchObject({ ok: true });
    expect(await recordSeatAnswer(ctx(), { seatId: res.value.id, status: "accepted" })).toMatchObject({
      ok: false,
      code: "not_allowed",
    });
  });

  it("lets a declined member get a new seat (ERD §7.2)", async () => {
    const res = await propose(seed.panel[0]!.id);
    if (!res.ok) throw new Error("setup");
    await recordSeatAnswer(ctx(), { seatId: res.value.id, status: "declined" });
    expect((await propose(seed.panel[0]!.id)).ok).toBe(true);
  });
});

describe("paper and markAppointed (FR-CMT-04)", () => {
  it("links TDW 06 and each NDA, then marks the committee and its seats Appointed", async () => {
    const { lead, chair, committeeId } = await fullCommittee();
    const form = await doc("TDW_06");
    expect(await linkAppointmentForm(ctx(), { committeeId, documentId: form.id })).toEqual({ ok: true, value: null });
    for (const seat of [lead, chair]) {
      const nda = await doc("TDW_05", seat.memberUserId);
      expect(await linkNda(ctx(), { seatId: seat.id, documentId: nda.id })).toEqual({ ok: true, value: null });
    }
    expect(await markAppointed(ctx(), { committeeId })).toEqual({ ok: true, value: null });
    const [c] = await db.select().from(s.committee);
    expect(c!.appointedAt).not.toBeNull();
    const seats = await db.select().from(s.committeeMember);
    expect(seats.every((m) => m.appointedAt !== null)).toBe(true);
  });

  it("refuses the wrong form, and an NDA of another member", async () => {
    const { lead, committeeId } = await fullCommittee();
    expect(await linkAppointmentForm(ctx(), { committeeId, documentId: (await doc("TDW_11")).id })).toMatchObject({
      ok: false,
      code: "wrong_document",
    });
    const otherNda = await doc("TDW_05", seed.panel[4]!.id);
    expect(await linkNda(ctx(), { seatId: lead.id, documentId: otherNda.id })).toMatchObject({
      ok: false,
      code: "wrong_document",
    });
  });

  it("refuses Appointed without the form, an NDA, or the right seats", async () => {
    const { lead, chair, committeeId } = await fullCommittee();
    expect(await markAppointed(ctx(), { committeeId })).toMatchObject({ ok: false, code: "appointment_not_linked" });
    await linkAppointmentForm(ctx(), { committeeId, documentId: (await doc("TDW_06")).id });
    await linkNda(ctx(), { seatId: lead.id, documentId: (await doc("TDW_05", lead.memberUserId)).id });
    expect(await markAppointed(ctx(), { committeeId })).toMatchObject({ ok: false, code: "nda_not_linked" });
    await linkNda(ctx(), { seatId: chair.id, documentId: (await doc("TDW_05", chair.memberUserId)).id });
    const extra = await propose(seed.panel[2]!.id);
    if (!extra.ok) throw new Error("setup");
    expect(await markAppointed(ctx(), { committeeId })).toMatchObject({ ok: false, code: "wrong_size" });
  });
});

describe("advanceMilestone (FR-CMT-04, BR-08, AD-B-021)", () => {
  async function appointedWithPaper() {
    const { lead, chair, committeeId } = await fullCommittee();
    const form = await doc("TDW_06");
    const n1 = await doc("TDW_05", lead.memberUserId);
    const n2 = await doc("TDW_05", chair.memberUserId);
    await linkAppointmentForm(ctx(), { committeeId, documentId: form.id });
    await linkNda(ctx(), { seatId: lead.id, documentId: n1.id });
    await linkNda(ctx(), { seatId: chair.id, documentId: n2.id });
    expect(await markAppointed(ctx(), { committeeId })).toEqual({ ok: true, value: null });
    return { committeeId, paper: [form.id, n1.id, n2.id] };
  }

  it("keeps the appointment but refuses the move until the paper is verified, with a reason (BR-18)", async () => {
    const { committeeId } = await appointedWithPaper();
    const res = await advanceMilestone(ctx(), { committeeId });
    expect(res.ok).toBe(false);
    const board = (await appointmentBoard(ctx(), seed.thesis.id)).committees[0]!;
    expect(board.appointed).toBe(true);
    expect(board.milestoneAdvanced).toBe(false);
    expect(board.advanceBlockedReason).toBe(res.ok ? null : res.reason);
    const [m] = await db.select().from(s.milestoneInstance);
    expect(m!.status).toBe("ADVISER_ENDORSED");
  });

  it("moves the milestone to COMMITTEE_APPOINTED after the paper is verified", async () => {
    const { committeeId, paper } = await appointedWithPaper();
    for (const id of paper) await db.update(s.documentRecord).set({ state: "verified" }).where(eq(s.documentRecord.id, id));
    const board = (await appointmentBoard(ctx(), seed.thesis.id)).committees[0]!;
    expect(board.advanceBlockedReason).toBeNull();
    expect(await advanceMilestone(ctx(), { committeeId })).toEqual({ ok: true, value: null });
    const [m] = await db.select().from(s.milestoneInstance);
    expect(m!.status).toBe("COMMITTEE_APPOINTED");
    expect((await appointmentBoard(ctx(), seed.thesis.id)).committees[0]!.milestoneAdvanced).toBe(true);
  });

  it("refuses before the committee is Appointed, and for a non-Coordinator (NFR-01)", async () => {
    const { committeeId } = await fullCommittee();
    expect(await advanceMilestone(ctx(), { committeeId })).toMatchObject({ ok: false, reason: "Mark the committee Appointed first." });
    await expect(advanceMilestone({ db, actor: actorOf(seed.adviser) }, { committeeId })).rejects.toThrow(AccessDeniedError);
  });
});

describe("appointmentBoard (FR-CMT-02)", () => {
  it("shows the seats, and the workload and free defense slots of each Panel Member", async () => {
    await fullCommittee();
    await db.insert(s.slot).values({
      ownerUserId: seed.panel[0]!.id,
      slotType: "defense",
      mode: "in_person",
      startsAt: new Date(Date.now() + 86_400_000),
      endsAt: new Date(Date.now() + 90_000_000),
    });
    const board = await appointmentBoard(ctx(), seed.thesis.id);
    expect(board.committees).toHaveLength(1);
    expect(board.committees[0]!.seats.map((x) => x.designation).sort()).toEqual(["lead_panel_member", "panel_chair"]);
    const p1 = board.pool.find((p) => p.userId === seed.panel[0]!.id)!;
    expect(p1).toMatchObject({ activeSeats: 1, freeDefenseSlots: 1 });
    expect(board.pool.find((p) => p.userId === seed.panel[4]!.id)).toMatchObject({ activeSeats: 0, freeDefenseSlots: 0 });
    expect(board.pool.some((p) => p.userId === seed.adviser.id)).toBe(false);
  });

  it("gives the reason why Appointed is blocked, from the same check as the action (BR-18)", async () => {
    const { committeeId } = await fullCommittee();
    const before = (await appointmentBoard(ctx(), seed.thesis.id)).committees[0]!;
    expect(before.appointBlockedReason).toBe("Upload the appointment form first.");
    expect(before.milestoneId).toBe(seed.milestone.id);
    expect(await markAppointed(ctx(), { committeeId })).toMatchObject({ ok: false, reason: before.appointBlockedReason });
  });

  it("is for the Coordinator only (NFR-01)", async () => {
    await expect(appointmentBoard({ db, actor: actorOf(seed.adviser) }, seed.thesis.id)).rejects.toThrow(AccessDeniedError);
  });
});

describe("E3 committee changed (FR-NTF-01, INV-30)", () => {
  it("notifies the Student after a proposal and an answer, never the Coordinator", async () => {
    const a = await propose(seed.panel[0]!.id, "lead_panel_member");
    if (!a.ok) throw new Error("setup");
    await recordSeatAnswer(ctx(), { seatId: a.value.id, status: "accepted" });
    const got = await db.select().from(s.notification).where(eq(s.notification.eventCode, "E3"));
    expect(got).toHaveLength(2);
    expect(got.every((r) => r.recipientUserId === seed.student.id)).toBe(true);
  });
});
