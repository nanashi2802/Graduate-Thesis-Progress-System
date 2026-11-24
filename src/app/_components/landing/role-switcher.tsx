"use client";

// Roles section: four pills (a WAI-ARIA tab list) switch one tile with its avatar and description.
// Inside the tile, a short tour highlights each feature in turn. The avatar holds a prop for the
// highlighted feature, and a small animated scene shows it. The tour pauses on hover, on focus
// and with the Pause button (WCAG 2.2.2), and it does not run under reduced motion.
// The pills move like React Bits JellyRadio: the chosen pill swells and pushes its neighbours out
// (`.role-pill` in landing.css).
import { useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Check, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChibiRig, type Act, type PropKey, type RoleKey } from "./chibi-rig";
import { FeatureScene, type SceneKey } from "./feature-scenes";

/** pos: the stage corner for the scene card (t/b = top/bottom, l/r = left/right). The avatar
 * stands on the other side and faces the card. */
type Feature = { text: string; label: string; scene: SceneKey; prop: PropKey; act: Act; pos: "tl" | "tr" | "bl" | "br" };
type Role = { key: RoleKey; name: string; line: string; does: Feature[] };

const ROLES: Role[] = [
  {
    key: "student",
    name: "Student",
    line: "Always knows the next step.",
    does: [
      { text: "See your current milestone and the one thing to do next.", label: "Your next step", scene: "track", prop: "tablet-track", act: "show", pos: "tr" },
      { text: "Upload each draft as a new version.", label: "Version 3 uploaded", scene: "upload", prop: "paper-upload", act: "raise", pos: "bl" },
      { text: "Reply to comments and show what you fixed.", label: "Reply sent", scene: "reply", prop: "tablet-chat", act: "hand-up", pos: "br" },
      { text: "Book consultations and pick a defense date.", label: "Consultation booked", scene: "book", prop: "calendar-one", act: "cheer", pos: "bl" },
    ],
  },
  {
    key: "adviser",
    name: "Adviser",
    line: "Guides every advisee from one place.",
    does: [
      { text: "Review each version and leave comments pinned to it.", label: "Comments pinned to v3", scene: "pins", prop: "paper-pins", act: "show", pos: "tr" },
      { text: "Keep the consultation log without extra paperwork.", label: "Consultation logged", scene: "log", prop: "notebook", act: "front", pos: "tl" },
      { text: "Endorse a thesis when it is ready for the panel.", label: "Endorsed for the panel", scene: "endorse", prop: "paper-check", act: "raise", pos: "br" },
      { text: "See which advisees need you today.", label: "2 advisees need you", scene: "advisees", prop: "tablet-list", act: "show", pos: "tl" },
    ],
  },
  {
    key: "panel",
    name: "Panel Member",
    line: "Reads, comments and evaluates.",
    does: [
      { text: "Open the manuscript once you are appointed.", label: "Manuscript open", scene: "open", prop: "book", act: "front", pos: "tr" },
      { text: "Comment on the version under review.", label: "Comment added", scene: "comment", prop: "paper-pins", act: "show", pos: "tl" },
      { text: "Record your evaluation on defense day.", label: "Evaluation recorded", scene: "evaluate", prop: "clipboard", act: "front", pos: "br" },
      { text: "Share the dates you are free for defenses.", label: "Free dates shared", scene: "dates", prop: "calendar-many", act: "hand-up", pos: "tl" },
    ],
  },
  {
    key: "coordinator",
    name: "Coordinator",
    line: "Keeps the whole program moving.",
    does: [
      { text: "Create accounts and appoint committees and panels.", label: "Panel appointed", scene: "appoint", prop: "people", act: "raise", pos: "bl" },
      { text: "Check documents and confirm defense dates and rooms.", label: "Documents checked", scene: "check", prop: "clipboard", act: "front", pos: "tr" },
      { text: "Close each stage so the next one opens.", label: "Next stage open", scene: "close", prop: "tablet-track", act: "cheer", pos: "br" },
      { text: "See every thesis, and what holds it up, in one view.", label: "Every thesis in view", scene: "overview", prop: "tablet-bars", act: "show", pos: "tl" },
    ],
  },
];

const DEFAULT_ROLE: Role = ROLES[0] as Role;

/** Jelly pills: the chosen pill grows by SWELL of its width; its neighbours move out by half
 * of that growth plus BARGE pixels. */
const SWELL = 0.1;
const BARGE = 6;

export function RoleSwitcher() {
  const [active, setActive] = useState(0);
  // Slide direction for the role switch: 1 = the new role comes from the right, -1 = from the left.
  const [dir, setDir] = useState(1);
  const [feature, setFeature] = useState(0);
  const [paused, setPaused] = useState(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const tablist = useRef<HTMLDivElement>(null);

  // The push depends on the width of the chosen pill, so measure it after each switch.
  useLayoutEffect(() => {
    const measure = () => {
      const width = tabs.current[active]?.offsetWidth ?? 0;
      tablist.current?.style.setProperty("--jr-push", `${(width * SWELL) / 2 + BARGE}px`);
    };
    measure();
    document.fonts?.ready.then(measure);
  }, [active]);
  // The index always points into ROLES; the fallbacks only satisfy the strict index check.
  const role = ROLES[active] ?? DEFAULT_ROLE;
  const current = role.does[feature] ?? (role.does[0] as Feature);
  const cardLeft = current.pos.endsWith("l");

  function select(i: number, d = i >= active ? 1 : -1) {
    if (i === active) return;
    setDir(d);
    setActive(i);
    setFeature(0);
  }

  // Arrow keys move between pills and select them; Home and End jump to the ends.
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const last = ROLES.length - 1;
    const next =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? (active + 1) % ROLES.length
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? (active - 1 + ROLES.length) % ROLES.length
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : null;
    if (next === null) return;
    e.preventDefault();
    const forward = e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "End";
    const back = e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "Home";
    select(next, forward ? 1 : back ? -1 : undefined);
    tabs.current[next]?.focus();
  }

  return (
    <div className="mt-10">
      <div ref={tablist} role="tablist" aria-label="Roles" onKeyDown={onKeyDown} className="flex flex-wrap gap-2.5">
        {ROLES.map((r, i) => {
          const selected = i === active;
          return (
            <button
              key={r.key}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              id={`role-tab-${r.key}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="role-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => select(i)}
              style={{ "--jr-side": Math.sign(i - active), "--jr-far": Math.abs(i - active) } as CSSProperties}
              className="role-pill group rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon-600"
            >
              <span
                className={cn(
                  "role-skin inline-flex min-h-11 items-center gap-2 rounded-full py-1.5 pr-5 pl-1.5 text-[15px] font-semibold",
                  selected
                    ? "bg-maroon-600 text-white shadow-[0_8px_18px_-10px_rgb(128_0_0/0.8)]"
                    : "bg-white text-neutral-800 shadow-[0_0_0_1px_rgb(30_22_23/0.12)] [@media(hover:hover)]:group-hover:bg-maroon-50",
                )}
              >
                <ChibiRig role={r.key} mini className="size-8 rounded-full bg-white" />
                {r.name}
              </span>
            </button>
          );
        })}
      </div>

      <div
        id="role-panel"
        role="tabpanel"
        aria-labelledby={`role-tab-${role.key}`}
        tabIndex={0}
        data-paused={paused}
        style={{ "--dir": dir } as CSSProperties}
        className="feature-tour landing-window mt-8 grid overflow-hidden rounded-3xl bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-maroon-600 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]"
      >
        <div
          data-side={cardLeft ? "left" : "right"}
          className="rig-stage relative flex items-end justify-start px-6 pt-14 pb-8 sm:px-10"
        >
          <div className="rig-slot">
            <div key={`art-${role.key}`} className="role-art">
              <ChibiRig
                role={role.key}
                label={role.name}
                prop={current.prop}
                act={current.act}
                face={cardLeft ? "left" : "right"}
                className="h-72 w-auto sm:h-80"
              />
            </div>
          </div>
          <div
            key={`scene-${role.key}-${feature}`}
            aria-hidden="true"
            data-pos={current.pos}
            className="scene-card w-36 rounded-2xl bg-white p-3 shadow-[0_0_0_1px_rgb(30_22_23/0.06),0_14px_28px_-14px_rgb(61_5_5/0.35)] sm:w-52"
          >
            <FeatureScene scene={current.scene} />
            <p className="mt-2 text-center text-xs font-semibold text-neutral-800">{current.label}</p>
          </div>
        </div>
        <div key={`text-${role.key}`} className="role-text px-7 py-9 sm:px-10 sm:py-12">
          <h3
            className="text-[clamp(1.6rem,2.6vw,2.1rem)] leading-tight font-semibold tracking-[-0.015em] text-neutral-900"
            style={{ "--i": 0 } as CSSProperties}
          >
            {role.name}
          </h3>
          <p className="mt-2 text-lg text-maroon-700" style={{ "--i": 1 } as CSSProperties}>
            {role.line}
          </p>
          <div className="mt-7 flex items-center justify-between gap-3" style={{ "--i": 2 } as CSSProperties}>
            <p className="text-sm font-semibold text-neutral-500">What ThesIsko does for you</p>
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? "Play the feature tour" : "Pause the feature tour"}
              className="inline-flex size-8 items-center justify-center rounded-full text-neutral-600 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon-600 motion-reduce:hidden"
            >
              {paused ? (
                <Play aria-hidden="true" strokeWidth={2} className="size-4" />
              ) : (
                <Pause aria-hidden="true" strokeWidth={2} className="size-4" />
              )}
            </button>
          </div>
          <ul className="-mx-3 mt-2 space-y-1">
            {role.does.map((item, n) => {
              const on = n === feature;
              return (
                <li key={item.text} style={{ "--i": n + 3 } as CSSProperties}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => setFeature(n)}
                    className={cn(
                      "relative flex w-full gap-3 overflow-hidden rounded-xl px-3 py-2 text-left text-base leading-relaxed transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-maroon-600",
                      on ? "bg-maroon-50 text-neutral-900" : "text-neutral-700 [@media(hover:hover)]:hover:bg-neutral-50",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full transition-[background-color,color,transform] duration-300",
                        on ? "scale-110 bg-maroon-600 text-white" : "bg-tone-done-bg text-tone-done-fg",
                      )}
                    >
                      <Check strokeWidth={2.5} className="size-3.5" />
                    </span>
                    {item.text}
                    {on ? (
                      <span
                        key={`${role.key}-${n}`}
                        aria-hidden="true"
                        onAnimationEnd={() => setFeature((f) => (f + 1) % role.does.length)}
                        className="feature-progress absolute right-3 bottom-0 left-3 h-0.5 rounded-full bg-maroon-600"
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
