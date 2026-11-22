import {
  BadgeCheck,
  CircleCheck,
  CircleDashed,
  CircleDot,
  Clock,
  Lock,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import type { Tone } from "./tones";

// DESIGN.md §3.3: each tone has one icon, so color is never the only cue (WCAG 1.4.1).
export const TONE_ICON: Record<Tone, LucideIcon> = {
  neutral: CircleDashed,
  active: CircleDot,
  pending: Clock,
  done: CircleCheck,
  returned: Undo2,
  locked: Lock,
  achieved: BadgeCheck,
};

export const TONE_CLASS: Record<Tone, string> = {
  neutral: "text-tone-neutral-fg bg-tone-neutral-bg border-tone-neutral-line",
  active: "text-tone-active-fg bg-tone-active-bg border-tone-active-line",
  pending: "text-tone-pending-fg bg-tone-pending-bg border-tone-pending-line",
  done: "text-tone-done-fg bg-tone-done-bg border-tone-done-line",
  returned: "text-tone-returned-fg bg-tone-returned-bg border-tone-returned-line",
  locked: "text-tone-locked-fg bg-tone-locked-bg border-tone-locked-line",
  achieved: "text-tone-achieved-fg bg-tone-achieved-bg border-tone-achieved-line",
};

/** Text color only, for shapes with a white fill (document stamp, outside chip). */
export const TONE_TEXT: Record<Tone, string> = {
  neutral: "text-tone-neutral-fg",
  active: "text-tone-active-fg",
  pending: "text-tone-pending-fg",
  done: "text-tone-done-fg",
  returned: "text-tone-returned-fg",
  locked: "text-tone-locked-fg",
  // Gold text on white fails contrast (DESIGN.md §3.1), so achieved uses the dark maroon text.
  achieved: "text-tone-achieved-fg",
};

export function ToneIcon({ tone, className }: { tone: Tone; className?: string }) {
  const Icon = TONE_ICON[tone];
  return <Icon aria-hidden="true" strokeWidth={1.5} className={className ?? "size-4"} data-tone-icon={tone} />;
}
