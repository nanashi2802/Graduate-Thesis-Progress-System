// Task R1.6 (UX-D-10, UX-D-11): the brand-aligned token set, previewed in /lab under `.r1-preview`.
// R1.5 moves these values into src/styles/tokens.css. Same checks as tokens.test.ts and contrast.test.ts.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { block, contrast, declarations, resolve } from "../../support/css-tokens";

const css = readFileSync("src/app/lab/_mock/brand-preview.css", "utf8");
const LIGHT = ".r1-preview";
const DARK = ".r1-preview .dark";
const light = declarations(block(css, LIGHT));
const dark = declarations(block(css, DARK));

// Brand guide v1.0, Brand Colors and Supporting Colors: exact values (UX-D-11 item 1).
const BRAND: Record<string, string> = {
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
  "--radius-control": "6px",
  "--radius-card": "8px",
  "--radius-panel": "12px",
};

const SEMANTIC = [
  "--background", "--foreground", "--card", "--card-foreground", "--popover", "--popover-foreground",
  "--primary", "--primary-foreground", "--secondary", "--secondary-foreground", "--muted", "--muted-foreground",
  "--accent", "--accent-foreground", "--destructive", "--border", "--input", "--ring", "--link", "--text-secondary",
  "--divider-strong",
];
const TONES = ["neutral", "active", "pending", "done", "returned", "locked", "achieved"].flatMap((t) =>
  ["fg", "bg", "line"].map((p) => `--tone-${t}-${p}`),
);

describe("brand preview tokens (R1.6)", () => {
  it.each(Object.entries(BRAND))("light set gives %s the brand value %s", (name, value) => {
    expect(light.get(name)?.toUpperCase()).toBe(value.toUpperCase());
  });

  it.each([...SEMANTIC, ...TONES])("%s has a value in light and in dark", (name) => {
    expect(light.has(name)).toBe(true);
    expect(dark.has(name)).toBe(true);
  });

  it("keeps pending orange, not gold (UX-D-11: waiting must not read as achieved)", () => {
    expect(light.get("--tone-pending-fg")).not.toMatch(/F4B41A|8A5F00/i);
  });
});

const TEXT: [string, string][] = [
  ["--foreground", "--background"], ["--foreground", "--card"], ["--foreground", "--popover"],
  ["--text-secondary", "--card"], ["--muted-foreground", "--card"], ["--muted-foreground", "--background"],
  ["--primary-foreground", "--primary"], ["--secondary-foreground", "--secondary"], ["--accent-foreground", "--accent"],
  ["--link", "--background"], ["--link", "--card"], ["--destructive", "--card"],
  ["--wordmark", "--card"], ["--wordmark", "--background"],
  ...["neutral", "active", "pending", "done", "returned", "locked", "achieved"].map((t) => [`--tone-${t}-fg`, `--tone-${t}-bg`] as [string, string]),
];
const EDGE: [string, string][] = [["--input", "--card"], ["--ring", "--background"], ["--ring", "--card"]];

for (const [name, vars] of [["light", light], ["dark", dark]] as const) {
  // Dark falls back to the light set, then to the primitive ramps of the light set.
  const color = (v: string) => resolve(vars.get(v) ?? light.get(v) ?? `var(${v})`, vars, light);
  describe(`brand preview contrast in ${name}`, () => {
    it.each(TEXT)("%s on %s is 4.5:1 or more", (fg, bg) => {
      expect(contrast(color(fg), color(bg))).toBeGreaterThanOrEqual(4.5);
    });
    it.each(EDGE)("%s on %s is 3:1 or more", (fg, bg) => {
      expect(contrast(color(fg), color(bg))).toBeGreaterThanOrEqual(3);
    });
  });
}
