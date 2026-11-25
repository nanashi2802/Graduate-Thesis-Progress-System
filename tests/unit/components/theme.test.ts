// Task R1.2 (UX-D-01, DESIGN.md §7.3): the OS setting is the default, a stored choice overrides it,
// and an inline script sets the theme before the first paint.
import { runInNewContext } from "node:vm";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ThemeToggle } from "@/components/patterns/theme-toggle";
import { resolveTheme, THEME_KEY, THEME_SCRIPT, type ThemeChoice } from "@/lib/theme";

describe("resolveTheme", () => {
  it.each<[ThemeChoice | null, boolean, "light" | "dark"]>([
    ["light", false, "light"],
    ["light", true, "light"],
    ["dark", false, "dark"],
    ["dark", true, "dark"],
    ["system", false, "light"],
    ["system", true, "dark"],
    [null, true, "dark"],
    [null, false, "light"],
  ])("choice %s with OS dark %s gives %s", (choice, prefersDark, expected) => {
    expect(resolveTheme(choice, prefersDark)).toBe(expected);
  });
});

function runScript(stored: string | null, prefersDark: boolean, storageThrows = false) {
  const classes = new Set<string>();
  const html = {
    classList: { toggle: (c: string, on: boolean) => (on ? classes.add(c) : classes.delete(c)) },
    style: { colorScheme: "" },
  };
  runInNewContext(THEME_SCRIPT, {
    localStorage: {
      getItem: (k: string) => {
        if (storageThrows) throw new Error("blocked");
        return k === THEME_KEY ? stored : null;
      },
    },
    matchMedia: () => ({ matches: prefersDark }),
    document: { documentElement: html },
  });
  return { dark: classes.has("dark"), scheme: html.style.colorScheme };
}

describe("THEME_SCRIPT", () => {
  it("sets dark when the stored choice is dark, even on a light OS", () => {
    expect(runScript("dark", false)).toEqual({ dark: true, scheme: "dark" });
  });
  it("leaves dark out when the stored choice is light, even on a dark OS", () => {
    expect(runScript("light", true)).toEqual({ dark: false, scheme: "light" });
  });
  it("follows the OS with no stored choice", () => {
    expect(runScript(null, true)).toEqual({ dark: true, scheme: "dark" });
  });
  it("ignores an unknown stored value and follows the OS", () => {
    expect(runScript("purple", false)).toEqual({ dark: false, scheme: "light" });
  });
  it("still follows the OS when storage is blocked", () => {
    expect(runScript(null, true, true)).toEqual({ dark: true, scheme: "dark" });
  });
});

describe("ThemeToggle (squish switch with a sun-to-moon thumb, UX-D-13)", () => {
  const out = renderToStaticMarkup(createElement(ThemeToggle));

  it("is a switch with an accessible name and a tooltip", () => {
    expect(out).toMatch(/<button[^>]*role="switch"/);
    expect(out).toContain('aria-label="Dark theme"');
    expect(out).toMatch(/title="[^"]+"/);
  });

  it("renders the light state on the server: aria-checked false, the thumb is the sun", () => {
    expect(out).toContain('aria-checked="false"');
    expect(out).toMatch(/data-slot="theme-thumb"[^>]*data-shape="sun"/);
  });

  it("is one morphing shape, not two icons: one svg in the thumb, no icon set", () => {
    expect(out.match(/<svg/g)).toHaveLength(1);
    expect(out).not.toMatch(/lucide-(sun|moon)/);
    expect(out).toContain('data-part="rays"');
    expect(out).toContain('data-part="cutout"');
  });

  it("gives the sun a deep-gold edge for 3:1 against the light track (WCAG 1.4.11)", () => {
    expect(out).toMatch(/data-part="body"[^>]*stroke="var\(--color-gold-700\)"/);
  });

  it("hides the Use system link while the OS setting is followed (UX-D-01 keeps System)", () => {
    expect(out).not.toContain("Use system");
  });
});
