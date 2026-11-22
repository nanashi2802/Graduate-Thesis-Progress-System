import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  DocumentStamp,
  MilestoneStatusPill,
  OutsideChip,
  StatusPill,
  documentStateView,
  milestoneStatusView,
  outsideStatusView,
  type DocumentState,
  type Tone,
} from "@/components/status";
import type { MilestoneStatus } from "@/server/domain/milestone";

const ALL_STATUSES: MilestoneStatus[] = [
  "DRAFT", "READY", "ADVISER_ENDORSED", "COMMITTEE_APPOINTED", "COMMITTEE_ENDORSED",
  "DATE_PROPOSED", "DEFENSE_SCHEDULED", "DEFENSE_HELD", "CLOSED", "RETURNED",
  "CERTIFIED", "FINAL_APPROVED", "CLEARED",
];

const ALL_TONES: Tone[] = ["neutral", "active", "pending", "done", "returned", "locked", "achieved"];

describe("milestoneStatusView (DESIGN.md §3.4)", () => {
  it("gives a label and a tone to each status, never the enum", () => {
    for (const s of ALL_STATUSES) {
      const v = milestoneStatusView(s);
      expect(v.label).not.toBe(s);
      expect(v.label.length).toBeGreaterThan(0);
      expect(ALL_TONES).toContain(v.tone);
    }
  });

  it("uses gold (achieved) only for the three milestone achievements", () => {
    const achieved = ALL_STATUSES.filter((s) => milestoneStatusView(s).tone === "achieved");
    expect(achieved.sort()).toEqual(["CERTIFIED", "CLEARED", "FINAL_APPROVED"]);
  });

  it("names the Final Panel in the Final milestone", () => {
    expect(milestoneStatusView("COMMITTEE_APPOINTED", "proposal").label).toBe("Committee appointed");
    expect(milestoneStatusView("COMMITTEE_APPOINTED", "final").label).toBe("Panel appointed");
  });

  it("shows a locked manuscript at Gate 1b (BR-07) and Returned as returned", () => {
    expect(milestoneStatusView("COMMITTEE_ENDORSED").tone).toBe("locked");
    expect(milestoneStatusView("RETURNED").tone).toBe("returned");
  });
});

describe("documentStateView and outsideStatusView", () => {
  it("shows a Mismatch as a flag (pending), not as a block (BR-17)", () => {
    expect(documentStateView("mismatch").tone).toBe("pending");
  });

  it("maps outside values as DESIGN.md §3.4 says", () => {
    expect(outsideStatusView("ipmo", "UNDER_CHECK").tone).toBe("pending");
    expect(outsideStatusView("ethics", "CHANGES_REQUIRED").tone).toBe("returned");
    expect(outsideStatusView("rpo", "DONE").tone).toBe("done");
    expect(outsideStatusView("copyright", "NOT_APPLIED")).toMatchObject({ tone: "neutral", kindLabel: "Copyright" });
  });
});

describe("status shapes (DESIGN.md §7.1)", () => {
  it("renders an icon and a text label in each pill (WCAG 1.4.1)", () => {
    for (const tone of ALL_TONES) {
      const html = renderToStaticMarkup(createElement(StatusPill, { tone, label: "Label" }));
      expect(html).toContain(`data-tone="${tone}"`);
      expect(html).toContain(`data-tone-icon="${tone}"`);
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain(">Label</span>");
    }
  });

  it("renders the milestone label in the pill", () => {
    const html = renderToStaticMarkup(createElement(MilestoneStatusPill, { status: "READY" }));
    expect(html).toContain("Ready for review");
  });

  it("renders the form number in mono and the state in the stamp", () => {
    const state: DocumentState = "verified";
    const html = renderToStaticMarkup(createElement(DocumentStamp, { form: "TDW 07", state }));
    expect(html).toMatch(/font-mono[^>]*>TDW 07</);
    expect(html).toContain("Verified");
  });

  it("renders the outside chip with a dashed border", () => {
    const html = renderToStaticMarkup(createElement(OutsideChip, { kind: "ipmo", value: "PASSED" }));
    expect(html).toContain("border-dashed");
    expect(html).toContain("IPMO");
    expect(html).toContain("Passed");
  });
});
