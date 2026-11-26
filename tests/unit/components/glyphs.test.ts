// Task R1.3 (DESIGN.md §6.2) and R1.6 (brand guide, Icons; UX-D-11 item 4): the domain glyph set.
// 24 × 24 grid, 1.75 px stroke, round caps and joins, `currentColor`, outline only (no fill, no two-tone).
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Glyph, GLYPH_NAMES, type GlyphName } from "@/components/patterns/glyphs";

const EXPECTED: GlyphName[] = [
  "scan", "verify", "flag", "return", "seat", "calendar", "defense", "gate", "commit", "clear", "template",
  "overview", "student", "users", "audit", "export", "search", "bell", "done", "todo", "lock", "received",
  // UX-P-02 feedback, 26 Nov 2026: D-06 status glyphs (B, B, pending A) and D-07 sidebar glyphs (A, Availability B).
  "active", "pending", "achieved",
  "process", "manuscript", "schedule", "results", "submission", "advisees", "queue", "consult", "availability", "assignments",
];

const svg = (name: GlyphName, props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(createElement(Glyph, { name, ...props }));

describe("Glyph set (R1.3)", () => {
  it("holds exactly the 35 approved glyphs", () => {
    expect([...GLYPH_NAMES].sort()).toEqual([...EXPECTED].sort());
  });

  it.each(EXPECTED)("%s follows the grid and stroke rules", (name) => {
    const html = svg(name);
    expect(html).toContain('viewBox="0 0 24 24"');
    expect(html).toContain('stroke="currentColor"');
    expect(html).toContain('stroke-width="1.75"');
    expect(html).toContain('stroke-linecap="round"');
    expect(html).toContain('stroke-linejoin="round"');
    expect(html).toMatch(/^<svg[^>]*fill="none"/);
    // Outline only: no element inside the svg has a fill or a tone class.
    const inner = [...html.matchAll(/<(\w+)([^>]*)>/g)].slice(1);
    for (const m of inner) expect(m[2]).not.toMatch(/ fill="|class="tone"|fill-opacity/);
  });

  it("is hidden from screen readers without a label", () => {
    const html = svg("lock");
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("role=");
  });

  it("is an image with a name when it has a label", () => {
    const html = svg("lock", { label: "Locked" });
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Locked"');
    expect(html).not.toContain("aria-hidden");
  });

  it.each([16, 20, 30] as const)("renders at %i px", (size) => {
    const html = svg("gate", { size });
    expect(html).toContain(`width="${size}"`);
    expect(html).toContain(`height="${size}"`);
  });

  it("defaults to 16 px, the size in text", () => {
    expect(svg("gate")).toContain('width="16"');
  });
});
