"use client";

/*
 * Hero title with a "tech text" sweep, after React Bits TechText (MIT + Commons Clause,
 * (c) 2026 David Haz, https://reactbits.dev/text-animations/tech-text).
 * Cut down for this page: no cursor, drag, click or intro. A lens sweeps one word, the letter
 * under it turns into a dashed outline inside a selection frame, then the next word takes over.
 * The real text stays in the DOM (for screen readers, search and selection); the canvas is
 * decoration only. With reduced motion the canvas never draws and the plain text shows.
 */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { StrokeOutline, StrokeWord } from "./hero-stroke";

type Box = { x1: number; y1: number; x2: number; y2: number };
type Art = { image: HTMLCanvasElement; left: number; top: number };
type Glyph = { char: string; box: Box; fill: Art; dashes: Art; outline: number };

const PASS = 3.6; // seconds for one sweep across a word
const REST = 0.5; // seconds between words
const LABEL_FONT = "10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const DASH: [number, number] = [4, 2];
const STROKE = 1.5;
const SPECKS = 12;

const approach = (current: number, target: number, dt: number, seconds: number) =>
  current + (target - current) * (1 - Math.exp(-dt / seconds));

const noise = (...values: number[]) => {
  let h = 2166136261;
  for (const value of values) {
    h = Math.imul(h ^ (value | 0), 16777619);
    h ^= h >>> 13;
    h = Math.imul(h, 0x5bd1e995);
    h ^= h >>> 15;
  }
  return (h >>> 0) / 4294967296;
};

function TechWord({
  text,
  active,
  onDone,
  start,
  word,
  className,
}: {
  text: string;
  active: boolean;
  onDone: () => void;
  /** Index of the first letter in the title, and of the word, for the stroke draw on load. */
  start: number;
  word: number;
  className?: string;
}) {
  const wordRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  const doneRef = useRef(onDone);
  const wakeRef = useRef<() => void>(() => {});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    activeRef.current = active;
    wakeRef.current();
  }, [active]);

  useEffect(() => {
    const word = wordRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!word || !canvas || !ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let glyphs: Glyph[] = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let ink = "#000";
    let accent = "#800000";
    let raf = 0;
    let last = 0;
    let clock = -1; // seconds into the current pass; -1 when idle
    let pulse = 0;
    let lensX = 0;
    const frame = { x1: 0, y1: 0, x2: 0, y2: 0, alpha: 0, index: -1 };

    const sprite = (glyph: Omit<Glyph, "fill" | "dashes" | "outline">, x: number, baseline: number, stroke: boolean): Art => {
      const pad = Math.ceil(STROKE * 2 + 4);
      const left = glyph.box.x1 - pad;
      const top = glyph.box.y1 - pad;
      const image = document.createElement("canvas");
      image.width = Math.max(1, Math.ceil((glyph.box.x2 - glyph.box.x1 + pad * 2) * dpr));
      image.height = Math.max(1, Math.ceil((glyph.box.y2 - glyph.box.y1 + pad * 2) * dpr));
      const c = image.getContext("2d");
      if (!c) return { image, left, top };
      c.setTransform(dpr, 0, 0, dpr, -left * dpr, -top * dpr);
      c.font = ctx.font;
      c.textBaseline = "alphabetic";
      if (stroke) {
        c.lineJoin = "round";
        c.lineWidth = STROKE * 2;
        c.strokeStyle = ink;
        c.setLineDash(DASH);
        c.strokeText(glyph.char, x, baseline);
        // Cut the inner half of the stroke, so only the outer dashes stay.
        c.globalCompositeOperation = "destination-out";
        c.fillText(glyph.char, x, baseline);
      } else {
        c.fillStyle = ink;
        c.fillText(glyph.char, x, baseline);
      }
      return { image, left, top };
    };

    // Lay the glyphs out exactly where the browser draws the real text.
    const layout = () => {
      const css = getComputedStyle(word);
      const size = parseFloat(css.fontSize);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      // Read the color from the wrapper: the word itself turns transparent once the canvas draws.
      ink = getComputedStyle(word.parentElement ?? word).color;
      // The frame takes --tech-accent from the title when set (the bright landing red on the dark hero), else maroon.
      accent =
        getComputedStyle(word).getPropertyValue("--tech-accent").trim() ||
        getComputedStyle(document.documentElement).getPropertyValue("--color-maroon-600").trim() ||
        accent;
      ctx.font = `${css.fontWeight} ${size}px ${css.fontFamily}`;
      ctx.letterSpacing = css.letterSpacing === "normal" ? "0px" : css.letterSpacing;
      ctx.textBaseline = "alphabetic";
      const m = ctx.measureText(text);
      const originX = (width - word.offsetWidth) / 2;
      // The line box is centred in the canvas; CSS centres the font's content area in the line box.
      const baseline = height / 2 + (m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2;
      glyphs = [];
      let prefix = "";
      for (const char of Array.from(text)) {
        prefix += char;
        const own = ctx.measureText(char);
        const x = originX + ctx.measureText(prefix).width - own.width;
        if (!char.trim()) continue;
        const base = {
          char,
          box: {
            x1: x - own.actualBoundingBoxLeft,
            y1: baseline - own.actualBoundingBoxAscent,
            x2: x + own.actualBoundingBoxRight,
            y2: baseline + own.actualBoundingBoxDescent,
          },
        };
        glyphs.push({ ...base, fill: sprite(base, x, baseline, false), dashes: sprite(base, x, baseline, true), outline: 0 });
      }
      frame.index = -1;
      setReady(true);
      wake();
    };

    const blit = (art: Art) => ctx.drawImage(art.image, Math.round(art.left * dpr), Math.round(art.top * dpr));

    const perimeterPoint = (distance: number, w: number, h: number): [number, number, number, number] => {
      let d = ((distance % (2 * (w + h))) + 2 * (w + h)) % (2 * (w + h));
      if (d < w) return [frame.x1 + d, frame.y1, 0, -1];
      d -= w;
      if (d < h) return [frame.x2, frame.y1 + d, 1, 0];
      d -= h;
      if (d < w) return [frame.x2 - d, frame.y2, 0, 1];
      d -= w;
      return [frame.x1, frame.y2 - d, -1, 0];
    };

    const drawSpecks = (a: number) => {
      const w = frame.x2 - frame.x1;
      const h = frame.y2 - frame.y1;
      if (w < 2 || h < 2) return;
      const perimeter = 2 * (w + h);
      const seed = frame.index + 1;
      for (let k = 0; k < SPECKS; k++) {
        const period = 0.5 + noise(seed, k, 11) * 1.2;
        const t = pulse / period + noise(seed, k, 17);
        const cycle = Math.floor(t);
        const life = t - cycle;
        if (life > 0.7) continue;
        const [px, py, nx, ny] = perimeterPoint(noise(seed, k, cycle) * perimeter, w, h);
        const pick = noise(seed, k, cycle, 2);
        const size = pick < 0.5 ? 2 : pick < 0.75 ? 3 : pick < 0.9 ? 5 : 8;
        const out = (size >= 8 ? 9 : 4) + Math.floor(noise(seed, k, cycle, 1) * 4) * 3;
        const x = Math.round(px + nx * out);
        const y = Math.round(py + ny * out);
        const tone = noise(seed, k, cycle, 3);
        const blink = life < 0.06 || (life > 0.32 && life < 0.36) ? 0.35 : 1;
        ctx.globalAlpha = a * (0.3 + 0.5 * tone) * blink;
        const left = Math.round(x - size / 2);
        const top = Math.round(y - size / 2);
        if (tone < 0.3 || size >= 8) ctx.strokeRect(left + 0.5, top + 0.5, size, size);
        else ctx.fillRect(left, top, size, size);
      }
      // Two light pulses run around the frame.
      for (let j = 0; j < 2; j++) {
        const head = (pulse * 0.42 + j * 0.5) * perimeter;
        for (let i = 0; i < 4; i++) {
          const [x, y] = perimeterPoint(head - i * 6, w, h);
          const size = i === 0 ? 3 : 2;
          ctx.globalAlpha = a * [0.95, 0.55, 0.32, 0.16][i]!;
          ctx.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), size, size);
        }
      }
    };

    const drawFrame = () => {
      const glyph = glyphs[frame.index];
      if (!glyph || frame.alpha < 0.01) return;
      const a = frame.alpha;
      ctx.save();
      ctx.letterSpacing = "0px";
      const crisp = (v: number) => (Math.round(v * dpr) + 0.5) / dpr;
      const [x1, y1, x2, y2] = [crisp(frame.x1), crisp(frame.y1), crisp(frame.x2), crisp(frame.y2)];
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = accent;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5 * a;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      ctx.globalAlpha = 0.95 * a;
      const corners: [number, number][] = [
        [x1, y1],
        [x2, y1],
        [x2, y2],
        [x1, y2],
      ];
      for (const [cx, cy] of corners) {
        ctx.fillRect(Math.round(cx) - 2, Math.round(cy) - 2, 5, 5);
      }
      drawSpecks(a);
      ctx.font = LABEL_FONT;
      ctx.textBaseline = "bottom";
      ctx.globalAlpha = 0.62 * a;
      const label = `${glyph.char}  ${Math.round(glyph.box.x2 - glyph.box.x1)} × ${Math.round(glyph.box.y2 - glyph.box.y1)}`;
      ctx.fillText(label, Math.round(frame.x1), Math.round(frame.y1) - 7);
      ctx.restore();
    };

    const tick = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      pulse += dt;

      if (activeRef.current && clock < 0) clock = 0;
      const sweeping = clock >= 0 && clock < PASS && glyphs.length > 0;
      if (clock >= 0) {
        clock += dt;
        if (clock >= PASS + REST) {
          clock = -1;
          activeRef.current = false; // do not restart before React passes the turn on
          doneRef.current();
        }
      }

      let focus = -1;
      if (sweeping) {
        const left = glyphs[0]!.box.x1;
        const right = glyphs[glyphs.length - 1]!.box.x2;
        lensX = left + (right - left) * (0.5 - 0.5 * Math.cos((Math.PI * clock) / PASS));
        let best = Infinity;
        glyphs.forEach((g, i) => {
          const d = lensX < g.box.x1 ? g.box.x1 - lensX : lensX > g.box.x2 ? lensX - g.box.x2 : 0;
          if (d < best) {
            best = d;
            focus = i;
          }
        });
      }

      if (focus >= 0) {
        const b = glyphs[focus]!.box;
        const target: [number, number, number, number] = [b.x1 - 6, b.y1 - 6, b.x2 + 6, b.y2 + 6];
        if (frame.index < 0 || frame.alpha < 0.02) [frame.x1, frame.y1, frame.x2, frame.y2] = target;
        frame.x1 = approach(frame.x1, target[0], dt, 0.08);
        frame.y1 = approach(frame.y1, target[1], dt, 0.08);
        frame.x2 = approach(frame.x2, target[2], dt, 0.08);
        frame.y2 = approach(frame.y2, target[3], dt, 0.08);
        frame.index = focus;
      }
      frame.alpha = approach(frame.alpha, focus >= 0 ? 1 : 0, dt, 0.1);

      let settling = frame.alpha > 0.01;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      glyphs.forEach((glyph, i) => {
        const target = i === focus ? 1 : 0;
        glyph.outline = approach(glyph.outline, target, dt, 0.09);
        if (Math.abs(glyph.outline - target) < 0.002) glyph.outline = target;
        else settling = true;
        if (glyph.outline < 1) {
          ctx.globalAlpha = 1 - glyph.outline;
          blit(glyph.fill);
        }
        if (glyph.outline > 0) {
          ctx.globalAlpha = glyph.outline;
          blit(glyph.dashes);
        }
      });
      ctx.globalAlpha = 1;
      drawFrame();

      if (clock >= 0 || settling) raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    wakeRef.current = wake;

    const observer = new ResizeObserver(layout);
    observer.observe(word);
    document.fonts.ready.then(layout);

    return () => {
      cancelAnimationFrame(raf);
      wakeRef.current = () => {};
      observer.disconnect();
    };
  }, [text]);

  return (
    <span className={cn("relative inline-block", className)} style={{ "--w": word } as CSSProperties}>
      <span ref={wordRef} className={cn("hero-fill inline-block", ready && "text-transparent")}>
        {text}
      </span>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="hero-fill pointer-events-none absolute -inset-x-[0.7em] -inset-y-[0.6em] h-[calc(100%+1.2em)] w-[calc(100%+1.4em)]"
      />
      <StrokeOutline text={text} start={start} />
    </span>
  );
}

/** The journey card plays first; keep in step with `--hb-intro` in landing.css, in ms. */
const INTRO_MS = 2000;
/** How long the stroke draw on load runs before the first sweep starts, in ms. */
const BUILD_MS = INTRO_MS + 2600;

/** "Your thesis. One clear path." The title draws itself on load (hero-stroke.tsx). Then the
 * sweep moves between "thesis" and "path" in turn. */
export function TechTitle({ id, className, onDark = false }: { id?: string; className?: string; onDark?: boolean }) {
  const [turn, setTurn] = useState(-1);
  useEffect(() => {
    const timer = window.setTimeout(() => setTurn(0), BUILD_MS);
    return () => window.clearTimeout(timer);
  }, []);
  const accent = onDark ? "text-[var(--landing-red)]" : "text-maroon-600";
  // Letter indexes ("start") count from the first letter, so the draw runs across the title.
  return (
    <h1 id={id} className={cn(onDark && "[--tech-accent:var(--landing-red)]", className)}>
      <span className="block">
        <StrokeWord text="Your" start={0} word={0} />{" "}
        <TechWord
          text="thesis."
          active={turn === 0}
          onDone={() => setTurn(1)}
          start={4}
          word={1}
          className={onDark ? accent : undefined}
        />
      </span>{" "}
      <span className="block">
        <StrokeWord text="One" start={11} word={2} /> <StrokeWord text="clear" start={14} word={3} />{" "}
        <TechWord text="path." active={turn === 1} onDone={() => setTurn(0)} start={19} word={4} className={accent} />
      </span>
    </h1>
  );
}
