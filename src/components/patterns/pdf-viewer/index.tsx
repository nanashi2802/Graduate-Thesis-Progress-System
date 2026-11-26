"use client";
// Source: own, on react-pdf (DESIGN.md §7.4 `pdf-viewer`, §8.6), PRD §11.3 rule 2, DFD T5, UX-009, UX-040, UX-D-01,
// BR-07, ADR-009, D-26, Task R5.5. Screens: S2, A2, P2, C4, SV. Moved from src/components/pdf-viewer.tsx (re-export there).
// The viewer loads only the pages in view by range requests. A thread page number (FR-REV-04, D-26) moves the viewer.
// A number past the end goes to the last page.
// react-pdf throws load errors to the nearest error boundary by default (suspense). That took down the whole
// workspace (UX-009). So suspense is off, and Document and Page show the error in place (Round H).
// R5.5: Page Up and Page Down move one page, Home and End go to the first and the last page, while the page region
// has focus. The locked banner sits across the top when the manuscript is locked (§8.6, BR-07). Before the page count
// is known, the count line says the PDF is opening: never "Page 1 of 0" (UX-040). The page fits the column width.
// No pin or highlight (ADR-009): the text and annotation layers stay off.
import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Glyph } from "@/components/patterns/glyphs";
import { PdfLoadError } from "@/components/pdf-load-error";
import { Button } from "@/components/ui/button";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

// No streaming and no background fetch: pdf.js asks only for the byte ranges it needs.
const options = { disableAutoFetch: true, disableStream: true, rangeChunkSize: 65536 };

// Before the PDF loads, `pages` is 0 and only the lower bound applies.
const clamp = (n: number, pages: number) => Math.min(Math.max(1, n), pages || n);

/** The page after a key in the page region, or null for any other key (and before the page count is known). */
export function pageAfterKey(key: string, page: number, pages: number): number | null {
  if (pages <= 0) return null;
  switch (key) {
    case "PageDown":
      return Math.min(page + 1, pages);
    case "PageUp":
      return Math.max(page - 1, 1);
    case "Home":
      return 1;
    case "End":
      return pages;
    default:
      return null;
  }
}

/** The count line. UX-040: no "Page 1 of 0" while the PDF opens. */
export const pageLabel = (page: number, pages: number) => (pages > 0 ? `Page ${page} of ${pages}` : "Opening the PDF…");

const MAX_WIDTH = 800;
const START_WIDTH = 480;

export type PdfViewerProps = {
  url: string;
  page?: number;
  onRetry: () => void;
  /** The locked banner text (§8.6): "Locked at Gate 1b on Mon 4 Jan 2027. Unlocks when the defense closes." */
  locked?: string;
  /** UX-P-05 (approved): the role's next step, shown under the error after a failed "Try again" (`pdfNextStep`). */
  nextStep?: string;
  /** A "Try again" already ran for this file. */
  retried?: boolean;
};

export default function PdfViewer({ url, page: target, onRetry, locked, nextStep, retried = false }: PdfViewerProps) {
  const error = <PdfLoadError onRetry={onRetry} nextStep={nextStep} retried={retried} />;
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(target ? clamp(target, 0) : 1);
  const [width, setWidth] = useState(START_WIDTH);
  // A file that did not load shows only the error with "Try again": no page controls under it.
  const [failed, setFailed] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  // Follow a new target page, and clamp it again when the page count is known.
  const [seen, setSeen] = useState({ target, pages });
  if (seen.target !== target || seen.pages !== pages) {
    setSeen({ target, pages });
    if (target) setPage(clamp(target, pages));
  }
  // The page fits the column, up to 800 px.
  useLayoutEffect(() => {
    const el = frame.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.floor(entry?.contentRect.width ?? START_WIDTH);
      if (w > 0) setWidth(Math.min(w, MAX_WIDTH));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const next = pageAfterKey(e.key, page, pages);
    if (next === null) return;
    e.preventDefault();
    setPage(next);
  };
  const atStart = pages === 0 || page <= 1;
  const atEnd = pages === 0 || page >= pages;
  return (
    <div data-slot="pdf-viewer" className="flex min-w-0 flex-col gap-3">
      {locked ? (
        <div data-slot="locked-banner" role="note" className="flex items-start gap-2 rounded-control border border-tone-locked-line bg-tone-locked-bg px-3 py-2 text-sm text-tone-locked-fg">
          <Glyph name="lock" size={16} className="mt-0.5 shrink-0" />
          <span>{locked}</span>
        </div>
      ) : null}
      <div
        ref={frame}
        data-slot="pdf-page"
        tabIndex={0}
        aria-label="Manuscript page"
        aria-keyshortcuts="PageUp PageDown Home End"
        onKeyDown={onKey}
        className="min-w-0 rounded-control outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Document file={url} options={options} suspense={false} error={error} loading={<p className="text-sm text-muted-foreground">{pageLabel(1, 0)}</p>} onLoadError={() => setFailed(true)} onLoadSuccess={(pdf) => setPages(pdf.numPages)}>
          {/* A later page range can fail too, for example after the signed link expires (300 s). */}
          {/* UX-D-01: the PDF page stays light in the dark theme. `bg-white` is the one allowed exception. */}
          <Page
            className="w-fit bg-white shadow-[var(--shadow-popover)]"
            pageNumber={page}
            width={width}
            suspense={false}
            error={error}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>
      {/* The controls show once the page count is known: no "Page 1 of 0" (UX-040), none under a load error. */}
      <div hidden={failed || pages === 0 || undefined} className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" disabled={atStart} focusableWhenDisabled onClick={() => !atStart && setPage(page - 1)}>
          Previous page
        </Button>
        <span data-testid="page-count" aria-live="polite" className="font-mono text-sm text-foreground tabular-nums">
          {pageLabel(page, pages)}
        </span>
        <Button type="button" variant="outline" disabled={atEnd} focusableWhenDisabled onClick={() => !atEnd && setPage(page + 1)}>
          Next page
        </Button>
      </div>
    </div>
  );
}
