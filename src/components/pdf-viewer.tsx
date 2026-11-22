"use client";
// PDF viewer that loads only the pages in view by range requests (PRD §11.3 rule 2, DFD T5).
import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

// No streaming and no background fetch: pdf.js asks only for the byte ranges it needs.
const options = { disableAutoFetch: true, disableStream: true, rangeChunkSize: 65536 };

export default function PdfViewer({ url }: { url: string }) {
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  return (
    <div className="flex flex-col gap-3">
      <Document file={url} options={options} onLoadSuccess={(pdf) => setPages(pdf.numPages)}>
        <Page pageNumber={page} width={480} renderTextLayer={false} renderAnnotationLayer={false} />
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
