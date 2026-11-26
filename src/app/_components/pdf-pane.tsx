"use client";
// The manuscript viewer: asks for a signed read link, then loads the PDF in the page viewer (FR-REV-03, INV-24).
// A load error stays inside the viewer (Round H, UX-009). "Try again" asks for a new signed link.
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { commitUrl } from "@/app/_lib/pr-actions";
import { PdfErrorBoundary, pdfNextStep } from "@/components/pdf-load-error";

const PdfViewer = dynamic(() => import("@/components/pdf-viewer"), {
  ssr: false,
  loading: () => <p className="text-sm text-muted-foreground">Loading the viewer…</p>,
});

// R5.9 (UX-P-05: yes): after a failed "Try again", the error also gives the role's next step (`pdfNextStep`).
export function PdfPane({ commitId, page, role }: { commitId: string; page?: number; role: "student" | "adviser" | "panel_member" | "coordinator" }) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ commitId: string; attempt: number; url?: string; error?: string } | null>(null);
  useEffect(() => {
    let live = true;
    void commitUrl(commitId).then((res) => {
      if (live) setState({ commitId, attempt, ...res });
    });
    return () => {
      live = false;
    };
  }, [commitId, attempt]);
  const retry = () => setAttempt((n) => n + 1);
  if (!state || state.commitId !== commitId || state.attempt !== attempt)
    return <p className="text-sm text-muted-foreground">Opening the file…</p>;
  if (!state.url) return <p role="alert" className="text-sm text-destructive">{state.error ?? "The file did not open."}</p>;
  return (
    // A new link remounts the boundary, so a retry clears an earlier failure.
    <PdfErrorBoundary key={state.url} onRetry={retry} nextStep={pdfNextStep(role)} retried={attempt > 0}>
      <PdfViewer url={state.url} page={page} onRetry={retry} nextStep={pdfNextStep(role)} retried={attempt > 0} />
    </PdfErrorBoundary>
  );
}
