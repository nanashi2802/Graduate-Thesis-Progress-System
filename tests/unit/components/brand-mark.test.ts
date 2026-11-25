// Task R1.6 (UX-D-10, UX-D-11 item 6): the hybrid logo. Official artwork only; the text treatment is the
// plain product name, never a retyped copy of the two-weight logo wordmark.
import { createElement as h } from "react";
import { renderToStaticMarkup as html } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BrandMark } from "@/components/patterns/brand-mark";

const art = { src: "/brand/thesisko-horizontal.svg", width: 280, height: 64 };

describe("BrandMark", () => {
  it("shows the official artwork at its own size, with the name as alt text", () => {
    const out = html(h(BrandMark, { variant: "full", artwork: art }));
    expect(out).toMatch(/<img[^>]*src="\/brand\/thesisko-horizontal\.svg"/);
    expect(out).toContain('width="280"');
    expect(out).toContain('height="64"');
    expect(out).toContain('alt="ThesIsko"');
  });

  it("falls back to the text treatment when the full-logo artwork is missing", () => {
    const out = html(h(BrandMark, { variant: "full" }));
    expect(out).not.toContain("<img");
    expect(out).toContain(">ThesIsko<");
  });

  it("never invents a symbol: without artwork, the symbol slot keeps only an accessible name", () => {
    const out = html(h(BrandMark, { variant: "symbol" }));
    expect(out).not.toContain("<img");
    expect(out).toMatch(/class="sr-only"[^>]*>ThesIsko</);
  });

  it("uses the wordmark token, which is white in dark (brand guide: reversed logo on dark)", () => {
    expect(html(h(BrandMark, { variant: "text" }))).toContain("text-wordmark");
  });

  it("text treatment: one weight, no gold, optional descriptor", () => {
    const out = html(h(BrandMark, { variant: "text", descriptor: true }));
    expect(out).toContain(">ThesIsko<");
    expect(out).toContain("Graduate Thesis Progress");
    expect(out).not.toMatch(/gold|achieved|progress-/);
    expect(html(h(BrandMark, { variant: "text" }))).not.toContain("Graduate Thesis Progress");
  });
});
