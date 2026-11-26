// Task R5.5 (DESIGN.md §7.4 `pdf-viewer`, §8.6, UX-009, UX-040, UX-D-01, BR-07, ADR-009): the PDF viewer pattern.
// It moves from src/components/pdf-viewer.tsx, with a re-export at the old path and the same props.
// Page Up and Page Down move one page. The locked banner shows when the manuscript is locked. No "Page 1 of 0".
// The page stays white in dark. The Round H tests (pdf-viewer.test.ts) still run on the old path.
import { readFileSync } from "node:fs";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const seen: { page?: Record<string, unknown> } = {};
vi.mock("react-pdf", () => ({
  pdfjs: { GlobalWorkerOptions: {} },
  Document: (props: Record<string, unknown>) => props.children as ReactElement,
  Page: (props: Record<string, unknown>) => {
    seen.page = props;
    return null;
  },
}));

const pattern = await import("@/components/patterns/pdf-viewer");
const old = await import("@/components/pdf-viewer");
const { default: PdfViewer, pageAfterKey, pageLabel } = pattern;

const url = "https://files.example.test/a.pdf";

describe("pdf viewer pattern (R5.5)", () => {
  beforeEach(() => {
    seen.page = undefined;
  });

  it("the old path re-exports the pattern (the same component, the same props)", () => {
    expect(old.default).toBe(pattern.default);
  });

  it("Page Down and Page Up move one page, and stop at the first and the last page", () => {
    expect(pageAfterKey("PageDown", 3, 10)).toBe(4);
    expect(pageAfterKey("PageUp", 3, 10)).toBe(2);
    expect(pageAfterKey("PageUp", 1, 10)).toBe(1);
    expect(pageAfterKey("PageDown", 10, 10)).toBe(10);
    expect(pageAfterKey("Home", 7, 10)).toBe(1);
    expect(pageAfterKey("End", 2, 10)).toBe(10);
    expect(pageAfterKey("a", 2, 10)).toBeNull();
    // Before the page count is known, the keys do nothing.
    expect(pageAfterKey("PageDown", 1, 0)).toBeNull();
  });

  it('never shows "Page 1 of 0" (UX-040)', () => {
    expect(pageLabel(1, 0)).not.toMatch(/of 0/);
    expect(pageLabel(3, 12)).toBe("Page 3 of 12");
    const html = renderToStaticMarkup(createElement(PdfViewer, { url, onRetry: () => {} }));
    expect(html).not.toMatch(/of 0/);
  });

  it("shows the locked banner across the top when the manuscript is locked (§8.6, BR-07)", () => {
    const text = "Locked at Gate 1b on Mon 4 Jan 2027. Unlocks when the defense closes.";
    const html = renderToStaticMarkup(createElement(PdfViewer, { url, onRetry: () => {}, locked: text }));
    expect(html).toMatch(/data-slot="locked-banner"[\s\S]*Locked at Gate 1b on Mon 4 Jan 2027\./);
    expect(html.indexOf("locked-banner")).toBeLessThan(html.indexOf('data-slot="pdf-page"'));
    expect(renderToStaticMarkup(createElement(PdfViewer, { url, onRetry: () => {} }))).not.toContain("locked-banner");
  });

  it("keeps the PDF page white in the dark theme (UX-D-01)", () => {
    renderToStaticMarkup(createElement(PdfViewer, { url, onRetry: () => {} }));
    expect(String(seen.page?.className)).toMatch(/\bbg-white\b/);
  });

  it("the page region takes the keys: focusable, labelled, with the key hint for screen readers", () => {
    const html = renderToStaticMarkup(createElement(PdfViewer, { url, onRetry: () => {} }));
    expect(html).toMatch(/<div[^>]*data-slot="pdf-page"[^>]*tabindex="0"/);
    expect(html).toMatch(/data-slot="pdf-page"[^>]*aria-label="Manuscript page"|aria-label="Manuscript page"[^>]*data-slot="pdf-page"/);
    expect(html).toMatch(/aria-keyshortcuts="PageUp PageDown Home End"/);
  });

  it("has no pin or highlight on the PDF (ADR-009): the text and annotation layers stay off", () => {
    renderToStaticMarkup(createElement(PdfViewer, { url, onRetry: () => {} }));
    expect(seen.page?.renderTextLayer).toBe(false);
    expect(seen.page?.renderAnnotationLayer).toBe(false);
    const src = readFileSync("src/components/patterns/pdf-viewer/index.tsx", "utf8");
    expect(src.split("\n")[1]).toMatch(/^\/\/ Source:/);
  });
});

// UX-P-05 (approved 26 Nov 2026): a next step after "Try again" fails, by role. The old file stays (BR-19).
describe("PDF error: the next step after a failed retry (UX-P-05)", async () => {
  const { PdfLoadError, pdfNextStep } = await import("@/components/pdf-load-error");
  it("gives the Student and the reviewers their own next step", () => {
    expect(pdfNextStep("student")).toBe("If it still does not load, upload the file again as a new version.");
    expect(pdfNextStep("adviser")).toBe("If it still does not load, ask the Student to upload it again.");
    expect(pdfNextStep("panel_member")).toBe("If it still does not load, ask the Student to upload it again.");
  });

  it("shows the next step only after a retry failed", () => {
    const step = pdfNextStep("student");
    expect(renderToStaticMarkup(createElement(PdfLoadError, { onRetry: () => {}, nextStep: step, retried: false }))).not.toContain(step);
    expect(renderToStaticMarkup(createElement(PdfLoadError, { onRetry: () => {}, nextStep: step, retried: true }))).toContain(step);
    // Without a next step (today's live screens), nothing changes.
    expect(renderToStaticMarkup(createElement(PdfLoadError, { onRetry: () => {}, retried: true }))).not.toContain("still does not load");
  });

  it("the viewer passes the next step to the error when it is a retry", () => {
    const step = pdfNextStep("adviser");
    renderToStaticMarkup(createElement(PdfViewer, { url, onRetry: () => {}, nextStep: step, retried: true }));
    const err = seen.page?.error as { props: { nextStep?: string; retried?: boolean } };
    expect(err.props.nextStep).toBe(step);
    expect(err.props.retried).toBe(true);
  });
});
