"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowUp, Check, Layers, MessageSquare, MessagesSquare, Pin, Tag, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Versions features: four equal cards in the order of one revision loop (upload, feedback,
 * fix, reply). Each card has a solid border and a fixed-height stage. The cards play a short
 * scene of their feature one at a time, in a loop (`.fb-*` keyframes in landing.css). The
 * playing card has a maroon border. Hover a card to play it and hold it.
 * The other cards, and all cards with reduced motion, show the final frame. Sample content only.
 */

const chip = "rounded-full px-2.5 py-1 text-xs font-medium";

/** scene: the length of the scene keyframes in seconds. The turn passes on at PLAY of it,
 * before the keyframes fade out for a loop. */
type Feature = { name: string; line: string; icon: LucideIcon; seconds: number; scene: ReactNode };

const PLAY = 0.88;

const at = (d: number) => ({ "--d": `${d}s` }) as CSSProperties;

const FEATURES: Feature[] = [
  {
    name: "Version history",
    seconds: 3.6,
    line: "Track every upload.",
    icon: Layers,
    scene: (
      <div className="w-full space-y-3">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li className={cn(chip, "fb-ver bg-white text-neutral-600 shadow-[0_0_0_1px_rgb(30_22_23/0.08)]")} style={at(0)}>
            v1
          </li>
          <li className={cn(chip, "fb-ver bg-white text-neutral-600 shadow-[0_0_0_1px_rgb(30_22_23/0.08)]")} style={at(0.25)}>
            v2
          </li>
          <li className={cn(chip, "fb-ver-new relative overflow-hidden bg-maroon-600 text-white")}>v3 · current</li>
        </ol>
        <div className="flex items-center gap-2 text-[11px] text-neutral-500">
          <ArrowUp aria-hidden="true" strokeWidth={2} className="fb-up size-3.5 shrink-0 text-maroon-600" />
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200">
            <span className="fb-bar block h-full rounded-full bg-gradient-to-r from-maroon-600 to-gold-400" />
          </span>
          <span>chapter-4.pdf</span>
        </div>
      </div>
    ),
  },
  {
    name: "Pinned feedback",
    seconds: 4.2,
    line: "Always in context.",
    icon: MessageSquare,
    scene: (
      <div className="relative w-full pt-3">
        <Pin aria-hidden="true" strokeWidth={2} className="fb-pin absolute -top-1 left-4 z-10 size-5 fill-maroon-600 text-maroon-700" />
        <p className="fb-note rounded-xl bg-gold-100 px-3 py-2.5 text-xs text-maroon-900">
          <span className="font-semibold">p. 14 · v3</span> <span className="fb-mark">Clarify the sampling method.</span>
        </p>
      </div>
    ),
  },
  {
    name: "Fix tags",
    seconds: 3.6,
    line: "Link each fix to a comment.",
    icon: Tag,
    scene: (
      <div className="flex w-full items-center gap-1.5 text-xs">
        <span className={cn(chip, "fb-fix shrink-0 bg-maroon-50 text-maroon-700")}>Fix #3</span>
        <svg aria-hidden="true" viewBox="0 0 60 8" className="h-2 min-w-5 flex-1 overflow-visible text-maroon-600">
          <line x1="0" y1="4" x2="54" y2="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="fb-link" />
          <path d="M53 1 L58 4 L53 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className={cn(chip, "fb-target relative shrink-0 bg-green-100 text-neutral-700")}>
          Comment 12
          <span className="fb-check absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full bg-green-600 text-white">
            <Check strokeWidth={3} className="size-2.5" />
          </span>
        </span>
      </div>
    ),
  },
  {
    name: "Threaded replies",
    seconds: 4.8,
    line: "Clear discussions.",
    icon: MessagesSquare,
    scene: (
      <div className="w-full space-y-2 text-xs">
        <p className="fb-msg w-fit origin-bottom-left rounded-xl rounded-bl-sm bg-white px-3 py-2 text-neutral-700 shadow-[0_0_0_1px_rgb(30_22_23/0.08)]">
          <span className="font-semibold">Adviser:</span> Add the 2024 data.
        </p>
        {/* The typing bubble and the reply share one grid cell, so the reply can wrap. */}
        <div className="ml-6 grid justify-items-start [&>*]:col-start-1 [&>*]:row-start-1">
          <p className="fb-typing flex h-8 items-center gap-1 rounded-xl bg-maroon-50 px-3">
            <span className="fb-dot size-1.5 rounded-full bg-maroon-600" style={at(0)} />
            <span className="fb-dot size-1.5 rounded-full bg-maroon-600" style={at(0.15)} />
            <span className="fb-dot size-1.5 rounded-full bg-maroon-600" style={at(0.3)} />
          </p>
          <p className="fb-reply origin-bottom-left rounded-xl rounded-bl-sm bg-maroon-50 px-3 py-2 text-maroon-900">
            <span className="font-semibold">Student:</span> Added in v3, p. 22.
          </p>
        </div>
      </div>
    ),
  },
];

export function FeatureCards({ className }: { className?: string }) {
  // -1 until the effect runs, so the server render and reduced motion show every card at rest.
  const [active, setActive] = useState(-1);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (held) return;
    // The first card starts a moment after load; each next card when the one before ends.
    const ms = active < 0 ? 400 : (FEATURES[active]?.seconds ?? 3.6) * PLAY * 1000;
    const timer = window.setTimeout(() => setActive((i) => (i + 1) % FEATURES.length), ms);
    return () => window.clearTimeout(timer);
  }, [active, held]);

  return (
    <ul className={cn("landing-stagger grid gap-4 md:grid-cols-2 xl:grid-cols-4", className)}>
      {FEATURES.map((f, i) => {
        const on = i === active;
        return (
          <li
            key={f.name}
            data-active={on}
            onPointerEnter={() => {
              if (active < 0) return;
              setActive(i);
              setHeld(true);
            }}
            onPointerLeave={() => setHeld(false)}
            style={{ "--i": i } as CSSProperties}
            className={cn(
              "fb-card flex flex-col rounded-2xl border bg-white p-4 transition-[border-color,box-shadow] duration-300",
              on
                ? "border-maroon-600/55 shadow-[0_10px_30px_-18px_rgb(128_0_0/0.5)]"
                : "border-neutral-200",
            )}
          >
            <div
              aria-hidden="true"
              className="flex min-h-32 items-center rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-5"
            >
              {f.scene}
            </div>
            <div className="mt-4 flex items-start gap-3 px-1">
              <span className="fb-icon flex size-9 shrink-0 items-center justify-center rounded-lg bg-maroon-50 text-maroon-600">
                <f.icon aria-hidden="true" strokeWidth={1.5} className="size-[18px]" />
              </span>
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold text-neutral-900">{f.name}</h3>
                <p className="mt-0.5 text-sm text-neutral-600">{f.line}</p>
              </div>
              <span
                className={cn(
                  "ml-auto font-mono text-[11px] tabular-nums transition-colors duration-300",
                  on ? "text-maroon-600" : "text-neutral-400",
                )}
              >
                0{i + 1}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
