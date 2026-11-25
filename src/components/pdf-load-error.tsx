"use client";
// The in-place error of the manuscript viewer (Round H, UX-009, FR-REV-03, DESIGN.md §7.4 `error`).
// A PDF that does not load must not take down the workspace: the threads and the gate actions stay.
import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export const PDF_LOAD_ERROR = "The manuscript did not load.";

export function PdfLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-2 rounded-card border border-border bg-card p-4">
      <p className="text-sm font-semibold text-foreground">{PDF_LOAD_ERROR}</p>
      <p className="text-sm text-muted-foreground">The link can expire. Try again to get a new link.</p>
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
