// Round H, Task H.1 (UX-009, FR-REV-03): a PDF that does not load shows an error in place.
// It must not throw to the page, so the threads and the gate actions stay on the screen.
import { createElement, isValidElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Record the props that the viewer passes to react-pdf. The real package needs a browser.
const seen: { doc?: Record<string, unknown>; page?: Record<string, unknown> } = {};
vi.mock("react-pdf", () => ({
  pdfjs: { GlobalWorkerOptions: {} },
  Document: (props: Record<string, unknown>) => {
    seen.doc = props;
    return props.children as ReactElement;
  },
  Page: (props: Record<string, unknown>) => {
    seen.page = props;
    return null;
  },
}));

const { default: PdfViewer } = await import("@/components/pdf-viewer");
const { PdfLoadError, PdfErrorBoundary, PDF_LOAD_ERROR } = await import("@/components/pdf-load-error");

describe("PdfLoadError", () => {
  it("shows the message and a Try again button in an alert", () => {
    const html = renderToStaticMarkup(createElement(PdfLoadError, { onRetry: () => {} }));
    expect(html).toContain('role="alert"');
    expect(html).toContain(PDF_LOAD_ERROR);
    expect(html).toMatch(/<button[^>]*>Try again<\/button>/);
  });
});

describe("PdfViewer (UX-009)", () => {
  beforeEach(() => {
    seen.doc = undefined;
    seen.page = undefined;
  });

  it("turns off react-pdf suspense, so a load error does not throw to the page", () => {
    renderToStaticMarkup(createElement(PdfViewer, { url: "https://files.example.test/a.pdf", onRetry: () => {} }));
    expect(seen.doc?.suspense).toBe(false);
    expect(seen.page?.suspense).toBe(false);
  });

  it("gives Document and Page the in-place error with the retry callback", () => {
    const onRetry = vi.fn();
    renderToStaticMarkup(createElement(PdfViewer, { url: "https://files.example.test/a.pdf", onRetry }));
    for (const props of [seen.doc, seen.page]) {
      const error = props?.error;
      expect(isValidElement(error)).toBe(true);
      const el = error as ReactElement<{ onRetry: () => void }>;
      expect(el.type).toBe(PdfLoadError);
      el.props.onRetry();
    }
    expect(onRetry).toHaveBeenCalledTimes(2);
  });
});

describe("PdfErrorBoundary (backstop)", () => {
  it("catches an error from the viewer and shows the in-place error", () => {
    expect(PdfErrorBoundary.getDerivedStateFromError()).toEqual({ failed: true });
    const onRetry = vi.fn();
    const boundary = new PdfErrorBoundary({ onRetry, children: createElement("p", null, "viewer") });
    boundary.state = { failed: true };
    const html = renderToStaticMarkup(boundary.render() as ReactElement);
    expect(html).toContain(PDF_LOAD_ERROR);
    expect(html).not.toContain("viewer");
  });

  it("renders the viewer when nothing failed", () => {
    const boundary = new PdfErrorBoundary({ onRetry: () => {}, children: createElement("p", null, "viewer") });
    const html = renderToStaticMarkup(boundary.render() as ReactElement);
    expect(html).toContain("viewer");
  });
});
