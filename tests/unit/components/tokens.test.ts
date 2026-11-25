// Task R1.1 (DESIGN.md §7.1, §12, UX-D-01): one token file holds every raw color and size, for light and dark.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { block, declarations } from "../../support/css-tokens";

const tokens = readFileSync("src/styles/tokens.css", "utf8");
const globals = readFileSync("src/app/globals.css", "utf8");

const EXACT: Record<string, string> = {
  "--color-maroon-600": "#800000",
  "--color-gold-400": "#F4C430",
  "--tone-returned-fg": "#B3261E",
  "--row-h-comfortable": "56px",
  "--row-h-compact": "48px",
  "--cell-pad-x": "16px",
  "--row-action-w": "132px",
  "--row-action-h": "32px",
  "--kpi-num-size": "36px",
  "--kpi-glyph-size": "30px",
  "--glyph-stroke": "1.5",
  "--glyph-tone-opacity": "0.16",
  "--sidebar-w": "240px",
  "--topbar-h": "56px",
  "--target-tablet": "44px",
  "--target-defense": "48px",
  "--radius-card": "6px",
};

const SEMANTIC = [
  "--background", "--foreground", "--card", "--card-foreground", "--popover", "--popover-foreground",
  "--primary", "--primary-foreground", "--secondary", "--secondary-foreground", "--muted", "--muted-foreground",
  "--accent", "--accent-foreground", "--destructive", "--border", "--input", "--ring", "--link", "--text-secondary",
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
