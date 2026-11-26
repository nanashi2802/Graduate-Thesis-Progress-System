// Task R3.2 (design/screens/C1.md region 1, UX-033, UX-D-16, decision R3-a): the KPI strip of C1.
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { KpiStrip, type KpiItem } from "@/components/patterns/kpi-strip";
import { LATE_POLICIES, isLate } from "@/components/patterns/kpi-strip/late";

const ITEMS: KpiItem[] = [
  { label: "All waiting", count: 9, oldestDays: 6, late: true, glyph: "overview", href: "?q=all", selected: true },
  { label: "Check scans", count: 4, oldestDays: 6, late: true, glyph: "scan", href: "?q=scans" },
  { label: "Confirm dates", count: 2, oldestDays: 3, late: false, glyph: "calendar", href: "?q=dates" },
  { label: "Appoint committees", count: 0, oldestDays: null, late: false, glyph: "seat", href: "?q=committees" },
];
const html = renderToStaticMarkup(createElement(KpiStrip, { items: ITEMS }));
const cell = (label: string) => html.match(new RegExp(`<a[^>]*aria-label="${label}[^"]*"[\\s\\S]*?</a>`))?.[0] ?? "";

describe("KPI strip (R3.2)", () => {
  it("shows the count in the KPI size, mono, with the age as 6d beside it", () => {
    expect(cell("Check scans")).toContain("text-(length:--kpi-num-size)");
    expect(cell("Check scans")).toContain("font-mono");
    expect(cell("Check scans")).toMatch(/>6d</);
  });

  it("marks a late age with the pending tone and a glyph, so color is not the only cue", () => {
    expect(cell("Check scans")).toContain("text-tone-pending-fg");
    expect(cell("Check scans")).toMatch(/data-late="true"/);
    expect(cell("Confirm dates")).not.toContain("text-tone-pending-fg");
  });

  it("mutes a count of 0 and shows no age", () => {
    const zero = cell("Appoint committees");
    expect(zero).toMatch(/data-zero="true"/);
    expect(zero).toContain("text-muted-foreground");
    expect(zero).not.toMatch(/>\d+d</);
  });

  it("makes each cell a link that filters the queue, with aria-current on the selected one", () => {
    expect(cell("All waiting")).toMatch(/aria-current="true"/);
    expect(cell("Check scans")).not.toMatch(/aria-current/);
    expect(cell("Check scans")).toMatch(/href="\?q=scans"/);
    expect(cell("Check scans")).toMatch(/aria-label="Check scans: 4 waiting, oldest 6 days, late"/);
  });

  it("keeps a fixed cell height and the 30 px glyph token (UX-D-16)", () => {
    const src = readFileSync("src/components/patterns/kpi-strip/index.tsx", "utf8");
    expect(src).toMatch(/h-\[104px\]/);
    expect(src).toContain("--kpi-glyph-size");
    expect(src).toMatch(/^\/\/ Source: /);
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(src).toContain("focus-visible:outline-solid");
  });
});

describe("late policy (decision R3-a)", () => {
  it("option C (recommended now): nothing is late until the owner sets targets", () => {
    expect(isLate("scans", 99, LATE_POLICIES.C)).toBe(false);
  });
  it("option A: one value, 5 days", () => {
    expect(isLate("scans", 5, LATE_POLICIES.A)).toBe(false);
    expect(isLate("dates", 6, LATE_POLICIES.A)).toBe(true);
  });
  it("option B: a value for each queue kind", () => {
    expect(isLate("scans", 4, LATE_POLICIES.B)).toBe(true);
    expect(isLate("committees", 7, LATE_POLICIES.B)).toBe(false);
    expect(isLate("committees", 8, LATE_POLICIES.B)).toBe(true);
  });
  it("an empty queue is never late", () => {
    expect(isLate("scans", null, LATE_POLICIES.A)).toBe(false);
  });
});
