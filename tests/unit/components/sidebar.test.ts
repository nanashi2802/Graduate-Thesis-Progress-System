// Task R2.1 (DESIGN.md §5.1, design/screens/README.md Sidebars, SITEMAP §9, BR-18, UX-027, UX-028):
// each sidebar shows every item of the role. An item that is not open shows a lock glyph and its reason.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Sidebar } from "@/components/patterns/sidebar";
import { LOCKED, NO_FACTS, isActive, navFor, type NavFacts } from "@/components/patterns/sidebar/nav";

const M3: NavFacts = {
  ...NO_FACTS,
  milestone: 3,
  milestoneId: "m-3",
  prId: "pr-3",
  gate1bDone: true,
  defenseId: "d-3",
  sheetsVerified: true,
};
const labels = (role: Parameters<typeof navFor>[0], f: NavFacts = NO_FACTS, o?: Parameters<typeof navFor>[2]) =>
  navFor(role, f, o).map((i) => i.label);
const item = (role: Parameters<typeof navFor>[0], f: NavFacts, label: string) => navFor(role, f).find((i) => i.label === label)!;

describe("navFor (R2.1)", () => {
  it("gives the Student the README items in order, with Thesis process second (R4.6)", () => {
    expect(labels("student")).toEqual(["Dashboard", "Thesis process", "Manuscript", "Documents", "Schedule", "Defense results", "Clearance", "Submission"]);
  });

  it("keeps Thesis process open on every day, also before the thesis exists (PROCESS, G3)", () => {
    expect(item("student", NO_FACTS, "Thesis process")).toMatchObject({ href: "/student/process", glyph: "process", lockedReason: null });
    expect(item("student", M3, "Thesis process").href).toBe("/student/process");
  });

  it("locks Clearance before Milestone 3 with the SITEMAP reason", () => {
    expect(item("student", { ...NO_FACTS, milestone: 2 }, "Clearance")).toMatchObject({ href: null, lockedReason: "Opens at Milestone 3." });
    expect(item("student", M3, "Clearance")).toMatchObject({ href: "/student/clearance", lockedReason: null });
  });

  it("locks Submission until Gate 1b, then links the milestone", () => {
    expect(item("student", { ...M3, gate1bDone: false }, "Submission")).toMatchObject({ href: null, lockedReason: LOCKED.submission });
    expect(item("student", M3, "Submission").href).toBe("/student/submission/m-3");
  });

  it("links Defense results only after the sheets are verified", () => {
    expect(item("student", { ...M3, sheetsVerified: false }, "Defense results")).toMatchObject({
      href: null,
      lockedReason: "Opens when the Coordinator verifies the sheets.",
    });
    expect(item("student", M3, "Defense results").href).toBe("/student/defense/d-3");
  });

  it("links the Student manuscript to the PR workspace", () => {
    expect(item("student", M3, "Manuscript").href).toBe("/student/pr/pr-3");
    expect(item("student", NO_FACTS, "Manuscript").lockedReason).toBe(LOCKED.noThesis);
  });

  it("gives the Adviser the README items; Submission is left out by default (R2-b option A)", () => {
    expect(labels("adviser")).toEqual(["Advisees", "Review queue", "Consultations", "Availability", "Defense Day"]);
    expect(labels("adviser", NO_FACTS, { recordItems: "locked" })).toContain("Submission");
    expect(navFor("adviser", NO_FACTS, { recordItems: "locked" }).at(-1)).toMatchObject({ href: null, lockedReason: "Open it from a record." });
  });

  it("locks Defense Day until the scheduled start, and shows it open when the start is not known", () => {
    const f = { ...NO_FACTS, defenseId: "d-1" };
    expect(item("adviser", { ...f, defenseStarted: false }, "Defense Day")).toMatchObject({ href: null, lockedReason: "Opens at the scheduled start." });
    expect(item("adviser", { ...f, defenseStarted: true }, "Defense Day").href).toBe("/adviser/defense/d-1");
    expect(item("adviser", { ...f, defenseStarted: null }, "Defense Day").href).toBe("/adviser/defense/d-1");
  });

  it("gives the Panel Member the README items and locks the manuscript until the appointment and NDA", () => {
    expect(labels("panel_member")).toEqual(["Assignments", "Manuscript", "Availability", "Defense Day"]);
    const f = { ...NO_FACTS, prId: "pr-1" };
    expect(item("panel_member", { ...f, panelAccess: false }, "Manuscript")).toMatchObject({
      href: null,
      lockedReason: "Opens when your appointment and NDA are recorded.",
    });
    expect(item("panel_member", { ...f, panelAccess: true }, "Manuscript").href).toBe("/panel/pr/pr-1");
  });

  it("gives the Coordinator every routed item, none locked (Defense, Audit, Submission have no list route yet)", () => {
    const items = navFor("coordinator", NO_FACTS);
    expect(items.map((i) => i.label)).toEqual(["Overview", "Students", "Committees", "Documents", "Schedule", "Clearance", "Templates", "Users"]);
    expect(items.every((i) => i.lockedReason === null && i.href !== null)).toBe(true);
  });

  it("marks a route and its child routes active, never a hash link", () => {
    expect(isActive("/student/pr/x", "/student/pr/x")).toBe(true);
    expect(isActive("/coordinator/students", "/coordinator/students/abc")).toBe(true);
    expect(isActive("/adviser/dashboard#queue", "/adviser/dashboard")).toBe(false);
    expect(isActive("/student/schedule", "/student/schedule-x")).toBe(false);
  });
});

describe("Sidebar (R2.1)", () => {
  const html = renderToStaticMarkup(
    createElement(Sidebar, { items: navFor("student", { ...NO_FACTS, milestone: 2, milestoneId: "m-2", prId: "pr-2" }), activeHref: "/student/pr/pr-2", label: "Student menu" }),
  );

  it("names the navigation and marks the active item with aria-current", () => {
    expect(html).toMatch(/<nav aria-label="Student menu"/);
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).toMatch(/<a[^>]*href="\/student\/pr\/pr-2"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/student\/pr\/pr-2"/);
  });

  it("renders a locked item as a focusable span with aria-disabled and a linked reason (BR-18)", () => {
    const locked = html.match(/<span[^>]*aria-disabled="true"[^>]*>/g) ?? [];
    expect(locked).toHaveLength(3); // Defense results, Clearance, Submission
    for (const tag of locked) {
      expect(tag).toContain('tabindex="0"');
      const id = tag.match(/aria-describedby="([^"]+)"/)?.[1];
      expect(id).toBeTruthy();
      expect(html).toContain(`id="${id}"`);
    }
    expect(html).toContain("Opens at Milestone 3.");
    expect(html).not.toMatch(/<a[^>]*aria-disabled/);
  });

  it("gives each item a glyph and shows the lock glyph on locked items", () => {
    expect(html.match(/<svg/g)!.length).toBeGreaterThanOrEqual(7 + 3);
    expect(html).toMatch(/data-locked="true"/);
  });

  it("uses tokens only and a solid focus outline", () => {
    expect(html).not.toMatch(/\b(?:bg|text|border)-(?:maroon|gold|neutral)-\d/);
    expect(html).toContain("focus-visible:outline-solid");
  });

  it("has the brand look by default and the neutral look as option B (R2-a)", () => {
    expect(html).toMatch(/data-look="brand"/);
    const b = renderToStaticMarkup(createElement(Sidebar, { items: navFor("coordinator", NO_FACTS), activeHref: "/coordinator/dashboard", label: "Coordinator menu", look: "neutral" }));
    expect(b).toMatch(/data-look="neutral"/);
  });
});
