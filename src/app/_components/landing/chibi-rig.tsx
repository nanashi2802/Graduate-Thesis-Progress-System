"use client";

// Animated chibi characters for the roles section, drawn from the owner's character sheet
// (23 Nov 2026): dark outlines, cel shading, clumped hair, large two-highlight eyes, about
// three heads tall. Student and Panel Member are men; Adviser and Coordinator are women.
//
// The motion follows the Rive state-machine pattern, so a designer-made .riv file can replace
// this SVG later without touching the page. Inputs (same names as a future Rive state machine):
//   lookX, lookY  number -1..1   cursor position; drives the head turn and the pupils
//   pose          "idle" | "lift" | "wave"
//   expression    "calm" | "happy"  (follows the pose)
// The SVG renderer maps lookX and lookY to the CSS variables --lx and --ly, and the pose to
// data-pose. All motion lives in landing.css (`.rig*`) and stops under reduced motion.
// Canvas: 240 x 400. Pivots used by landing.css: feet 120,384; neck 120,158;
// right shoulder 154,174; left shoulder 86,174.
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type RoleKey = "student" | "adviser" | "panel" | "coordinator";
// "present" acts out the highlighted feature; the Act picks how.
type Pose = "idle" | "lift" | "present" | "wave";
export type Act = "show" | "front" | "raise" | "hand-up" | "cheer";

const OUT = "#2E2224"; // outline
const SKIN = "#F8D9C2";
const SKIN_SHADE = "#EDBDA0";
const BLUSH = "#F3A3A0";

type Look = {
  hair: string;
  hairShine: string;
  jacket: string;
  jacketShade: string;
  shirt: string;
  pants: string;
  pantsShade: string;
  shoes: string;
};

const LOOKS: Record<RoleKey, Look> = {
  student: {
    hair: "#1C1A20",
    hairShine: "#4A4656",
    jacket: "#27334F",
    jacketShade: "#1B2439",
    shirt: "#FFFFFF",
    pants: "#1F232C",
    pantsShade: "#15181F",
    shoes: "#F4F2F2",
  },
  adviser: {
    hair: "#221B1C",
    hairShine: "#4E4244",
    jacket: "#283453",
    jacketShade: "#1C253C",
    shirt: "#FFFFFF",
    pants: "#6B6D75",
    pantsShade: "#55575E",
    shoes: "#1B1516",
  },
  panel: {
    hair: "#17151B",
    hairShine: "#3E3A46",
    jacket: "#22252E",
    jacketShade: "#16181E",
    shirt: "#5E7BAE",
    pants: "#22252E",
    pantsShade: "#16181E",
    shoes: "#1B1516",
  },
  coordinator: {
    hair: "#2A1F1E",
    hairShine: "#5A4643",
    jacket: "#CDAACB",
    jacketShade: "#B08DAE",
    shirt: "#E9EEF6",
    pants: "#4E5059",
    pantsShade: "#3D3F47",
    shoes: "#1B1516",
  },
};

const HELLO: Record<RoleKey, string> = {
  student: "Hi! What’s my next step?",
  adviser: "Hello! Let’s review your draft.",
  panel: "Good day! Ready for the defense.",
  coordinator: "Hi! Everything is on track.",
};

const MALE: Record<RoleKey, boolean> = { student: true, adviser: false, panel: true, coordinator: false };

/** Outlined shape: fill plus the sheet's dark line. */
function S({ d, fill, w = 2.2 }: { d: string; fill: string; w?: number }) {
  return <path d={d} fill={fill} stroke={OUT} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" />;
}

/** Outlined limb: a thick dark stroke under a slightly thinner colored one. */
function Limb({ d, color, w = 15 }: { d: string; color: string; w?: number }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={OUT} strokeWidth={w + 4.4} />
      <path d={d} stroke={color} strokeWidth={w} />
    </g>
  );
}

function Hand({ cx, cy }: { cx: number; cy: number }) {
  return <ellipse cx={cx} cy={cy} rx="7.5" ry="8" fill={SKIN} stroke={OUT} strokeWidth="2.2" />;
}

/* ---------------- Hair ---------------- */

function BackHair({ role, look }: { role: RoleKey; look: Look }) {
  switch (role) {
    case "student":
      // Shaggy, full volume; clumps stick out over the ears.
      return (
        <S
          d="M80 128 L74 139 Q65 130 67 111 L56 120 Q51 107 62 88 L51 91 Q52 78 67 65 L54 64 Q62 51 83 45 L74 40 Q86 32 106 33 Q122 21 136 22 L130 33 Q149 29 161 35 L153 41 Q174 44 182 55 L169 58 Q188 69 192 82 L178 80 Q188 97 186 110 L176 104 Q171 117 165 126 L166 123 L166 96 L74 96 Z"
          fill={look.hair}
        />
      );
    case "panel":
      return (
        <S d="M60 118 C50 72 78 26 122 26 C166 26 194 66 182 118 C178 104 172 96 166 92 L76 92 C70 98 64 106 60 118 Z" fill={look.hair} />
      );
    case "adviser":
      // Shoulder-length bob behind the head.
      return (
        <S d="M58 108 C52 58 84 28 120 28 C156 28 188 58 182 108 L184 178 Q180 192 164 188 L76 188 Q60 192 56 178 Z" fill={look.hair} />
      );
    case "coordinator":
      // Long hair, past the shoulders.
      return (
        <S d="M56 110 C50 58 84 28 120 28 C156 28 190 58 184 110 L192 238 C192 256 174 262 160 254 L80 254 C66 262 48 256 48 238 Z" fill={look.hair} />
      );
  }
}

function FrontHair({ role, look }: { role: RoleKey; look: Look }) {
  const line = { fill: "none", stroke: look.hairShine, strokeWidth: 3, strokeLinecap: "round" as const };
  switch (role) {
    case "student":
      // Messy bangs in clumps, swept a little to the left. Only the lower edge has an outline,
      // so no line crosses the top of the head.
      return (
        <g>
          <path d="M62 110 Q65 94 74 86 Q75 95 82 104 Q85 92 92 84 Q95 93 102 102 Q105 90 112 82 Q114 94 121 106 Q124 92 130 84 Q135 92 142 101 Q145 92 152 84 Q157 94 164 104 Q167 96 170 88 Q171 99 178 110 C186 62 162 30 120 30 C78 30 54 62 62 110 Z" fill={look.hair} />
          <path d="M62 110 Q65 94 74 86 Q75 95 82 104 Q85 92 92 84 Q95 93 102 102 Q105 90 112 82 Q114 94 121 106 Q124 92 130 84 Q135 92 142 101 Q145 92 152 84 Q157 94 164 104 Q167 96 170 88 Q171 99 178 110" fill="none" stroke={OUT} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
          <S d="M66 94 Q54 110 56 134 Q60 126 66 122 Q64 112 72 102 Z" fill={look.hair} />
          <S d="M174 94 Q186 110 184 134 Q180 126 174 122 Q176 112 168 102 Z" fill={look.hair} />
          <g fill="none" stroke={look.hairShine} strokeWidth="2" strokeLinecap="round">
            <path d="M100 56 Q94 70 94 82" />
            <path d="M128 52 Q130 66 126 80" />
            <path d="M152 60 Q158 72 156 82" />
          </g>
        </g>
      );
    case "panel":
      // Neat side part, fringe swept to his left.
      return (
        <g>
          <S
            d="M62 110 C56 64 88 34 124 34 C160 34 186 62 180 108 L174 96 Q170 92 164 90 Q164 98 160 104 Q156 92 146 86 Q144 96 138 102 Q134 90 124 84 Q120 94 112 98 Q112 86 106 78 Q98 90 86 94 Q90 86 88 82 Q76 92 70 102 Q66 104 62 110 Z"
            fill={look.hair}
          />
          <S d="M64 100 L64 124 L71 114 Z" fill={look.hair} />
          <S d="M178 100 L178 124 L171 114 Z" fill={look.hair} />
          <path d="M104 44 Q100 56 104 70" {...line} strokeWidth={2.2} />
          <path d="M130 52 Q148 54 160 64" {...line} />
        </g>
      );
    case "adviser":
      // Side-swept bangs and locks that frame the face down to the shoulders.
      return (
        <g>
          <S
            d="M66 190 C56 160 54 128 60 104 C58 62 88 34 122 34 C158 34 188 62 182 104 C186 130 186 162 176 190 Q168 198 156 190 C164 162 166 132 162 108 C160 92 156 80 150 72 C138 88 112 98 84 100 C80 120 78 160 84 190 Q76 198 66 190 Z"
            fill={look.hair}
          />
          <path d="M96 54 Q110 46 126 46" {...line} />
          <path d="M150 52 Q160 58 166 68" {...line} />
          <path d="M68 130 Q66 156 72 182 M172 130 Q174 156 168 182" fill="none" stroke={look.hairShine} strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case "coordinator":
      // Soft side part; curtains fall past the shoulders.
      return (
        <g>
          <S d="M110 40 C82 40 60 64 62 108 C62 150 62 186 68 222 Q78 232 90 222 C82 186 78 150 80 116 C84 92 92 74 112 50 Z" fill={look.hair} />
          <S d="M110 40 C146 36 180 62 178 108 C178 150 178 186 172 222 Q162 232 150 222 C158 186 162 150 160 116 C158 86 140 66 108 60 C104 54 104 46 110 40 Z" fill={look.hair} />
          <path d="M92 58 Q100 50 108 48" {...line} />
          <path d="M132 50 Q152 54 164 70" {...line} />
          <path d="M70 130 Q68 170 74 210 M170 130 Q172 170 166 210" fill="none" stroke={look.hairShine} strokeWidth="2" strokeLinecap="round" />
        </g>
      );
  }
}

/* ---------------- Face ---------------- */

function Eye({ cx, iris, lash }: { cx: number; iris: string; lash: boolean }) {
  const dir = cx < 120 ? -1 : 1;
  return (
    <g className="rig-eye">
      <ellipse cx={cx} cy="114" rx="10.5" ry="12.5" fill="#FFFFFF" />
      <g className="rig-pupil">
        <ellipse cx={cx} cy="115" rx="9" ry="11" fill={`url(#${iris})`} />
        <ellipse cx={cx} cy="116" rx="4.2" ry="5.2" fill="#140E0C" />
        <circle cx={cx - 3.5} cy="110" r="3.6" fill="#FFFFFF" />
        <circle cx={cx + 3.5} cy="120" r="1.7" fill="#FFFFFF" />
      </g>
      <path d={`M${cx - 12} 107 Q${cx} 98 ${cx + 12} 107`} fill="none" stroke={OUT} strokeWidth="3.8" strokeLinecap="round" />
      {lash ? <path d={`M${cx + 10 * dir} 104 L${cx + 15 * dir} 100.5`} stroke={OUT} strokeWidth="2.4" strokeLinecap="round" /> : null}
      <path d={`M${cx - 5} 127 Q${cx} 128.5 ${cx + 5} 127`} fill="none" stroke={OUT} strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
    </g>
  );
}

function Glasses({ kind }: { kind: "round" | "rect" }) {
  return (
    <g fill="rgb(255 255 255 / 0.14)" stroke={OUT} strokeWidth="2.4">
      {kind === "round" ? (
        <>
          <circle cx="97" cy="114" r="15.5" />
          <circle cx="143" cy="114" r="15.5" />
        </>
      ) : (
        <>
          <rect x="80" y="103" width="34" height="22" rx="4" strokeWidth="3" />
          <rect x="126" y="103" width="34" height="22" rx="4" strokeWidth="3" />
        </>
      )}
      <path d="M112.5 112 Q120 108 127.5 112" fill="none" />
      <path d="M66 110 L81 112 M174 110 L159 112" fill="none" />
    </g>
  );
}

function Face({ role, iris }: { role: RoleKey; iris: string }) {
  const male = MALE[role];
  const brow = male ? 4 : 2.6;
  return (
    <g>
      <path d={male ? "M84 96 Q96 91 108 94" : "M86 96 Q97 92 107 95"} fill="none" stroke={OUT} strokeWidth={brow} strokeLinecap="round" />
      <path d={male ? "M132 94 Q144 91 156 96" : "M133 95 Q143 92 154 96"} fill="none" stroke={OUT} strokeWidth={brow} strokeLinecap="round" />
      <Eye cx={97} iris={iris} lash={!male} />
      <Eye cx={143} iris={iris} lash={!male} />
      <ellipse cx="82" cy="133" rx="8.5" ry="4.5" fill={BLUSH} opacity="0.55" />
      <ellipse cx="158" cy="133" rx="8.5" ry="4.5" fill={BLUSH} opacity="0.55" />
      <path d="M119 128 L121 129.5" stroke={SKIN_SHADE} strokeWidth="2" strokeLinecap="round" />
      <path className="rig-mouth-calm" d="M114 139 Q120 143 126 139" fill="none" stroke={OUT} strokeWidth="2.4" strokeLinecap="round" />
      <path className="rig-mouth-happy" d="M112 137 Q120 149 128 137 Z" fill="#C25B55" stroke={OUT} strokeWidth="2" strokeLinejoin="round" />
      {role === "adviser" ? <Glasses kind="round" /> : null}
      {role === "panel" ? <Glasses kind="rect" /> : null}
    </g>
  );
}

/* ---------------- Body ---------------- */

function Legs({ role, look }: { role: RoleKey; look: Look }) {
  const male = MALE[role];
  return (
    <g>
      <S d="M89 260 L88 364 L117 364 L119 264 Z" fill={look.pants} />
      <S d="M121 264 L123 364 L152 364 L151 260 Z" fill={look.pants} />
      <path d="M142 268 L145 362 L151 362 L150 268 Z" fill={look.pantsShade} />
      {role === "student" ? (
        <g>
          <S d="M86 372 C86 362 94 360 104 360 L117 360 L117 378 L90 378 C87 378 86 376 86 372 Z" fill={look.shoes} />
          <S d="M154 372 C154 362 146 360 136 360 L123 360 L123 378 L150 378 C153 378 154 376 154 372 Z" fill={look.shoes} />
          <path d="M88 373 L116 373 M152 373 L124 373" stroke="#9C9396" strokeWidth="2" />
        </g>
      ) : male ? (
        <g>
          <S d="M88 372 C88 364 96 361 106 361 L117 361 L117 377 L92 377 C89 377 88 375 88 372 Z" fill={look.shoes} />
          <S d="M152 372 C152 364 144 361 134 361 L123 361 L123 377 L148 377 C151 377 152 375 152 372 Z" fill={look.shoes} />
        </g>
      ) : (
        <g>
          <S d="M94 362 h22 v10 C116 375 112 377 106 377 L98 377 C92 377 90 372 94 362 Z" fill={SKIN} w={1.8} />
          <S d="M146 362 h-22 v10 C124 375 128 377 134 377 L142 377 C148 377 150 372 146 362 Z" fill={SKIN} w={1.8} />
          <S d="M92 370 C92 366 96 366 100 367 L116 367 L116 377 L96 377 C93 377 92 374 92 370 Z" fill={look.shoes} />
          <S d="M148 370 C148 366 144 366 140 367 L124 367 L124 377 L144 377 C147 377 148 374 148 370 Z" fill={look.shoes} />
        </g>
      )}
    </g>
  );
}

function Torso({ role, look }: { role: RoleKey; look: Look }) {
  const jacket = "M78 168 C92 158 148 158 162 168 L170 266 C140 273 100 273 70 266 Z";
  const shade = <path d="M148 165 L162 168 L170 266 L155 269 Z" fill={look.jacketShade} />;

  if (role === "student") {
    return (
      <g>
        {/* Backpack peeks out behind the shoulders. */}
        <S d="M70 182 C70 172 80 168 90 168 L150 168 C160 168 170 172 170 182 L172 240 L68 240 Z" fill="#8C7A64" />
        <S d={jacket} fill={look.jacket} />
        {shade}
        <S d="M104 164 L136 164 L134 268 L106 268 Z" fill={look.shirt} />
        <path d="M106 168 L104 268 M134 168 L136 268" stroke={OUT} strokeWidth="2" />
        {/* Hood lies on the shoulders. */}
        <S d="M84 172 C80 150 160 150 156 172 C148 164 132 162 120 162 C108 162 92 164 84 172 Z" fill={look.jacket} />
        <path d="M112 166 L110 196 M128 166 L130 196" stroke="#E9E6EA" strokeWidth="2.4" strokeLinecap="round" />
        <Limb d="M93 170 L96 232" color="#6E5B47" w={6} />
        <Limb d="M147 170 L144 232" color="#6E5B47" w={6} />
      </g>
    );
  }

  return (
    <g>
      <S d={jacket} fill={look.jacket} />
      {shade}
      {role === "coordinator" ? (
        <S d="M104 162 L136 162 L130 222 L110 222 Z" fill={look.shirt} />
      ) : role === "panel" ? (
        <S d="M104 162 L136 162 L134 268 L106 268 Z" fill={look.shirt} />
      ) : (
        <S d="M104 162 L136 162 L128 230 L112 230 Z" fill={look.shirt} />
      )}
      {role === "panel" ? (
        <g>
          <path d="M110 162 L120 178 L130 162" fill="none" stroke={OUT} strokeWidth="1.8" />
          <circle cx="120" cy="194" r="1.5" fill={OUT} />
          <circle cx="120" cy="210" r="1.5" fill={OUT} />
        </g>
      ) : null}
      {/* Lapels. The Panel Member's blazer hangs open. */}
      {role === "panel" ? (
        <g>
          <S d="M104 162 L106 268 L98 268 L96 210 L90 172 Z" fill={look.jacket} />
          <S d="M136 162 L134 268 L142 268 L144 210 L150 172 Z" fill={look.jacketShade} />
        </g>
      ) : (
        <g>
          <S d="M104 162 L120 226 L98 212 L92 172 Z" fill={look.jacket} />
          <S d="M136 162 L120 226 L142 212 L148 172 Z" fill={look.jacketShade} />
          <circle cx="122" cy="240" r="2.2" fill={OUT} />
        </g>
      )}
      {role === "adviser" ? (
        <g>
          <path d="M110 164 L120 204 L130 164" fill="none" stroke="#3E5C9A" strokeWidth="3" />
          <S d="M111 202 h18 v24 h-18 Z" fill="#FFFFFF" w={1.8} />
          <rect x="114" y="206" width="12" height="8" rx="1.5" fill="#8FB3E0" />
          <path d="M114 218 h12 M114 221 h8" stroke="#A59A9C" strokeWidth="1.5" />
        </g>
      ) : null}
      {role === "panel" ? (
        <g>
          <path d="M107 258 L133 258" stroke="#111216" strokeWidth="6" />
          <rect x="115" y="254.5" width="10" height="7" rx="1.5" fill="#B9B3B4" stroke={OUT} strokeWidth="1.4" />
        </g>
      ) : null}
    </g>
  );
}

export type PropKey =
  | "tablet-track"
  | "tablet-chat"
  | "tablet-list"
  | "tablet-bars"
  | "paper-upload"
  | "paper-pins"
  | "paper-check"
  | "calendar-one"
  | "calendar-many"
  | "clipboard"
  | "notebook"
  | "book"
  | "people";

/** Tablet frame with its screen content drawn in the 152..186 x 228..270 area. */
function Tablet({ children }: { children: ReactNode }) {
  return (
    <g transform="rotate(-6 172 250)">
      <S d="M150 222 h36 a5 5 0 0 1 5 5 v46 a5 5 0 0 1 -5 5 h-36 a5 5 0 0 1 -5 -5 v-46 a5 5 0 0 1 5 -5 Z" fill="#3A3F4B" />
      <rect x="150" y="228" width="36" height="42" rx="2" fill="#EAF2FC" />
      {children}
    </g>
  );
}

function Paper({ children }: { children?: ReactNode }) {
  return (
    <g transform="rotate(-8 172 250)">
      <S d="M152 222 h36 v52 h-36 Z" fill="#FFFFFF" />
      <S d="M148 226 h36 v52 h-36 Z" fill="#FFFFFF" />
      <path d="M154 236 h24 M154 243 h26 M154 250 h20 M154 257 h24" stroke="#C9C1C2" strokeWidth="2" strokeLinecap="round" />
      {children}
    </g>
  );
}

function CalendarProp({ marks }: { marks: number[] }) {
  return (
    <g transform="rotate(-6 172 250)">
      <S d="M146 224 h46 v48 h-46 Z" fill="#FFFFFF" />
      <S d="M146 224 h46 v11 h-46 Z" fill="#800000" />
      <path d="M156 220 v7 M182 220 v7" stroke={OUT} strokeWidth="2.6" strokeLinecap="round" />
      {Array.from({ length: 12 }, (_, i) => {
        const x = 150 + (i % 4) * 10.5;
        const y = 239 + Math.floor(i / 4) * 10.5;
        return <rect key={i} x={x} y={y} width="7" height="7" rx="1.5" fill={marks.includes(i) ? (marks.length > 1 ? "#1B6B45" : "#800000") : "#EFEBEB"} />;
      })}
    </g>
  );
}

function Prop({ kind }: { kind: PropKey }): ReactNode {
  // Drawn in the right hand's frame (hand at 172, 252); the hand sits behind the prop.
  switch (kind) {
    case "tablet-track":
      return (
        <Tablet>
          <path d="M155 250 h26" stroke="#C9C1C2" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M155 250 h17" stroke="#800000" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="155" cy="250" r="3" fill="#1B6B45" />
          <circle cx="163" cy="250" r="3" fill="#1B6B45" />
          <circle cx="172" cy="250" r="3.6" fill="#FFFFFF" stroke="#800000" strokeWidth="2" />
          <circle cx="181" cy="250" r="2.6" fill="#FFFFFF" stroke="#A59A9C" strokeWidth="1.6" />
          <rect x="161" y="235" width="22" height="7" rx="3.5" fill="#800000" />
        </Tablet>
      );
    case "tablet-chat":
      return (
        <Tablet>
          <rect x="153" y="232" width="22" height="11" rx="4" fill="#D3CBCB" />
          <rect x="161" y="247" width="22" height="11" rx="4" fill="#800000" />
          <path d="M165 252.5 h14" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        </Tablet>
      );
    case "tablet-list":
      return (
        <Tablet>
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <circle cx="157" cy={236 + i * 12} r="3" fill="#BCD0EC" />
              <path d={`M163 ${236 + i * 12} h14`} stroke="#A59A9C" strokeWidth="2.2" strokeLinecap="round" />
              {i !== 1 ? <circle cx="182" cy={236 + i * 12} r="2.4" fill="#800000" /> : null}
            </g>
          ))}
        </Tablet>
      );
    case "tablet-bars":
      return (
        <Tablet>
          {[0.8, 0.5, 0.3, 0.65].map((w, i) => (
            <rect key={i} x="154" y={233 + i * 9} width={28 * w} height="5" rx="2.5" fill={i === 2 ? "#8F4A06" : "#800000"} />
          ))}
        </Tablet>
      );
    case "paper-upload":
      return (
        <Paper>
          <circle cx="182" cy="268" r="8" fill="#800000" stroke={OUT} strokeWidth="1.6" />
          <path d="M182 272 v-8 M178 267 l4 -4 l4 4" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Paper>
      );
    case "paper-pins":
      return (
        <Paper>
          <circle cx="180" cy="238" r="3.4" fill="#800000" stroke="#FFFFFF" strokeWidth="1" />
          <circle cx="176" cy="257" r="3.4" fill="#800000" stroke="#FFFFFF" strokeWidth="1" />
          <rect x="183" y="233" width="12" height="9" rx="3" fill="#F4C430" stroke={OUT} strokeWidth="1.2" />
        </Paper>
      );
    case "paper-check":
      return (
        <Paper>
          <circle cx="180" cy="266" r="9" fill="#1B6B45" stroke={OUT} strokeWidth="1.6" />
          <path d="M176 266 l3 3 l5 -6" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </Paper>
      );
    case "calendar-one":
      return <CalendarProp marks={[6]} />;
    case "calendar-many":
      return <CalendarProp marks={[1, 4, 6, 9, 11]} />;
    case "clipboard":
      return (
        <g transform="rotate(-8 172 250)">
          <S d="M146 218 h44 a4 4 0 0 1 4 4 v54 a4 4 0 0 1 -4 4 h-44 a4 4 0 0 1 -4 -4 v-54 a4 4 0 0 1 4 -4 Z" fill="#A9774A" />
          <rect x="150" y="226" width="36" height="48" rx="2" fill="#FFFFFF" />
          <S d="M160 212 h16 v10 h-16 Z" fill="#B9B3B4" w={1.8} />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <path d={`M154 ${236 + i * 9} l2.5 2.5 l4.5 -5`} fill="none" stroke="#1B6B45" strokeWidth="2" strokeLinecap="round" />
              <path d={`M165 ${235 + i * 9} h${i === 3 ? 10 : 16}`} stroke="#C9C1C2" strokeWidth="2" strokeLinecap="round" />
            </g>
          ))}
        </g>
      );
    case "notebook":
      return (
        <g transform="rotate(-6 172 250)">
          <S d="M148 222 h40 v54 h-40 Z" fill="#800000" />
          <S d="M154 224 h32 v50 h-32 Z" fill="#FFFFFF" w={1.6} />
          <path d="M159 234 h22 M159 242 h22 M159 250 h18 M159 258 h12" stroke="#A59A9C" strokeWidth="2" strokeLinecap="round" />
          <path d="M148 230 h5 M148 240 h5 M148 250 h5 M148 260 h5 M148 270 h5" stroke="#E7E1E1" strokeWidth="2" strokeLinecap="round" />
          <S d="M176 262 l14 -16 l4 4 l-14 16 l-6 2 Z" fill="#F4C430" w={1.6} />
        </g>
      );
    case "book":
      return (
        <g transform="rotate(-4 172 250)">
          <S d="M140 232 L170 236 L200 232 L200 274 L170 278 L140 274 Z" fill="#FFFFFF" />
          <path d="M170 236 V278" stroke={OUT} strokeWidth="1.6" />
          <path d="M146 245 h18 M146 252 h18 M146 259 h14 M176 245 h18 M176 252 h18 M176 259 h14" stroke="#C9C1C2" strokeWidth="2" strokeLinecap="round" />
          <path d="M140 274 L170 278 L200 274 L200 279 L170 283 L140 279 Z" fill="#800000" stroke={OUT} strokeWidth="1.6" strokeLinejoin="round" />
        </g>
      );
    case "people":
      return (
        <g transform="rotate(-6 172 250)">
          {[
            { x: 146, r: -8, c: "#283453" },
            { x: 160, r: 6, c: "#22252E" },
          ].map((p) => (
            <g key={p.x} transform={`rotate(${p.r} ${p.x + 14} 250)`}>
              <S d={`M${p.x} 228 h28 v40 h-28 Z`} fill="#FFFFFF" />
              <circle cx={p.x + 14} cy="242" r="6" fill={SKIN} stroke={OUT} strokeWidth="1.4" />
              <path d={`M${p.x + 6} 258 a8 6 0 0 1 16 0 Z`} fill={p.c} />
              <path d={`M${p.x + 6} 263 h16`} stroke="#C9C1C2" strokeWidth="2" strokeLinecap="round" />
            </g>
          ))}
          <circle cx="190" cy="232" r="7" fill="#1B6B45" stroke={OUT} strokeWidth="1.4" />
          <path d="M190 228.5 v7 M186.5 232 h7" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        </g>
      );
  }
}

const DEFAULT_PROP: Record<RoleKey, PropKey> = {
  student: "tablet-track",
  adviser: "paper-pins",
  panel: "book",
  coordinator: "clipboard",
};

/* ---------------- Rig ---------------- */

export function ChibiRig({
  role,
  className,
  mini = false,
  label,
  prop,
  act = "show",
  face = "right",
}: {
  role: RoleKey;
  className?: string;
  /** Head-only, still version for the pills. */
  mini?: boolean;
  /** Role name for the hello button. */
  label?: string;
  /** What the character holds; follows the highlighted feature. */
  prop?: PropKey;
  /** Pose while presenting the feature. */
  act?: Act;
  /** Which way the character faces; the art is drawn facing right. */
  face?: "left" | "right";
}) {
  const look = LOOKS[role];
  const uid = useId().replace(/:/g, "");
  const iris = `rig-iris-${uid}`;
  const svgRef = useRef<SVGSVGElement>(null);
  // The switcher remounts the rig for each role, so it starts in the lift pose.
  const [pose, setPose] = useState<Pose>(mini ? "idle" : "lift");
  const [hello, setHello] = useState(false);

  // After the entrance lift, settle into holding the prop out.
  useEffect(() => {
    if (mini) return;
    const t = window.setTimeout(() => setPose("present"), 1400);
    return () => window.clearTimeout(t);
  }, [role, mini]);

  // Inputs lookX and lookY: page-wide cursor tracking, written as CSS variables (no re-render).
  useEffect(() => {
    const svg = svgRef.current;
    if (mini || !svg || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = svg.getBoundingClientRect();
        // A mirrored character turns the other way, so flip the cursor's side to match.
        const flip = svg.dataset.face === "left" ? -1 : 1;
        const lookX = flip * Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / 420));
        const lookY = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height * 0.3)) / 420));
        svg.style.setProperty("--lx", lookX.toFixed(3));
        svg.style.setProperty("--ly", lookY.toFixed(3));
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, [mini]);

  function wave() {
    setPose("wave");
    setHello(true);
    window.setTimeout(() => setPose("present"), 1600);
    window.setTimeout(() => setHello(false), 2400);
  }

  const art = (
    <svg
      ref={svgRef}
      viewBox={mini ? "50 20 140 140" : "0 0 240 400"}
      className={cn("rig", !mini && "rig-live overflow-visible", className)}
      data-pose={pose}
      data-act={act}
      data-face={mini ? undefined : face}
      data-role={role}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={iris} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#150E0B" />
          <stop offset="1" stopColor="#4C3123" />
        </linearGradient>
      </defs>
      {!mini ? <ellipse cx="120" cy="382" rx="62" ry="7" fill="rgb(30 22 23 / 0.10)" /> : null}
      <g className="rig-body">
      <g className="rig-breathe">
        {!mini && !MALE[role] ? <BackHair role={role} look={look} /> : null}
        {!mini ? (
          <>
            <g className="rig-arm-l">
              <Limb d="M82 174 C70 196 66 222 68 246" color={look.jacket} />
              <Hand cx={68} cy={252} />
              {role === "panel" ? <path d="M62 242 L54 228" stroke={OUT} strokeWidth="4" strokeLinecap="round" /> : null}
            </g>
            <Legs role={role} look={look} />
            <S d="M110 144 h20 v24 h-20 Z" fill={SKIN_SHADE} w={1.8} />
            <Torso role={role} look={look} />
            <g className="rig-arm-r">
              <Limb d="M158 174 C170 196 174 222 172 246" color={look.jacket} />
              <Hand cx={172} cy={252} />
              <g className="rig-prop">
                <g key={prop ?? role} className="rig-prop-in">
                  <Prop kind={prop ?? DEFAULT_PROP[role]} />
                </g>
              </g>
            </g>
          </>
        ) : null}
        <g className="rig-head">
          {mini || MALE[role] ? <BackHair role={role} look={look} /> : null}
          {MALE[role] ? (
            <>
              <S d="M64 112 a8.5 10 0 1 1 0.1 0 Z" fill={SKIN} w={2} />
              <S d="M176 112 a8.5 10 0 1 1 0.1 0 Z" fill={SKIN} w={2} />
            </>
          ) : null}
          <S d="M66 96 C66 58 90 42 120 42 C150 42 174 58 174 96 C174 128 154 152 120 154 C86 152 66 128 66 96 Z" fill={SKIN} />
          <Face role={role} iris={iris} />
          <FrontHair role={role} look={look} />
        </g>
      </g>
      </g>
    </svg>
  );

  if (mini) return art;

  return (
    <div className="relative inline-flex flex-col items-center">
      <p
        aria-live="polite"
        className={cn(
          "rig-bubble pointer-events-none absolute -top-4 left-1/2 z-10 -translate-x-1/2 rounded-2xl bg-white px-4 py-2 text-sm font-medium whitespace-nowrap text-neutral-800 shadow-[0_0_0_1px_rgb(30_22_23/0.08),0_10px_20px_-10px_rgb(30_22_23/0.35)]",
          hello ? "opacity-100" : "opacity-0",
        )}
      >
        {hello ? HELLO[role] : ""}
      </p>
      <button
        type="button"
        onClick={wave}
        className="cursor-pointer rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-maroon-600"
        aria-label={`Say hello to the ${label ?? role}`}
      >
        {art}
      </button>
    </div>
  );
}
