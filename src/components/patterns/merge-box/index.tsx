// Source: Primer pull-request merge box (DESIGN.md §5.3 S2, §7.4 `merge-box`), design/screens/S2.md, BR-07, BR-18, Task R5.1.
// The S2 form of the Docket: one sentence that says what to do now, and one action ("Mark Ready" or "Upload version").
// When there is no action, its reason shows in its place (the SITEMAP §9 text, for example "Locked until the defense is
// closed."). One maroon button at most (G1). No second helper line (S2 "Changes from the mockup", G4).
// The upload is not in the box: it sits at the foot of the workspace's Manuscript column (R5-b A adapted, UX-P-05).
import type { ReactNode } from "react";
import { Glyph, type GlyphName } from "@/components/patterns/glyphs";
import { cn } from "@/lib/utils";

/** The state of the box. It sets the glyph on the left only; the sentence carries the meaning. */
export type MergeState = "open" | "ready" | "locked" | "returned" | "first-day";

export type MergeBoxProps = {
  /** One sentence. 25 words or fewer (AGENTS.md §5). */
  sentence: string;
  /** The one action, or null. With null, give `lockedReason`. */
  action: ReactNode | null;
  /** Why there is no action (BR-18). Shown with the lock glyph. */
  lockedReason?: string;
  state?: MergeState;
  className?: string;
};

const LOOK: Record<MergeState, { glyph: GlyphName; className: string }> = {
  "first-day": { glyph: "commit", className: "text-muted-foreground" },
  open: { glyph: "commit", className: "text-foreground" },
  ready: { glyph: "active", className: "text-tone-active-fg" },
  locked: { glyph: "lock", className: "text-tone-locked-fg" },
  returned: { glyph: "return", className: "text-tone-returned-fg" },
};

export function MergeBox({ sentence, action, lockedReason, state = "open", className }: MergeBoxProps) {
  if (action === null && (lockedReason === undefined || lockedReason.trim() === "")) {
    throw new Error("MergeBox: with no action, give the reason (BR-18).");
  }
  if (action !== null && lockedReason !== undefined) throw new Error("MergeBox: give an action or a locked reason, not both.");
  const look = LOOK[state];
  return (
    <section
      aria-label="What to do now"
      data-slot="merge-box"
      data-state={state}
      className={cn("flex flex-col gap-4 rounded-card border border-border bg-card p-4 sm:p-5", className)}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p data-slot="merge-sentence" className="flex min-w-0 items-start gap-3 text-base leading-6 text-foreground">
          <span className={cn("mt-0.5 shrink-0", look.className)}>
            <Glyph name={look.glyph} size={20} />
          </span>
          <span className="min-w-0 max-w-[65ch]">{sentence}</span>
        </p>
        {action !== null ? (
          <div data-slot="merge-action" className="flex shrink-0 sm:justify-end">
            {action}
          </div>
        ) : (
          <p data-slot="merge-reason" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-muted-foreground sm:max-w-[40%]">
            <Glyph name="lock" size={16} className="shrink-0" />
            {lockedReason}
          </p>
        )}
      </div>
    </section>
  );
}
