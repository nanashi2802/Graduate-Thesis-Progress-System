// Task R6.4 (DESIGN.md §7.4 `verdict`, design/screens/P4.md, C6.md, FR-DEF-07, BR-17, BR-18, F2, F4, R6-b A, R6-c A):
// the verdict panel. A missing sheet is a flag and never blocks. Refresh every 30 s while mounted, a Refresh button,
// "Updated hh:mm". After the close, the recorded verdict shows as text with a `done` stamp.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { missingLine, REFRESH_MS, Verdict, type VerdictMember } from "@/components/patterns/verdict";

const members: VerdictMember[] = [
  { name: "Dr. Ana Reyes", designation: "Lead Panel Member", total: 86, actionTaken: "approved_with_revisions" },
  { name: "Engr. Ben Cruz", total: 79.5, actionTaken: "approved", differs: true },
  { name: "Dr. Carla Lim", total: null, actionTaken: null },
];
const base = { members, updatedAt: new Date("2027-01-26T06:05:00Z"), onRefresh: () => {}, onRecord: async () => {} };
const render = (extra: Record<string, unknown> = {}) => renderToStaticMarkup(createElement(Verdict, { ...base, canRecord: true, ...extra }));

describe("missingLine", () => {
  it("counts the sheets that are not saved", () => {
    expect(missingLine(1)).toBe("1 sheet is not saved yet.");
    expect(missingLine(2)).toBe("2 sheets are not saved yet.");
    expect(missingLine(0)).toBeNull();
  });
});

describe("verdict panel (R6.4)", () => {
  it("lists each member with the total as an ink number and the Action Taken, and no grade (F4)", () => {
    const html = render();
    expect(html).toContain("Dr. Ana Reyes");
    expect(html).toContain("Lead Panel Member");
    expect(html).toMatch(/data-slot="member-total"[^>]*>86</);
    expect(html).toMatch(/data-slot="member-total"[^>]*>79\.5</);
    expect(html).toContain("Approved with Revisions");
    for (const cell of html.match(/data-slot="member-total"[^>]*>/g)!) expect(cell).not.toMatch(/text-tone-|text-destructive|text-primary/);
    expect(html).not.toMatch(/\bgrade\b/i);
  });

  it("a member with no saved sheet gives the flag, and the record control stays enabled (F2, BR-17)", () => {
    const html = render();
    expect(html).toMatch(/role="note"[\s\S]*1 sheet is not saved yet\./);
    const record = html.match(/<button[^>]*>[^<]*(?:<[^>]+>[^<]*)*Record verdict/)![0];
    expect(record).not.toContain('aria-disabled="true"');
    expect(html).toMatch(/data-slot="member-total"[^>]*>Not saved</);
  });

  it("an Action Taken that differs from the verdict gets a flag on that row, and does not block", () => {
    const html = render();
    expect(html).toMatch(/Engr\. Ben Cruz[\s\S]*role="note"[\s\S]*differs from the recorded verdict/);
  });

  it("blocks the record control only with its reason (BR-18)", () => {
    const html = render({ canRecord: false, recordReason: "Allowed on or after the defense date." });
    expect(html).toMatch(/aria-disabled="true"[\s\S]*Record verdict/);
    expect(html).toContain("Allowed on or after the defense date.");
  });

  it("shows Updated hh:mm in PHT and a Refresh button (R6-c A)", () => {
    const html = render();
    expect(html).toContain("Updated 14:05 PHT");
    expect(html).toMatch(/<button[^>]*>[\s\S]*?Refresh<\/button>/);
  });

  it("refreshes every 30 s", () => {
    expect(REFRESH_MS).toBe(30_000);
  });

  it("closed: the recorded verdict as text with a done stamp, no control and no Refresh (R6-b A)", () => {
    const html = render({ closed: true, recorded: "approved_with_revisions" });
    expect(html).not.toMatch(/<select|<button/);
    expect(html).toMatch(/data-slot="verdict-stamp"[\s\S]*<svg[\s\S]*Approved with Revisions/);
  });

  it("refuses a blocked control with no reason (BR-18)", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render({ canRecord: false })).toThrow(/reason/);
  });
});
