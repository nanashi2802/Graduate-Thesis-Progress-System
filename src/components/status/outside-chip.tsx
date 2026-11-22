import { cn } from "@/lib/utils";
import { TONE_TEXT, ToneIcon } from "./tone-icon";
import { outsideStatusView, type OutsideKind, type OutsideValue } from "./tones";

/**
 * Round, dashed border, no fill (DESIGN.md §7.1). The dashed line means "outside the
 * system, set by the Coordinator" (Ethics, IPMO, RPO, copyright; BR-14).
 */
export function OutsideChip({
  kind,
  value,
  className,
}: {
  kind: OutsideKind;
  value: OutsideValue;
  className?: string;
}) {
  const view = outsideStatusView(kind, value);
  return (
    <span
      data-slot="outside-chip"
      data-tone={view.tone}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-dashed border-neutral-500 px-2.5 py-0.5 text-sm leading-5 whitespace-nowrap",
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
