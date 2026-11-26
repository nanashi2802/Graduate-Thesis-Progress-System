// Tasks R1.1 and R1.5 (DESIGN.md §7.1, §12, UX-D-01, UX-D-11): one token file holds every raw color and size,
// for light and dark. The values come from the brand guide v1.0, approved in preview round UX-P-01.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { block, declarations } from "../../support/css-tokens";

const tokens = readFileSync("src/styles/tokens.css", "utf8");
const globals = readFileSync("src/app/globals.css", "utf8");

const EXACT: Record<string, string> = {
  // Brand guide v1.0, Brand Colors and Supporting Colors (UX-D-11 item 1).
  "--color-maroon-500": "#800000",
  "--color-maroon-700": "#5C0B0F",
  "--color-gold-500": "#F4B41A",
  "--color-gold-700": "#8A5F00",
  "--color-neutral-900": "#0F172A",
  "--color-neutral-600": "#475569",
  "--color-neutral-200": "#E2E8F0",
  "--color-neutral-50": "#F8FAFC",
  "--primary": "var(--color-maroon-500)",
  "--background": "var(--color-neutral-50)",
  "--card": "#FFFFFF",
  "--foreground": "var(--color-neutral-900)",
  "--muted-foreground": "var(--color-neutral-600)",
  "--border": "var(--color-neutral-200)",
  "--tone-done-fg": "#15803D",
  "--tone-returned-fg": "#B91C1C",
  "--tone-achieved-bg": "#F4B41A",
  // Shapes and Buttons: 6 px controls, 8 px cards, 12 px panels (UX-D-11 item 5).
  "--radius-control": "6px",
  "--radius-panel": "12px",
  "--radius": "6px",
  "--row-h-comfortable": "56px",
  "--row-h-compact": "48px",
  "--cell-pad-x": "16px",
  "--row-action-w": "132px",
  "--row-action-h": "32px",
  "--kpi-num-size": "36px",
  "--kpi-glyph-size": "30px",
  "--glyph-stroke": "1.75",
  "--sidebar-w": "240px",
  "--topbar-h": "56px",
  "--target-tablet": "44px",
  "--target-defense": "48px",
  "--radius-card": "8px",
  // D-10 option A (owner, UX-P-02, 26 Nov 2026).
  "--motion-state": "120ms",
  "--motion-overlay": "160ms",
  "--motion-drawer": "280ms",
  "--motion-toast": "160ms",
  "--ease-drawer": "cubic-bezier(0.32, 0.72, 0, 1)",
  "--motion-pulse": "1.6s",
};

const SEMANTIC = [
  "--background", "--foreground", "--card", "--card-foreground", "--popover", "--popover-foreground",
  "--primary", "--primary-foreground", "--secondary", "--secondary-foreground", "--muted", "--muted-foreground",
  "--accent", "--accent-foreground", "--destructive", "--border", "--input", "--ring", "--link", "--text-secondary",
  "--divider-strong", "--progress", "--wordmark",
];
const TONES = ["neutral", "active", "pending", "done", "returned", "locked", "achieved"].flatMap((t) =>
  ["fg", "bg", "line"].map((p) => `--tone-${t}-${p}`),
);

describe("tokens.css (R1.1)", () => {
  // The light set wins over the dark set for the exact-value checks.
  const all = new Map([...declarations(tokens), ...declarations(block(tokens, ":root"))]);

  it.each(Object.entries(EXACT))("defines %s as %s", (name, value) => {
    expect(all.get(name)?.toUpperCase()).toBe(value.toUpperCase());
  });

  it.each([...SEMANTIC, ...TONES])("gives %s a value in light (:root) and in dark (.dark)", (name) => {
    expect(declarations(block(tokens, ":root")).has(name)).toBe(true);
    expect(declarations(block(tokens, ".dark")).has(name)).toBe(true);
  });

  it("keeps pending orange, not gold (UX-D-11: waiting must not read as achieved)", () => {
    expect(all.get("--tone-pending-fg")).not.toMatch(/F4B41A|8A5F00/i);
  });

  it("drops the glyph tone fill (R1.6: outline glyphs only)", () => {
    expect(tokens).not.toContain("--glyph-tone-opacity");
  });

  it("keeps the old status class names (text-tone-done-fg …) mapped to the theme-aware tokens", () => {
    for (const name of TONES) expect(all.get(`--color${name.slice(1)}`)).toBe(`var(${name})`);
  });
});

describe("globals.css (R1.1)", () => {
  it("imports the token file", () => {
    expect(globals).toMatch(/@import\s+"\.\.\/styles\/tokens\.css"/);
  });

  it("holds no raw color", () => {
    expect(globals).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(globals).not.toMatch(/oklch\(/);
  });

  it("drops the old shadcn dark block and the out-of-date comment", () => {
    expect(globals).not.toMatch(/^\.dark\s*\{/m);
    expect(globals).not.toContain("still [CONFIRM]");
  });

  it("lets the dark class on <html> drive the dark variant", () => {
    expect(globals).toContain("@custom-variant dark (&:where(.dark, .dark *));");
  });
});
