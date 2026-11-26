// Source: own (DESIGN.md §3.3, §8.1). Three status shapes: status pill, document stamp, outside chip.
// The same status looks the same on every screen (F5). Color is never the only cue: each tone has a glyph
// and a label (WCAG 1.4.1). Tokens only, so both themes work.
// D-06 (UX-P-02): the pills use the domain glyphs. Active, pending and achieved are the R2 glyphs; the other
// tones use the R1 glyphs of the same meaning.
import { Glyph, type GlyphName } from "@/components/patterns/glyphs";
import {
  documentStateView,
  milestoneStatusView,
  outsideStatusView,
  type DocumentState,
  type OutsideKind,
  type OutsideValue,
  type Tone,
} from "@/components/status/tones";
import { cn } from "@/lib/utils";
import type { MilestoneCode, MilestoneStatus } from "@/server/domain/milestone";
import { formLabel } from "./labels";

export { formLabel, gateLabel, gateResultLabel } from "./labels";
export type { Tone, DocumentState, OutsideKind, OutsideValue };

const TONE_GLYPH: Record<Tone, GlyphName> = {
  neutral: "todo",
  active: "active",
  pending: "pending",
  done: "done",
  returned: "return",
  locked: "lock",
  achieved: "achieved",
};

const TONE_FILL: Record<Tone, string> = {
  neutral: "text-tone-neutral-fg bg-tone-neutral-bg border-tone-neutral-line",
  active: "text-tone-active-fg bg-tone-active-bg border-tone-active-line",
  pending: "text-tone-pending-fg bg-tone-pending-bg border-tone-pending-line",
  done: "text-tone-done-fg bg-tone-done-bg border-tone-done-line",
  returned: "text-tone-returned-fg bg-tone-returned-bg border-tone-returned-line",
  locked: "text-tone-locked-fg bg-tone-locked-bg border-tone-locked-line",
  achieved: "text-tone-achieved-fg bg-tone-achieved-bg border-tone-achieved-line",
};

// Text only, for shapes on the card fill. Gold text fails on a light surface, so achieved uses its dark text.
const TONE_TEXT: Record<Tone, string> = {
  neutral: "text-tone-neutral-fg",
  active: "text-tone-active-fg",
  pending: "text-tone-pending-fg",
  done: "text-tone-done-fg",
  returned: "text-tone-returned-fg",
  locked: "text-tone-locked-fg",
  achieved: "text-foreground",
};

export function ToneIcon({ tone, className }: { tone: Tone; className?: string }) {
  return (
    <span data-tone-icon={tone} className="inline-flex shrink-0">
      <Glyph name={TONE_GLYPH[tone]} className={className ?? "size-4"} />
    </span>
  );
}

export type StatusPillProps = { tone: Tone; label: string; className?: string };

/** Round, tinted, glyph and label. For milestone status. */
export function StatusPill({ tone, label, className }: StatusPillProps) {
  return (
    <span
      data-slot="status-pill"
      data-tone={tone}
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm leading-5 font-medium whitespace-nowrap",
        TONE_FILL[tone],
        className,
      )}
    >
      <ToneIcon tone={tone} />
      {label}
    </span>
  );
}

export function MilestoneStatusPill({ status, milestone, className }: { status: MilestoneStatus; milestone?: MilestoneCode; className?: string }) {
  const view = milestoneStatusView(status, milestone);
  return <StatusPill tone={view.tone} label={view.label} className={className} />;
}

export type DocumentStampProps = {
  /** A form code (`TDW_07`, `SIGNED_FINAL_MANUSCRIPT`) or a label. The stamp shows the label. */
  form: string;
  state: DocumentState;
  className?: string;
};

/** 2 px radius, 1 px edge, card fill, the form in mono and the state. It hugs its content (UX-015). */
export function DocumentStamp({ form, state, className }: DocumentStampProps) {
  const view = documentStateView(state);
  return (
    <span
      data-slot="document-stamp"
      data-tone={view.tone}
      className={cn(
        "inline-flex w-fit items-center gap-2 rounded-stamp border border-divider-strong bg-card px-2 py-0.5 text-sm leading-5 whitespace-nowrap",
        className,
      )}
    >
      <span className="font-mono text-[13px] text-foreground">{formLabel(form)}</span>
      <span aria-hidden="true" className="text-muted-foreground">
        ·
      </span>
      <span className={cn("inline-flex items-center gap-1 font-medium", TONE_TEXT[view.tone])}>
        <ToneIcon tone={view.tone} />
        {view.label}
      </span>
    </span>
  );
}

/** Round, dashed edge, no fill. The dashed line means "outside the system, set by the Coordinator" (BR-14). */
export function OutsideChip({ kind, value, className }: { kind: OutsideKind; value: OutsideValue; className?: string }) {
  const view = outsideStatusView(kind, value);
  return (
    <span
      data-slot="outside-chip"
      data-tone={view.tone}
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full border border-dashed border-input px-2.5 py-0.5 text-sm leading-5 whitespace-nowrap",
        className,
      )}
    >
      <span className="font-medium text-foreground">{view.kindLabel}</span>
      <span className={cn("inline-flex items-center gap-1", TONE_TEXT[view.tone])}>
        <ToneIcon tone={view.tone} />
        {view.label}
      </span>
    </span>
  );
}
