import { describe, expect, it } from "vitest";
import {
  EVENTS,
  OPTIONAL_EVENTS,
  buildNotificationEmail,
  isOptional,
  shouldEmail,
  type EventCode,
} from "@/server/notify/events";

const CODES = Object.keys(EVENTS) as EventCode[];

describe("event catalog (FR §4.10)", () => {
  it("has the 24 use cases of the email table", () => {
    expect(CODES).toHaveLength(24);
    for (const c of CODES) expect(EVENTS[c].code).toBe(c);
  });

  it("gives each event a fixed text and at least one recipient (FR-NTF-02)", () => {
    for (const c of CODES) {
      expect(EVENTS[c].event.length).toBeGreaterThan(0);
      expect(EVENTS[c].nextAction).toMatch(/\.$/);
      expect(EVENTS[c].recipients.length).toBeGreaterThan(0);
    }
  });

  it("puts no verdict, score, grade or meeting link word into any text (FR-NTF-03, BR-15)", () => {
    const banned = /verdict|approved|disapproved|score|grade|passed|failed|zoom|meet\.|http/i;
    for (const c of CODES) {
      expect(EVENTS[c].event).not.toMatch(banned);
      expect(EVENTS[c].nextAction).not.toMatch(banned);
    }
  });

  it("marks reminders and digests as FR §4.10 says", () => {
    const reminders = CODES.filter((c) => EVENTS[c].delivery === "reminder");
    const digests = CODES.filter((c) => EVENTS[c].delivery === "digest");
    expect(reminders).toEqual(["A4", "B1", "B2", "B6"]);
    expect(digests).toEqual(["B4", "B7", "C2", "C3", "C4", "C5"]);
  });
});

describe("preferences (FR-NTF-05, INV-29)", () => {
  it("lets a user turn off only reminders and digests", () => {
    expect([...OPTIONAL_EVENTS].sort()).toEqual(["A4", "B1", "B2", "B4", "B6", "B7", "C2", "C3", "C4", "C5"]);
    for (const c of OPTIONAL_EVENTS) expect(EVENTS[c].delivery).not.toBe("immediate");
  });

  it("always sends a required event, even when it is in the off list", () => {
    const off = new Set<EventCode>(["C6", "C2"]);
    expect(shouldEmail("C6", off)).toBe(true);
    expect(shouldEmail("C2", off)).toBe(false);
    expect(shouldEmail("C3", off)).toBe(true);
    expect(isOptional("E1")).toBe(false);
  });
});

describe("buildNotificationEmail (FR-NTF-03)", () => {
  it("holds the event, the next action, the deadline and the link only", () => {
    const msg = buildNotificationEmail("B3", "2027-01-12", "https://thesisko-tau.vercel.app/student/documents");
    expect(msg.text.split("\n")).toEqual([
      "Event: A document was returned",
      "Next action: Read the reason and upload a corrected scan.",
      "Deadline: 2027-01-12 (PST)",
      "Open the system: https://thesisko-tau.vercel.app/student/documents",
    ]);
  });

  it("never shows the results in the A6 email", () => {
    const msg = buildNotificationEmail("A6", null, "https://thesisko-tau.vercel.app/student/dashboard");
    expect(msg.text).toContain("Sign in to see the results.");
    expect(msg.text).toContain("Deadline: None");
  });
});
