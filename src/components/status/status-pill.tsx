import { cn } from "@/lib/utils";
import type { MilestoneCode, MilestoneStatus } from "@/server/domain/milestone";
import { TONE_CLASS, ToneIcon } from "./tone-icon";
import { milestoneStatusView, type Tone } from "./tones";

/** Round, tinted, icon and label (DESIGN.md §7.1). Use it for milestone status. */
export function StatusPill({
  tone,
  label,
  className,
}: {
  tone: Tone;
  label: string;
  className?: string;
}) {
  return (
    <span
      data-slot="status-pill"
      data-tone={tone}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm leading-5 font-medium whitespace-nowrap",
        TONE_CLASS[tone],
        className,
      )}
    >
      <ToneIcon tone={tone} />
      {label}
    </span>
  );
}

export function MilestoneStatusPill({
  status,
  milestone,
  className,
}: {
  status: MilestoneStatus;
  milestone?: MilestoneCode;
  className?: string;
}) {
  const view = milestoneStatusView(status, milestone);
  return <StatusPill tone={view.tone} label={view.label} className={className} />;
}
