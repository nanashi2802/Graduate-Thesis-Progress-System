import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * Stroke draw for the hero title, after React Bits StrokeText (MIT + Commons Clause,
 * (c) 2026 David Haz, https://reactbits.dev/text-animations/stroke-text), rebuilt with CSS
 * keyframes (`.hero-stroke-*` and `.hero-fill` in landing.css).
 *
 * Each word is an inline block, so the title still wraps like plain text. The real HTML word
 * is the fill and stays in the DOM for screen readers. An SVG copy of the word sits on top and
 * draws the outline. The SVG baseline is 0.895em: IBM Plex Sans has a 1.025em ascent and a
 * 0.275em descent, centred in a 1.04em line box. Keep it in step with the title line height.
 */
const BASELINE = "0.895em";

/** The outline layer for one word. `start` is the index of its first letter in the title. */
export function StrokeOutline({ text, start, plain = false }: { text: string; start: number; plain?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={cn("hero-stroke-svg", plain && "hero-stroke-plain")}
      width="100%"
      height="100%"
    >
      <text x="0" y={BASELINE}>
        {Array.from(text).map((char, n) => (
          <tspan key={n} style={{ "--i": start + n } as CSSProperties}>
            {char}
          </tspan>
        ))}
      </text>
    </svg>
  );
}

/** A plain word of the title: the HTML text fills in with a wipe, under the drawn outline. */
export function StrokeWord({
  text,
  start,
  word,
  className,
}: {
  text: string;
  start: number;
  word: number;
  className?: string;
}): ReactNode {
  return (
    <span className={cn("relative inline-block", className)}>
      <span className="hero-fill inline-block" style={{ "--w": word } as CSSProperties}>
        {text}
      </span>
      <StrokeOutline text={text} start={start} plain />
    </span>
  );
}
