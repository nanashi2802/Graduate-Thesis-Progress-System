// Task R2.1 (DESIGN.md §5.1, §10, WCAG 2.4.1): the app shell pattern. A skip link is the first focusable element,
// the main region has id="main", the masthead rule is 3 px, and the content width follows decision R2-c.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppShell } from "@/components/patterns/app-shell";

const render = (props: Partial<Omit<Parameters<typeof AppShell>[0], "children">> = {}) =>
  renderToStaticMarkup(
    createElement(
      AppShell,
      {
        brand: createElement("span", null, "BRAND"),
        roleLabel: "Student",
        nav: createElement("nav", { "aria-label": "Student menu" }, "NAV"),
        topBar: createElement("span", null, "TOPBAR"),
        ...props,
      },
      createElement("p", null, "CONTENT"),
    ),
  );

describe("AppShell (R2.1)", () => {
  const html = render();

  it("starts with a skip link to #main, before any other link or button", () => {
    const first = html.match(/<(a|button|summary|input|select|textarea)\b[^>]*>/)?.[0] ?? "";
    expect(first).toMatch(/^<a[^>]*href="#main"/);
    expect(html).toContain("Skip to content");
    expect(first).toContain("sr-only");
    expect(first).toContain("focus:not-sr-only");
  });

  it("puts the page content in <main id=\"main\">", () => {
    expect(html).toMatch(/<main[^>]*id="main"[^>]*>[\s\S]*CONTENT[\s\S]*<\/main>/);
    expect(html.match(/<main/g)).toHaveLength(1);
  });

  it("draws the 3 px maroon masthead rule and a 56 px top bar with the brand, role and controls", () => {
    expect(html).toMatch(/aria-hidden="true" class="[^"]*h-\[3px\][^"]*bg-primary/);
    expect(html).toMatch(/<header[^>]*class="[^"]*h-14/);
    expect(html).toMatch(/BRAND[\s\S]*Student[\s\S]*TOPBAR/);
  });

  it("shows the 240 px sidebar from 1024 px and a menu button below it", () => {
    expect(html).toMatch(/<aside[^>]*class="[^"]*hidden[^"]*w-60[^"]*lg:flex/);
    expect(html).toMatch(/<button[^>]*aria-label="Open menu"[^>]*class="[^"]*lg:hidden/);
  });

  it("limits the content to 1280 px by default (R2-c option A) and 1200 px as option B", () => {
    expect(html).toContain("max-w-[1280px]");
    expect(render({ contentWidth: 1200 })).toContain("max-w-[1200px]");
  });

  it("uses tokens only and a solid focus outline on its own controls", () => {
    expect(html).not.toMatch(/\b(?:bg|text|border)-(?:maroon|gold|neutral)-\d/);
    expect(html).toContain("focus-visible:outline-solid");
  });
});
