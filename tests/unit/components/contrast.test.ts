// Task R1.1 (DESIGN.md §3, §10, UX-D-01): every text pair passes WCAG AA in light and in dark.
// Text needs 4.5:1. The input edge and the focus ring need 3:1 on the surface they sit on.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { block, contrast, declarations, resolve } from "../../support/css-tokens";

const css = readFileSync("src/styles/tokens.css", "utf8");
const primitives = declarations(css);

const TEXT: [string, string][] = [
  ["--foreground", "--background"],
  ["--foreground", "--card"],
  ["--foreground", "--popover"],
  ["--text-secondary", "--card"],
  ["--muted-foreground", "--card"],
  ["--muted-foreground", "--background"],
  ["--primary-foreground", "--primary"],
  ["--secondary-foreground", "--secondary"],
  ["--accent-foreground", "--accent"],
  ["--link", "--background"],
  ["--link", "--card"],
  ["--destructive", "--card"],
  ["--wordmark", "--card"],
  ["--wordmark", "--background"],
  ...["neutral", "active", "pending", "done", "returned", "locked", "achieved"].map(
    (t) => [`--tone-${t}-fg`, `--tone-${t}-bg`] as [string, string],
  ),
];
const EDGE: [string, string][] = [
  ["--input", "--card"],
  ["--ring", "--background"],
  ["--ring", "--card"],
];

for (const theme of [":root", ".dark"] as const) {
  const vars = declarations(block(css, theme));
  // Dark inherits nothing it does not set; light falls back to the primitive ramps.
  const color = (name: string) => resolve(vars.get(name) ?? `var(${name})`, vars, primitives);
  describe(`contrast in ${theme === ":root" ? "light" : "dark"}`, () => {
    it.each(TEXT)("%s on %s is 4.5:1 or more", (fg, bg) => {
      expect(contrast(color(fg), color(bg))).toBeGreaterThanOrEqual(4.5);
    });
    it.each(EDGE)("%s on %s is 3:1 or more", (fg, bg) => {
      expect(contrast(color(fg), color(bg))).toBeGreaterThanOrEqual(3);
    });
  });
}
