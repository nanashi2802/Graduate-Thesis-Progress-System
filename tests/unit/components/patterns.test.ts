// Task R1.4 (DESIGN.md §5.2, §5.3, §8): the base patterns, with the Stage 1 fixes
// UX-008 (blocked primary), UX-015 (stamp width), UX-016 (labels), UX-021 (dates), UX-030 (identity line).
import { createElement as h } from "react";
import { renderToStaticMarkup as html } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BlockedAction } from "@/components/patterns/blocked-action";
import { Docket, NOTHING_BLOCKS } from "@/components/patterns/docket";
import { EmptyState } from "@/components/patterns/empty-state";
import { Flag } from "@/components/patterns/flag";
import { IdentityLine } from "@/components/patterns/identity-line";
import { DocumentStamp, formLabel, gateLabel, gateResultLabel } from "@/components/patterns/status";
import { Stepper } from "@/components/patterns/stepper";
import { formatPht, formatPhtDate, formatPhtRange } from "@/lib/date";
import { formCode, gateKind, gateResult } from "@/server/data/schema/enums";

describe("Docket", () => {
  const base = { step: 2 as const, milestone: "Pre-Final", status: "READY" as const, action: h("button", null, "Open the manuscript") };

  it("says where the user is: Step 2 of 4, the milestone and the status", () => {
    const out = html(h(Docket, { ...base, blocker: null }));
    expect(out).toContain("Step 2 of 4");
    expect(out).toContain("Pre-Final");
    expect(out).toContain("Ready for review");
  });

  it("shows the blocker, or says that nothing blocks", () => {
    expect(html(h(Docket, { ...base, blocker: "Your Adviser has open comments." }))).toContain("Your Adviser has open comments.");
    expect(html(h(Docket, { ...base, blocker: null }))).toContain(NOTHING_BLOCKS);
    expect(NOTHING_BLOCKS).toBe("Nothing blocks this step.");
  });

  it("shows the process link only when asked, and the form link when given", () => {
    expect(html(h(Docket, { ...base, blocker: null }))).not.toContain("See the whole process");
    const out = html(h(Docket, { ...base, blocker: null, processLink: true, formLink: { href: "/forms/tdw-07.pdf", label: "Download TDW 07" } }));
    expect(out).toContain("See the whole process");
    expect(out).toContain('href="/student/process"');
    expect(out).toContain("Download TDW 07");
  });
});

describe("IdentityLine", () => {
  it("shows a serif title and the degree level", () => {
    const out = html(h(IdentityLine, { title: "Fake thesis title", degreeLevel: "masters", adviser: "Fake Adviser" }));
    expect(out).toMatch(/class="[^"]*font-serif[^"]*"[^>]*>Fake thesis title</);
    expect(out).toContain("Master’s");
    expect(out).toContain("Fake Adviser");
    expect(html(h(IdentityLine, { title: "T", degreeLevel: "doctoral" }))).toContain("Doctoral");
  });

  it("shows only the title and the degree level on the Student's own screens", () => {
    const out = html(h(IdentityLine, { title: "T", degreeLevel: "masters", adviser: "Fake Adviser", committee: ["A", "B"], ownView: true }));
    expect(out).not.toContain("Fake Adviser");
    expect(out).not.toContain("Committee");
  });
});

describe("Flag (BR-17)", () => {
  it("is a note with the flag glyph and never disables anything", () => {
    const out = html(h(Flag, { children: "The residency period is short." }));
    expect(out).toContain('role="note"');
    expect(out).toContain("The residency period is short.");
    expect(out).not.toContain("aria-disabled");
  });

  it("keeps the text for screen readers in compact mode", () => {
    const out = html(h(Flag, { compact: true, children: "1 sheet is not saved yet." }));
    expect(out).toMatch(/class="sr-only"[^>]*>1 sheet is not saved yet\./);
    expect(out).toContain('tabindex="0"');
  });
});

describe("EmptyState", () => {
  it("has a title, a body and an action, and no image", () => {
    const out = html(h(EmptyState, { title: "No scans are waiting.", body: "New scans appear here.", action: h("a", { href: "#" }, "Add faculty") }));
    expect(out).toContain("No scans are waiting.");
    expect(out).toContain("New scans appear here.");
    expect(out).toContain("Add faculty");
    expect(out).not.toMatch(/<img|<svg/);
  });
});

describe("BlockedAction (BR-18, UX-008)", () => {
  it("keeps a blocked action in the tab order with its reason linked", () => {
    const out = html(h(BlockedAction, { reason: "Locked until Gate 1b.", children: "Propose this date" }));
    expect(out).toContain('aria-disabled="true"');
    expect(out).not.toMatch(/<button[^>]* disabled=""/);
    const id = /aria-describedby="([^"]+)"/.exec(out)?.[1];
    expect(id).toBeTruthy();
    expect(out).toContain(`id="${id}"`);
    expect(out).toContain("Locked until Gate 1b.");
  });

  it("never shows a blocked primary action with the maroon fill", () => {
    const blocked = html(h(BlockedAction, { reason: "Upload a commit first.", children: "Mark Ready" }));
    expect(blocked).not.toContain("bg-primary");
    const open = html(h(BlockedAction, { children: "Mark Ready" }));
    expect(open).toContain("bg-primary");
  });

  it("has no solid red fill for Return (F3)", () => {
    const out = html(h(BlockedAction, { variant: "return", children: "Return" }));
    expect(out).toContain("text-tone-returned-fg");
    expect(out).not.toMatch(/bg-(destructive|tone-returned-fg)\b/);
  });

  it("uses the row-action width in compact size and 48 px on Defense Day", () => {
    expect(html(h(BlockedAction, { size: "compact", variant: "secondary", children: "Check scan" }))).toContain("w-(--row-action-w)");
    expect(html(h(BlockedAction, { size: "defense", children: "Save my evaluation" }))).toContain("h-12");
  });
});

describe("DocumentStamp (UX-015)", () => {
  it("hugs its content and shows the form label, not the code", () => {
    const out = html(h(DocumentStamp, { form: "SIGNED_FINAL_MANUSCRIPT", state: "not_started" }));
    expect(out).toContain("w-fit");
    expect(out).toContain("Signed final manuscript");
    expect(out).not.toContain("SIGNED_FINAL_MANUSCRIPT");
  });
});

describe("Labels for codes (UX-016, G11)", () => {
  it.each(formCode.enumValues)("form %s has a label with no underscore", (code) => {
    expect(formLabel(code)).not.toMatch(/_/);
  });
  it.each(gateKind.enumValues)("gate kind %s has a label with no underscore", (kind) => {
    expect(gateLabel(kind)).not.toMatch(/_/);
  });
  it.each(gateResult.enumValues)("gate result %s has a label", (r) => {
    expect(gateResultLabel(r)).toMatch(/^[A-Z][a-z]+$/);
  });
  it("writes TDW numbers with a space", () => {
    expect(formLabel("TDW_03")).toBe("TDW 03");
    expect(gateLabel("gate_1b")).toBe("Gate 1b");
  });
});

describe("Stepper", () => {
  it("shows four steps with the current one marked", () => {
    const out = html(h(Stepper, { current: 3, completed: [1, 2] }));
    for (const s of ["Proposal", "Pre-Final", "Final", "Clearance"]) expect(out).toContain(s);
    expect(out.match(/aria-current="step"/g)).toHaveLength(1);
    expect(out).toContain("Final<span class=\"sr-only\">, current step");
  });
  it("uses maroon for completed steps and gold for the current step (brand sample, UX-D-11)", () => {
    const out = html(h(Stepper, { current: 3, completed: [1, 2] }));
    const node = (state: string) => new RegExp(`data-state="${state}"[\\s\\S]*?<span aria-hidden="true" class="([^"]*rounded-full[^"]*)"`).exec(out)![1]!;
    expect(node("completed")).toContain("bg-primary");
    expect(node("completed")).not.toMatch(/gold|achieved/);
    expect(node("current")).toContain("bg-progress");
    expect(node("current")).toContain("border-primary");
    expect(node("locked")).not.toMatch(/gold|achieved|progress/);
  });
  it("hides the labels visually in compact mode but keeps them for screen readers", () => {
    const out = html(h(Stepper, { current: 1, completed: [], compact: true }));
    expect(out).toMatch(/class="sr-only"[^>]*>Proposal/);
  });
});

describe("Dates in Philippine time (UX-021, NFR-11)", () => {
  const d = new Date("2027-01-12T01:00:00Z"); // 09:00 in Manila
  it("uses one format with PHT", () => {
    expect(formatPht(d)).toBe("Tue 12 Jan 2027, 09:00 PHT");
    expect(formatPhtDate(d)).toBe("Tue 12 Jan 2027");
  });
  it("writes a range on one day once", () => {
    expect(formatPhtRange(d, new Date("2027-01-12T02:00:00Z"))).toBe("Tue 12 Jan 2027, 09:00 to 10:00 PHT");
  });
  it("crosses midnight in Manila time, not UTC", () => {
    expect(formatPht(new Date("2027-01-11T16:30:00Z"))).toBe("Tue 12 Jan 2027, 00:30 PHT");
  });
});

describe("Caption floor (brand guide, Font Sizes: 12.8 px, UX-D-11)", () => {
  it("sets the blocked-action reason at 0.8 rem, not 12 px", () => {
    const out = html(h(BlockedAction, { reason: "Locked until Gate 1b.", children: "Propose this date" }));
    expect(out).toMatch(/id="[^"]+" class="[^"]*text-\[0\.8rem\]/);
    expect(out).not.toMatch(/id="[^"]+" class="[^"]*text-xs/);
  });
});
