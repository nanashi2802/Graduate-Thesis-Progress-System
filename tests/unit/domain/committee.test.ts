import { describe, expect, it } from "vitest";
import {
  activeSeats,
  checkAppointment,
  checkProposeSeat,
  checkSeatStatus,
  committeeKindFor,
  memberAccess,
  seatCount,
  type PanelSizes,
  type Seat,
} from "@/server/domain/committee";

const SIZES: PanelSizes = { masters: { proposal: 2, final: 3 }, doctoral: { proposal: 3, final: 4 } };
const ADVISER = "u-adviser";

const seat = (id: string, designation: Seat["designation"] = "none", status: Seat["status"] = "accepted"): Seat => ({
  memberUserId: id,
  designation,
  status,
});

const mastersM1: Seat[] = [seat("p1", "lead_panel_member"), seat("p2", "panel_chair")];

describe("committee kind and size (FR-CMT-01)", () => {
  it("appoints in Milestones 1 and 3 only", () => {
    expect(committeeKindFor("proposal")).toBe("evaluation_committee");
    expect(committeeKindFor("pre_final")).toBeNull();
    expect(committeeKindFor("final")).toBe("final_panel");
  });

  it("adds the Panel Chair seat to the Final size, which counts the members besides the Chair (FR §3)", () => {
    expect(seatCount(SIZES, "masters", "final")).toBe(4);
    expect(seatCount(SIZES, "doctoral", "proposal")).toBe(3);
  });

  it("reads the size for the degree level from the template", () => {
    expect(seatCount(SIZES, "masters", "proposal")).toBe(2);
    expect(seatCount(SIZES, "doctoral", "final")).toBe(5);
    expect(seatCount(SIZES, "doctoral", "pre_final")).toBeNull();
  });
});

describe("checkProposeSeat (BR-03, INV-03)", () => {
  const base = {
    actorRole: "coordinator",
    milestone: "proposal" as const,
    candidateRole: "panel_member",
    candidateUserId: "p3",
    adviserUserId: ADVISER,
    seats: mastersM1,
  };

  it("lets the Coordinator propose a Panel Member", () => {
    expect(checkProposeSeat(base)).toEqual({ ok: true });
  });

  it.each([
    [{ actorRole: "adviser" }, "wrong_actor"],
    [{ milestone: "pre_final" as const }, "no_appointment_in_milestone"],
    [{ candidateUserId: ADVISER, candidateRole: "adviser" }, "adviser_on_committee"],
    [{ candidateRole: "coordinator" }, "not_a_panel_member"],
    [{ candidateUserId: "p1" }, "duplicate_member"],
  ])("refuses %o with %s", (patch, code) => {
    const d = checkProposeSeat({ ...base, ...patch });
    expect(d).toMatchObject({ ok: false, code });
    if (!d.ok) expect(d.reason.length).toBeGreaterThan(0);
  });

  it("allows a declined member's user again only as a new row", () => {
    const seats = [seat("p1", "lead_panel_member", "declined")];
    expect(checkProposeSeat({ ...base, candidateUserId: "p1", seats })).toEqual({ ok: true });
  });
});

describe("checkSeatStatus (FR-CMT-03, ERD §7.2)", () => {
  it("moves proposed to accepted or declined, by the Coordinator", () => {
    expect(checkSeatStatus("coordinator", "proposed", "accepted")).toEqual({ ok: true });
    expect(checkSeatStatus("coordinator", "proposed", "declined")).toEqual({ ok: true });
  });

  it("never reopens a declined or accepted seat", () => {
    expect(checkSeatStatus("coordinator", "declined", "accepted")).toMatchObject({ code: "not_allowed" });
    expect(checkSeatStatus("coordinator", "accepted", "declined")).toMatchObject({ code: "not_allowed" });
    expect(checkSeatStatus("coordinator", "proposed", "proposed")).toMatchObject({ code: "not_allowed" });
  });

  it("refuses other roles", () => {
    expect(checkSeatStatus("panel_member", "proposed", "accepted")).toMatchObject({ code: "wrong_actor" });
  });
});

describe("checkAppointment (FR-CMT-01, FR-CMT-04)", () => {
  const base = {
    actorRole: "coordinator",
    milestone: "proposal" as const,
    level: "masters" as const,
    sizes: SIZES,
    adviserUserId: ADVISER,
    seats: mastersM1,
  };

  it("accepts a full committee with one Lead Panel Member and one Panel Chair", () => {
    expect(checkAppointment(base)).toEqual({ ok: true });
  });

  it("ignores a declined seat that has a replacement", () => {
    const seats = [seat("p9", "panel_chair", "declined"), ...mastersM1];
    expect(activeSeats(seats)).toHaveLength(2);
    expect(checkAppointment({ ...base, seats })).toEqual({ ok: true });
  });

  it.each([
    [{ actorRole: "adviser" }, "wrong_actor"],
    [{ milestone: "pre_final" as const }, "no_appointment_in_milestone"],
    [{ level: "doctoral" as const }, "wrong_size"],
    [{ seats: [seat("p1", "lead_panel_member"), seat("p2", "panel_chair", "proposed")] }, "seat_not_accepted"],
    [{ seats: [seat("p1", "lead_panel_member"), seat("p2", "panel_chair", "declined")] }, "wrong_size"],
    [{ seats: [seat("p1", "lead_panel_member"), seat("p2", "lead_panel_member")] }, "lead_count"],
    [{ seats: [seat("p1", "lead_panel_member"), seat("p2")] }, "chair_count"],
    [{ seats: [seat("p1", "lead_panel_member"), seat("p1", "panel_chair")] }, "duplicate_member"],
    [{ seats: [seat("p1", "lead_panel_member"), seat(ADVISER, "panel_chair")] }, "adviser_on_committee"],
  ])("refuses %o with %s", (patch, code) => {
    expect(checkAppointment({ ...base, ...patch })).toMatchObject({ ok: false, code });
  });

  it("needs five seats for a doctoral Final Panel (the Panel Chair plus 4)", () => {
    const four = [seat("p1", "lead_panel_member"), seat("p2", "panel_chair"), seat("p3"), seat("p4")];
    expect(checkAppointment({ ...base, level: "doctoral", milestone: "final", seats: four })).toMatchObject({
      ok: false,
      code: "wrong_size",
    });
    const five = [...four, seat("p5")];
    expect(checkAppointment({ ...base, level: "doctoral", milestone: "final", seats: five })).toEqual({ ok: true });
  });
});

describe("memberAccess (BR-08, BR-21, INV-24, INV-33)", () => {
  const open = { appointmentVerified: true, ndaVerified: true, accessEnded: false };

  it("opens the manuscript when the form and the member's NDA are verified", () => {
    expect(memberAccess({ kind: "seat", ...open })).toEqual({ ok: true });
  });

  it("keeps it closed without the form or the NDA", () => {
    expect(memberAccess({ kind: "seat", ...open, appointmentVerified: false })).toMatchObject({
      code: "appointment_not_verified",
    });
    expect(memberAccess({ kind: "seat", ...open, ndaVerified: false })).toMatchObject({ code: "nda_not_verified" });
  });

  it("gives a substitute access with its own NDA only (FR-CMT-06)", () => {
    expect(memberAccess({ kind: "substitute", ...open, appointmentVerified: false })).toEqual({ ok: true });
    expect(memberAccess({ kind: "substitute", ...open, ndaVerified: false })).toMatchObject({
      code: "nda_not_verified",
    });
  });

  it("ends access at the BR-21 event", () => {
    expect(memberAccess({ kind: "seat", ...open, accessEnded: true })).toMatchObject({ code: "access_ended" });
  });
});
