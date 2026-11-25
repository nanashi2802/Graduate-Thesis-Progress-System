"use client";
// The manuscript viewer: asks for a signed read link, then loads the PDF in the page viewer (FR-REV-03, INV-24).
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { commitUrl } from "@/app/_lib/pr-actions";

const PdfViewer = dynamic(() => import("@/components/pdf-viewer"), {
  ssr: false,
  loading: () => <p className="text-sm text-muted-foreground">Loading the viewer…</p>,
});

export function PdfPane({ commitId, page }: { commitId: string; page?: number }) {
  const [state, setState] = useState<{ commitId: string; url?: string; error?: string } | null>(null);
  useEffect(() => {
    let live = true;
    void commitUrl(commitId).then((res) => {
      if (live) setState({ commitId, ...res });
    });
    return () => {
      live = false;
    };
  }, [commitId]);
  if (!state || state.commitId !== commitId) return <p className="text-sm text-muted-foreground">Opening the file…</p>;
  if (!state.url) return <p role="alert" className="text-sm text-destructive">{state.error ?? "The file did not open."}</p>;
  return <PdfViewer url={state.url} page={page} />;
}
