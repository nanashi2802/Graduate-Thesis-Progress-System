"use client";
// Source: UX-026, DESIGN.md §8.4 and §9, Task R2.5. An inline error inside the shell: what failed and what to do.
// "Try again" calls `reset()` of the error boundary. No stack trace, no digest, no internal code.
// At Integrate (R2.8) each role segment gets an `error.tsx` that renders this.
import { Glyph } from "@/components/patterns/glyphs";
import { Button } from "@/components/ui/button";

export type ErrorStateProps = {
  /** One sentence: what failed. For example "This page did not load." */
  what: string;
  /** One sentence: what to do. */
  todo: string;
  onRetry?: () => void;
};

export function ErrorState({ what, todo, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="flex max-w-[72ch] flex-col items-start gap-3 rounded-card border border-tone-returned-line bg-card p-5">
      <p className="flex items-center gap-2 font-semibold text-foreground">
        <span className="text-tone-returned-fg">
          <Glyph name="flag" size={20} />
        </span>
        {what}
      </p>
      <p className="text-sm text-muted-foreground">{todo}</p>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/** The body of a role segment `error.tsx` (client component). */
export function SegmentError({ reset }: { error?: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState what="This page did not load." todo="Try again. If it fails again, tell the Coordinator." onRetry={reset} />;
}
