"use client";
// PDF viewer that loads only the pages in view by range requests (PRD §11.3 rule 2, DFD T5).
// A thread page number (FR-REV-04, D-26) moves the viewer. A number past the end goes to the last page.
// react-pdf throws load errors to the nearest error boundary by default (suspense). That took down the
// whole workspace (UX-009). So suspense is off, and Document and Page show the error in place (Round H).
import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { PdfLoadError } from "@/components/pdf-load-error";
import { Button } from "@/components/ui/button";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

// No streaming and no background fetch: pdf.js asks only for the byte ranges it needs.
const options = { disableAutoFetch: true, disableStream: true, rangeChunkSize: 65536 };

// Before the PDF loads, `pages` is 0 and only the lower bound applies.
const clamp = (n: number, pages: number) => Math.min(Math.max(1, n), pages || n);

export default function PdfViewer({ url, page: target, onRetry }: { url: string; page?: number; onRetry: () => void }) {
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(target ? clamp(target, 0) : 1);
  // Follow a new target page, and clamp it again when the page count is known.
  const [seen, setSeen] = useState({ target, pages });
  if (seen.target !== target || seen.pages !== pages) {
    setSeen({ target, pages });
    if (target) setPage(clamp(target, pages));
  }
  return (
    <div className="flex flex-col gap-3">
      <Document
        file={url}
        options={options}
        suspense={false}
        error={<PdfLoadError onRetry={onRetry} />}
        onLoadSuccess={(pdf) => setPages(pdf.numPages)}
      >
        {/* A later page range can fail too, for example after the signed link expires (300 s). */}
        {/* UX-D-01: the PDF page stays light in the dark theme. `bg-white` is the one allowed exception. */}
        <Page
          className="w-fit bg-white"
          pageNumber={page}
          width={480}
          suspense={false}
          error={<PdfLoadError onRetry={onRetry} />}
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      </Document>
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Previous page
        </Button>
        <span data-testid="page-count">
          Page {page} of {pages}
        </span>
        <Button type="button" variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>
          Next page
        </Button>
      </div>
    </div>
  );
}
