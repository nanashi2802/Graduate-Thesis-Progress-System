"use client";
// The in-place error of the manuscript viewer (Round H, UX-009, FR-REV-03, DESIGN.md §7.4 `error`).
// A PDF that does not load must not take down the workspace: the threads and the gate actions stay.
import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export const PDF_LOAD_ERROR = "The manuscript did not load.";

/**
 * UX-P-05 (approved 26 Nov 2026; the live viewer passes it at R5.9): the next step after "Try again" also fails. "Try again" fixes an
 * expired link only. A broken file needs a new version; the old commit stays (BR-19).
 */
export function pdfNextStep(role: "student" | "adviser" | "panel_member" | "coordinator"): string {
  return role === "student" ? "If it still does not load, upload the file again as a new version." : "If it still does not load, ask the Student to upload it again.";
}

export function PdfLoadError({ onRetry, nextStep, retried = false }: { onRetry: () => void; /** The role's next step (`pdfNextStep`). */ nextStep?: string; /** A "Try again" already failed. */ retried?: boolean }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-2 rounded-card border border-border bg-card p-4">
      <p className="text-sm font-semibold text-foreground">{PDF_LOAD_ERROR}</p>
      <p className="text-sm text-muted-foreground">The link can expire. Try again to get a new link.</p>
      {nextStep && retried ? <p className="text-sm font-medium text-foreground">{nextStep}</p> : null}
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

// A backstop for errors that react-pdf or pdf.js throw during render.
export class PdfErrorBoundary extends Component<{ onRetry: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return <PdfLoadError onRetry={this.props.onRetry} />;
    return this.props.children;
  }
}
