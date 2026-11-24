import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/*
 * The "ThesIsko" wordmark, drawn as a stroke on load, then filled with a wipe from the left.
 * After React Bits StrokeText (MIT + Commons Clause, (c) 2026 David Haz,
 * https://reactbits.dev/text-animations/stroke-text), rebuilt with CSS keyframes (landing.css)
 * so it needs no script and no animation library.
 *
 * The SVG copies the HTML wordmark box: Source Serif 4 at 600 measures 424.1 units wide at a
 * 100-unit size (letter-spacing -0.01em), with a 104-unit ascent and a 34-unit descent.
 * textLength holds the width if the fallback serif shows before the web font loads.
 */
const WIDTH = 424.1;
const ASCENT = 104;
const DESCENT = 34;
const PARTS = [
  { text: "Thes", fill: "var(--color-foreground)", dark: "#ffffff" },
  { text: "Isko", fill: "var(--color-maroon-600)", dark: "var(--color-gold-300)" },
];

export function StrokeWordmark({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  let i = 0;
  const letters = PARTS.map((part) => ({ ...part, fill: onDark ? part.dark : part.fill })).flatMap((part) =>
    Array.from(part.text).map((char) => ({ char, fill: part.fill, index: i++ })),
  );
  const textProps = {
    x: 0,
    y: ASCENT,
    fontSize: 100,
    textLength: WIDTH,
    lengthAdjust: "spacingAndGlyphs" as const,
    className: "font-serif font-semibold",
  };
  return (
    <span className={cn("stroke-wordmark inline-block", className)}>
      <svg
        viewBox={`0 0 ${WIDTH} ${ASCENT + DESCENT}`}
        width={`${WIDTH / 100}em`}
        height={`${(ASCENT + DESCENT) / 100}em`}
        overflow="visible"
        aria-hidden="true"
        className="block"
      >
        <text {...textProps} fill="none" stroke={onDark ? "var(--color-gold-300)" : "var(--color-maroon-600)"} strokeWidth={2.4} strokeLinejoin="round">
          {letters.map((l) => (
            <tspan key={l.index} className="stroke-wordmark-line" style={{ "--i": l.index } as CSSProperties}>
              {l.char}
            </tspan>
          ))}
        </text>
        <text {...textProps} className={`${textProps.className} stroke-wordmark-fill`}>
          {letters.map((l) => (
            <tspan key={l.index} fill={l.fill}>
              {l.char}
            </tspan>
          ))}
        </text>
      </svg>
    </span>
  );
}
