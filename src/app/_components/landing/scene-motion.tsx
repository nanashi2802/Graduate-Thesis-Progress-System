"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { StatusMark, type StatusMarkStatus } from "./status-mark";
import { ThoughtLine } from "./thought-line";

/*
 * Two feature-card scenes that need state for the length of a turn (feature-cards.tsx passes
 * `active`). When the card is not playing, and with reduced motion, each shows its finished frame.
 * The timings fit inside the 3.6s and 4.8s keyframes of the same card (`.fb-*` in landing.css).
 */

const chip = "rounded-full px-2.5 py-1 text-xs font-medium";

function playsMotion() {
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Fix tags: the Fix chip shows idle, then in progress while the link draws, then done. */
export function FixTagScene({ active }: { active: boolean }) {
  // The state changes only in timer callbacks. "done" is the finished frame.
  const [status, setStatus] = useState<StatusMarkStatus>("done");

  useEffect(() => {
    if (!active || !playsMotion()) return;
    const timers = [
      window.setTimeout(() => setStatus("pending"), 0),
      window.setTimeout(() => setStatus("running"), 450),
      window.setTimeout(() => setStatus("done"), 1550),
    ];
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      setStatus("done");
    };
  }, [active]);

  return (
    <div className="flex w-full items-center gap-1.5 text-xs">
      <span className={cn(chip, "fb-fix shrink-0 bg-maroon-50 px-2 text-maroon-700")}>
        <StatusMark status={status} size={13} label="Fix #3" className="gap-1" />
      </span>
      <svg aria-hidden="true" viewBox="0 0 60 8" className="h-2 min-w-3 flex-1 overflow-visible text-maroon-600">
        <line x1="0" y1="4" x2="54" y2="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="fb-link" />
        <path d="M53 1 L58 4 L53 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span className={cn(chip, "fb-target shrink-0 bg-green-100 px-2 text-neutral-700")}>Comment 12</span>
    </div>
  );
}

type ReplyPhase = "rest" | "wait" | "work";

/** Threaded replies: the Adviser asks, the Student's thought line runs and settles, the reply lands. */
export function ReplyScene({ active }: { active: boolean }) {
  // "rest" is the finished frame: the line has settled.
  const [phase, setPhase] = useState<ReplyPhase>("rest");

  useEffect(() => {
    if (!active || !playsMotion()) return;
    const timers = [
      window.setTimeout(() => setPhase("wait"), 0),
      window.setTimeout(() => setPhase("work"), 900),
      window.setTimeout(() => setPhase("rest"), 2200),
    ];
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      setPhase("rest");
    };
  }, [active]);

  return (
    <div className="w-full space-y-2 text-xs">
      <p className="fb-msg w-fit origin-bottom-left rounded-xl rounded-bl-sm bg-white px-3 py-2 text-neutral-700 shadow-[0_0_0_1px_rgb(30_22_23/0.08)]">
        <span className="font-semibold">Adviser:</span> Add the 2024 data.
      </p>
      <div className="ml-6 space-y-2">
        <div className={cn("transition-opacity duration-300", phase === "wait" ? "opacity-0" : "opacity-100")}>
          <ThoughtLine label="Replying…" doneLabel="Replied in" working={phase !== "rest"} elapsed={1.3} />
        </div>
        <p className="fb-reply origin-bottom-left rounded-xl rounded-bl-sm bg-maroon-50 px-3 py-2 text-maroon-900">
          <span className="font-semibold">Student:</span> Added in v3, p. 22.
        </p>
      </div>
    </div>
  );
}
