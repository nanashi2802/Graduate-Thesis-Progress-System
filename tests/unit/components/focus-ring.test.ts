// Round H, Task H.2 (UX-001, DESIGN.md §10, WCAG 2.4.7): a focused control shows a visible outline.
// In Tailwind v4, `outline-none` sets `--tw-outline-style: none`, and `outline-2` reuses that variable.
// So `outline-none focus-visible:outline-2` draws no line unless the class list also has `focus-visible:outline-solid`.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.tsx?$/.test(name) ? [path] : [];
  });
}

// Every quoted class string in src/ that removes the outline and adds a focus outline.
const strings = files("src").flatMap((file) =>
  [...readFileSync(file, "utf8").matchAll(/"([^"\n]*\boutline-none\b[^"\n]*)"/g)]
    .map((m) => m[1]!)
    .filter((cls) => /focus-visible:outline-\d/.test(cls))
    .map((cls) => ({ file, cls })),
);

describe("focus outline (UX-001)", () => {
  it("finds the class strings to check", () => {
    // The shell, the sidebar, the notification bell, the Coordinator fields and the button.
    expect(strings.length).toBeGreaterThanOrEqual(6);
  });

  it.each(strings)("$file keeps the outline style on focus", ({ cls }) => {
    expect(cls).toMatch(/\bfocus-visible:outline-solid\b/);
  });

  it("gives every Button variant a solid focus outline", () => {
    for (const variant of ["default", "outline", "return", "link"] as const) {
      const html = renderToStaticMarkup(createElement(Button, { variant }, "Act"));
      expect(html).toContain("focus-visible:outline-solid");
      expect(html).toContain("focus-visible:outline-2");
    }
  });
});
