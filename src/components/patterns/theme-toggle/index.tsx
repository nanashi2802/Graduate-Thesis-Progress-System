"use client";
// Source: adapted from React Bits "SquishSwitch" (https://reactbits.dev/micro/squish-switch),
// Copyright (c) 2026 David Haz, MIT + Commons Clause License Condition v1.0. Supplied by the owner (UX-D-13).
// Changes: TypeScript, project tokens instead of fixed colors, Tailwind instead of a CSS file, the theme
// logic of UX-D-01 (System by default, "Use system" after a choice), and a thumb that is a sun which morphs
// into a crescent moon (rays turn away, the disc grows, a cutout slides in). One shape, never two icons.
// Motion: the thumb stretches with speed and squashes at the end (velocity spring). With
// `prefers-reduced-motion: reduce`, it jumps and does not stretch or morph over time.
import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform, useVelocity } from "motion/react";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent } from "react";
import { applyTheme, isThemeChoice, resolveTheme, THEME_KEY, type ThemeChoice } from "@/lib/theme";

export type ThemeToggleProps = { compact?: boolean };

// ---- Theme choice: localStorage, or memory when storage is blocked ----
let memoryChoice: ThemeChoice = "system";
const listeners = new Set<() => void>();
const DARK_QUERY = "(prefers-color-scheme: dark)";

function readChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return isThemeChoice(v) ? v : "system";
  } catch {
    return memoryChoice;
  }
}
function subscribeChoice(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}
function subscribeOs(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
function writeChoice(next: ThemeChoice) {
  memoryChoice = next;
  try {
    if (next === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, next);
  } catch {
    // Storage can be blocked. The choice still applies to this page.
  }
  listeners.forEach((l) => l());
}

// ---- Squish physics (from SquishSwitch) ----
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const FLOW_SPRING = { stiffness: 320, damping: 40, mass: 0.6 };
const SWELL_SPRING = { stiffness: 520, damping: 34, mass: 0.6 };
const MAX_STRETCH = 0.4;
const STRETCH_SPEED = 600;
const TAP_SLOP = { fine: 4, coarse: 8 };
const STRETCH = 36; // percent
const SPEED = 50;
const HOVER_SCALE = 1.035;

type Grip = { id: number; grab: number | null; moved: boolean; startX: number; onAtPress: boolean; slop: number };

// ---- The sun-to-moon thumb ----
const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

function SunMoon({ moon, instant, maskId }: { moon: boolean; instant: boolean; maskId: string }) {
  const morph = instant ? { duration: 0 } : { type: "spring" as const, stiffness: 260, damping: 22 };
  return (
    <svg viewBox="0 0 24 24" className="size-full overflow-visible" aria-hidden="true" focusable="false">
      <defs>
        <mask id={maskId}>
          <rect x="-4" y="-4" width="32" height="32" fill="white" />
          {/* The cutout waits off the disc for the sun, then slides over it to cut the crescent. */}
          <motion.circle
            data-part="cutout"
            r="7.5"
            fill="black"
            initial={false}
            animate={moon ? { cx: 16.5, cy: 7.5 } : { cx: 30, cy: -6 }}
            transition={morph}
          />
        </mask>
      </defs>
      <motion.g
        data-part="rays"
        stroke="var(--color-gold-700)"
        strokeWidth="1.75"
        strokeLinecap="round"
        style={{ originX: "12px", originY: "12px" }}
        initial={false}
        animate={moon ? { opacity: 0, scale: 0.4, rotate: 90 } : { opacity: 1, scale: 1, rotate: 0 }}
        transition={morph}
      >
        {RAY_ANGLES.map((a) => (
          <line key={a} x1="12" y1="2.2" x2="12" y2="4.2" transform={`rotate(${a} 12 12)`} />
        ))}
      </motion.g>
      <motion.circle
        data-part="body"
        cx="12"
        cy="12"
        fill="var(--color-progress)"
        stroke="var(--color-gold-700)"
        strokeWidth="1.25"
        mask={`url(#${maskId})`}
        initial={false}
        animate={{ r: moon ? 8.6 : 5.2 }}
        transition={morph}
      />
    </svg>
  );
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  // The server knows neither the choice nor the OS setting, so it renders the light, System state.
  const choice = useSyncExternalStore(subscribeChoice, readChoice, () => "system" as const);
  const osDark = useSyncExternalStore(subscribeOs, () => window.matchMedia(DARK_QUERY).matches, () => false);
  const theme = resolveTheme(choice, osDark);
  const on = theme === "dark";
  useEffect(() => applyTheme(theme), [theme]);

  const reduce = useReducedMotion() ?? false;
  const width = compact ? 52 : 60;
  const height = compact ? 28 : 32;
  const inset = Math.max(3, Math.round(height * 0.11));
  const thumb = height - inset * 2;
  const min = inset;
  const max = width - inset - thumb;
  const mid = (min + max) / 2;

  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLSpanElement>(null);
  const grip = useRef<Grip | null>(null);
  const onRef = useRef(on);
  useEffect(() => {
    onRef.current = on;
  }, [on]);
  const skipClick = useRef(false);
  const maskId = `theme-cut-${useId().replace(/:/g, "")}`;

  const x = useMotionValue(on ? max : min);
  const flow = useSpring(useVelocity(x), FLOW_SPRING);
  const swell = useSpring(1, SWELL_SPRING);
  const gain = reduce ? 0 : STRETCH / 100;
  const stretchOf = (v: number) => 1 + Math.min(MAX_STRETCH, Math.abs(v) / STRETCH_SPEED) * gain;
  const scaleX = useTransform([flow, swell], ([v, s]: number[]) => stretchOf(v!) * s!);
  const scaleY = useTransform([flow, swell], ([v, s]: number[]) => s! / stretchOf(v!));

  const commit = (next: boolean) => {
    if (next === onRef.current) return;
    onRef.current = next;
    writeChoice(next ? "dark" : "light");
  };

  useEffect(() => {
    if (dragging) return undefined;
    const target = on ? max : min;
    if (reduce) {
      x.jump(target);
      return undefined;
    }
    const controls = animate(x, target, {
      type: "spring",
      stiffness: 170 - (50 - SPEED) * 1.1,
      damping: 21.5,
      mass: 0.9,
      restDelta: 0.001,
      restSpeed: 0.01,
    });
    return () => controls.stop();
  }, [on, dragging, min, max, reduce, x]);

  const localX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const scale = rect.width / (el.offsetWidth || rect.width) || 1;
    return (clientX - rect.left) / scale;
  };
  const down = (e: PointerEvent<HTMLButtonElement>) => {
    if (grip.current || e.button !== 0) return;
    grip.current = {
      id: e.pointerId,
      grab: null,
      moved: false,
      startX: e.clientX,
      onAtPress: onRef.current,
      slop: e.pointerType === "touch" ? TAP_SLOP.coarse : TAP_SLOP.fine,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    setDragging(true);
  };
  const move = (e: PointerEvent<HTMLButtonElement>) => {
    const g = grip.current;
    if (!g || g.id !== e.pointerId) return;
    const lx = localX(e.clientX);
    if (g.grab === null) {
      g.grab = lx - x.get();
      return;
    }
    if (!g.moved && Math.abs(e.clientX - g.startX) > g.slop) g.moved = true;
    if (!g.moved) return;
    const nx = clamp(lx - g.grab, min, max);
    x.set(nx);
    commit(nx > mid);
  };
  const up = (e: { pointerId: number; currentTarget: HTMLButtonElement }, cancelled: boolean) => {
    const g = grip.current;
    if (!g || g.id !== e.pointerId) return;
    grip.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    if (cancelled) commit(g.onAtPress);
    else if (!g.moved) commit(!onRef.current);
    skipClick.current = true;
    setTimeout(() => {
      skipClick.current = false;
    }, 0);
    setDragging(false);
  };
  const click = () => {
    // Pointer taps are handled in `up`. This path is the keyboard (Space, Enter).
    if (skipClick.current) {
      skipClick.current = false;
      return;
    }
    commit(!onRef.current);
  };
  const key = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Escape" && grip.current) up({ pointerId: grip.current.id, currentTarget: e.currentTarget }, true);
  };

  const label = on ? "Dark theme is on. Switch to light." : "Light theme is on. Switch to dark.";

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Dark theme"
        title={choice === "system" ? `${label} (follows your system setting)` : label}
        data-held={dragging ? "" : undefined}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={(e) => up(e, false)}
        onPointerCancel={(e) => up(e, true)}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse" && !reduce) swell.set(HOVER_SCALE);
        }}
        onPointerLeave={() => swell.set(1)}
        onKeyDown={key}
        onClick={click}
        className="relative inline-block shrink-0 cursor-pointer touch-pan-y rounded-full outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring data-held:cursor-grabbing"
      >
        <span
          ref={trackRef}
          className="relative block rounded-full border border-input bg-muted"
          style={{ width, height }}
        >
          <motion.span
            data-slot="theme-thumb"
            data-shape={on ? "moon" : "sun"}
            aria-hidden="true"
            className="absolute left-0 block"
            style={{ top: inset - 1, width: thumb, height: thumb, x, scaleX, scaleY }}
          >
            <SunMoon moon={on} instant={reduce} maskId={maskId} />
          </motion.span>
        </span>
      </button>
      {choice !== "system" ? (
        <button
          type="button"
          onClick={() => writeChoice("system")}
          className="text-[0.8rem] font-medium text-link underline-offset-4 outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
        >
          Use system
        </button>
      ) : null}
    </span>
  );
}
