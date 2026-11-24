// Motion graphics for the roles section: one short animated scene for each feature in the list.
// Each scene plays once when its feature is highlighted, then holds its last frame. Every element
// is drawn at its final state; the `sc-*` classes in landing.css animate in from hidden, so under
// reduced motion the finished scene shows with no movement. Sample content only: no grades,
// scores or signatures (BR-01, BR-15).
import type { CSSProperties, ReactNode } from "react";

export type SceneKey =
  | "track"
  | "upload"
  | "reply"
  | "book"
  | "pins"
  | "log"
  | "endorse"
  | "advisees"
  | "open"
  | "comment"
  | "evaluate"
  | "dates"
  | "appoint"
  | "check"
  | "close"
  | "overview";

const M = "#800000";
const M100 = "#F5E1E1";
const GOLD = "#F4C430";
const OK = "#1B6B45";
const OK_BG = "#E5F3EA";
const N100 = "#F4F1F1";
const N200 = "#E7E1E1";
const N300 = "#D3CBCB";
const N400 = "#A59A9C";
const INK = "#2E2426";
const BLUE = "#1F4E8C";
const BLUE_BG = "#E7EEF8";

/** Delay for one animated element, in ms. */
const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

function Lines({ x, y, w, n, gap = 9, color = N300 }: { x: number; y: number; w: number; n: number; gap?: number; color?: string }) {
  return (
    <g stroke={color} strokeWidth="3" strokeLinecap="round">
      {Array.from({ length: n }, (_, i) => (
        <path key={i} d={`M${x} ${y + i * gap} h${i === n - 1 ? w * 0.6 : w}`} />
      ))}
    </g>
  );
}

function Check({ cx, cy, r = 8, fill = OK, delay = 0 }: { cx: number; cy: number; r?: number; fill?: string; delay?: number }) {
  return (
    <g className="sc-pop" style={d(delay)}>
      <circle cx={cx} cy={cy} r={r} fill={fill} />
      <path d={`M${cx - r * 0.42} ${cy} l${r * 0.3} ${r * 0.32} l${r * 0.55} ${-r * 0.62}`} fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

function Chip({ x, y, w, text, fill = OK_BG, color = OK, delay = 0 }: { x: number; y: number; w: number; text: string; fill?: string; color?: string; delay?: number }) {
  return (
    <g className="sc-rise" style={d(delay)}>
      <rect x={x} y={y} width={w} height="16" rx="8" fill={fill} />
      <text x={x + w / 2} y={y + 11.2} textAnchor="middle" fontSize="9" fontWeight="600" fill={color}>
        {text}
      </text>
    </g>
  );
}

function Paper({ x, y, w = 50, h = 64, children }: { x: number; y: number; w?: number; h?: number; children?: ReactNode }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="4" fill="#fff" stroke={N300} strokeWidth="1.5" />
      {children}
    </g>
  );
}

function Calendar({ x, y, marks }: { x: number; y: number; marks: (i: number) => ReactNode }) {
  const cells = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 5; c++) {
      const i = r * 5 + c;
      cells.push(
        <g key={i}>
          <rect x={x + 6 + c * 15} y={y + 22 + r * 14} width="11" height="10" rx="2" fill={N100} />
          {marks(i)}
        </g>,
      );
    }
  }
  return (
    <g>
      <rect x={x} y={y} width="86" height="68" rx="6" fill="#fff" stroke={N300} strokeWidth="1.5" />
      <path d={`M${x} ${y + 6} a6 6 0 0 1 6 -6 h74 a6 6 0 0 1 6 6 v10 h-86 Z`} fill={M} />
      <path d={`M${x + 22} ${y - 4} v8 M${x + 64} ${y - 4} v8`} stroke={INK} strokeWidth="3" strokeLinecap="round" />
      {cells}
    </g>
  );
}

function cellXY(x: number, y: number, i: number) {
  return { cx: x + 11.5 + (i % 5) * 15, cy: y + 27 + Math.floor(i / 5) * 14 };
}

function Person({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r="7" fill="#F8D9C2" stroke={INK} strokeWidth="1.5" />
      <path d={`M${x - 7} ${y - 2} a7 7 0 0 1 14 0 Z`} fill={INK} />
      <path d={`M${x - 11} ${y + 22} a11 11 0 0 1 22 0 Z`} fill={color} />
    </g>
  );
}

const SCENES: Record<SceneKey, () => ReactNode> = {
  // Student: the milestone track fills up to the current step.
  track: () => (
    <g>
      <path d="M24 58 H136" stroke={N200} strokeWidth="5" strokeLinecap="round" />
      <path className="sc-grow-x" d="M24 58 H100" stroke={M} strokeWidth="5" strokeLinecap="round" />
      <Check cx={24} cy={58} r={9} delay={150} />
      <Check cx={62} cy={58} r={9} delay={450} />
      <g className="sc-pop" style={d(800)}>
        <circle className="sc-pulse" cx="100" cy="58" r="12" fill={M100} />
        <circle cx="100" cy="58" r="8" fill="#fff" stroke={M} strokeWidth="3.5" />
      </g>
      <circle cx="136" cy="58" r="7" fill="#fff" stroke={N300} strokeWidth="3" />
      <g className="sc-drop" style={d(1100)}>
        <rect x="70" y="18" width="60" height="18" rx="9" fill={M} />
        <path d="M96 36 l4 5 l4 -5 Z" fill={M} />
        <text x="100" y="30.5" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#fff">
          Next step
        </text>
      </g>
    </g>
  ),
  // Student: a new version rises onto the stack.
  upload: () => (
    <g>
      <Paper x={14} y={26} w={40} h={52}>
        <Lines x={21} y={38} w={26} n={3} />
      </Paper>
      <Paper x={30} y={20} w={40} h={52}>
        <Lines x={37} y={32} w={26} n={3} />
      </Paper>
      <g className="sc-rise" style={d(200)}>
        <Paper x={88} y={14} w={46} h={60}>
          <Lines x={96} y={28} w={30} n={4} />
        </Paper>
      </g>
      <g className="sc-float" style={d(500)}>
        <circle cx="111" cy="84" r="9" fill={M} />
        <path d="M111 89 v-10 M106 83 l5 -5 l5 5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <Chip x={118} y={6} w={28} text="v3" fill={M} color="#fff" delay={900} />
      <text x="42" y="90" textAnchor="middle" fontSize="8.5" fill={N400}>
        v1 · v2
      </text>
    </g>
  ),
  // Student: a comment, then the reply with what was fixed.
  reply: () => (
    <g>
      <g className="sc-slide-l">
        <rect x="10" y="10" width="86" height="30" rx="10" fill={N100} />
        <path d="M22 40 l0 8 l8 -8 Z" fill={N100} />
        <Lines x={20} y={21} w={60} n={2} />
      </g>
      <g className="sc-slide-r" style={d(600)}>
        <rect x="58" y="50" width="92" height="30" rx="10" fill={M} />
        <path d="M138 80 l0 8 l-8 -8 Z" fill={M} />
        <Lines x={68} y={61} w={66} n={2} color="#fff" />
      </g>
      <Chip x={10} y={82} w={58} text="Fixed in v3" delay={1200} />
    </g>
  ),
  // Student: a consultation date is circled and booked.
  book: () => (
    <g>
      <Calendar
        x={10}
        y={16}
        marks={(i) => {
          if (i !== 8) return null;
          const { cx, cy } = cellXY(10, 16, i);
          return (
            <g>
              <rect x={cx - 5.5} y={cy - 5} width="11" height="10" rx="2" fill={M100} className="sc-fade" style={d(700)} />
              <circle cx={cx} cy={cy} r="9" fill="none" stroke={M} strokeWidth="2.4" pathLength={1} className="sc-draw" style={d(400)} />
            </g>
          );
        }}
      />
      <Check cx={122} cy={40} r={13} delay={1000} />
      <Chip x={100} y={60} w={46} text="Booked" delay={1200} />
    </g>
  ),
  // Adviser: comments pin to the version under review.
  pins: () => (
    <g>
      <Paper x={20} y={10} w={70} h={82}>
        <Lines x={30} y={24} w={50} n={6} gap={10} />
      </Paper>
      <rect x="64" y="4" width="28" height="14" rx="7" fill={M} />
      <text x="78" y="14" textAnchor="middle" fontSize="8.5" fontWeight="600" fill="#fff">
        v3
      </text>
      {[
        { y: 34, delay: 300 },
        { y: 64, delay: 750 },
      ].map(({ y, delay }) => (
        <g key={y}>
          <g className="sc-drop" style={d(delay)}>
            <circle cx="86" cy={y} r="5" fill={M} stroke="#fff" strokeWidth="1.5" />
          </g>
          <g className="sc-slide-r" style={d(delay + 200)}>
            <rect x="98" y={y - 10} width="50" height="20" rx="7" fill={GOLD} />
            <path d={`M98 ${y - 2} l-6 2 l6 2 Z`} fill={GOLD} />
            <path d={`M105 ${y - 2} h34 M105 ${y + 4} h22`} stroke="#7A5C00" strokeWidth="2.4" strokeLinecap="round" />
          </g>
        </g>
      ))}
    </g>
  ),
  // Adviser: consultation log entries write themselves in.
  log: () => (
    <g>
      <rect x="22" y="8" width="96" height="84" rx="6" fill="#fff" stroke={N300} strokeWidth="1.5" />
      <path d="M22 8 h14 v84 h-14 Z" fill={M} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <circle cx="46" cy={24 + i * 18} r="3" fill={i < 3 ? OK : N300} className="sc-pop" style={d(i * 350)} />
          <path d={`M54 ${24 + i * 18} h${i === 3 ? 34 : 54}`} stroke={N400} strokeWidth="3" strokeLinecap="round" pathLength={1} className="sc-draw" style={d(i * 350 + 100)} />
        </g>
      ))}
      <g className="sc-write">
        <path d="M118 66 l18 -18 l6 6 l-18 18 l-8 2 Z" fill={GOLD} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      </g>
    </g>
  ),
  // Adviser: the thesis is marked ready for the panel.
  endorse: () => (
    <g>
      <Paper x={22} y={10} w={60} h={80}>
        <Lines x={31} y={24} w={42} n={6} gap={10} />
      </Paper>
      <g className="sc-pop" style={d(400)}>
        <circle cx="92" cy="58" r="20" fill={OK} />
        <circle cx="92" cy="58" r="15" fill="none" stroke="#fff" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M84 58 l6 6 l11 -12" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <Chip x={86} y={12} w={66} text="Ready for panel" delay={900} />
    </g>
  ),
  // Adviser: today's advisees, with a nudge for the ones who need you.
  advisees: () => (
    <g>
      {[0, 1, 2].map((i) => (
        <g key={i} className="sc-slide-l" style={d(i * 150)}>
          <rect x="10" y={18 + i * 26} width="112" height="20" rx="6" fill={i === 1 ? N100 : "#fff"} stroke={N200} strokeWidth="1.5" />
          <circle cx="22" cy={28 + i * 26} r="6" fill={[BLUE_BG, M100, OK_BG][i]} />
          <path d={`M34 ${28 + i * 26} h${[54, 40, 60][i]}`} stroke={N300} strokeWidth="3" strokeLinecap="round" />
          {i !== 1 ? <circle cx="112" cy={28 + i * 26} r="4" fill={M} className="sc-pop" style={d(900 + i * 150)} /> : null}
        </g>
      ))}
      <g className="sc-shake" style={d(700)}>
        <path d="M138 36 a10 10 0 0 1 -20 0 v-8 a10 10 0 0 1 20 0 Z" fill={GOLD} stroke={INK} strokeWidth="1.6" />
        <circle cx="128" cy="40" r="3" fill={INK} />
      </g>
      <g className="sc-pop" style={d(900)}>
        <circle cx="140" cy="18" r="7" fill={M} />
        <text x="140" y="21.2" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff">
          2
        </text>
      </g>
    </g>
  ),
  // Panel Member: once appointed, the manuscript opens.
  open: () => (
    <g>
      <path d="M36 22 L80 28 L124 22 L124 86 L80 92 L36 86 Z" fill="#fff" stroke={N300} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M80 28 V92" stroke={N300} strokeWidth="1.5" />
      <g className="sc-fade" style={d(900)}>
        <Lines x={44} y={40} w={28} n={4} gap={10} />
        <Lines x={88} y={40} w={28} n={4} gap={10} />
      </g>
      <g className="sc-cover" style={d(400)}>
        <path d="M80 28 L124 22 L124 86 L80 92 Z" fill={M} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M92 48 h22 M92 56 h16" stroke={GOLD} strokeWidth="2.4" strokeLinecap="round" />
      </g>
      <Chip x={10} y={4} w={56} text="Appointed" fill={GOLD} color="#3D0505" />
    </g>
  ),
  // Panel Member: a line is marked and a comment added to the version under review.
  comment: () => (
    <g>
      <Paper x={14} y={10} w={74} h={82}>
        <rect x="22" y="40" width="58" height="9" rx="2" fill={GOLD} opacity="0.55" className="sc-grow-x" style={d(300)} />
        <Lines x={24} y={24} w={54} n={6} gap={10} />
      </Paper>
      <g className="sc-pop" style={d(800)}>
        <rect x="92" y="28" width="60" height="36" rx="10" fill={BLUE} />
        <path d="M100 64 l0 8 l8 -8 Z" fill={BLUE} />
        <path d="M100 40 h42 M100 50 h28" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      </g>
    </g>
  ),
  // Panel Member: each part of the evaluation form is ticked off (no scores shown).
  evaluate: () => (
    <g>
      <rect x="30" y="10" width="84" height="84" rx="6" fill="#A9774A" stroke={INK} strokeWidth="1.5" />
      <rect x="36" y="18" width="72" height="70" rx="3" fill="#fff" />
      <rect x="60" y="5" width="24" height="10" rx="2" fill="#B9B3B4" stroke={INK} strokeWidth="1.4" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="42" y={25 + i * 15} width="10" height="10" rx="2" fill="#fff" stroke={N400} strokeWidth="1.5" />
          <path d={`M44 ${30 + i * 15} l2.5 2.5 l5 -6`} fill="none" stroke={OK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="sc-draw" style={d(250 + i * 300)} />
          <path d={`M58 ${30 + i * 15} h${[42, 34, 40, 28][i]}`} stroke={N300} strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}
      <Chip x={100} y={72} w={54} text="Recorded" delay={1500} />
    </g>
  ),
  // Panel Member: free dates light up and are shared.
  dates: () => (
    <g>
      <Calendar
        x={10}
        y={16}
        marks={(i) => {
          const order = [2, 6, 7, 11, 13].indexOf(i);
          if (order < 0) return null;
          const { cx, cy } = cellXY(10, 16, i);
          return <rect x={cx - 5.5} y={cy - 5} width="11" height="10" rx="2" fill={OK} className="sc-pop" style={d(200 + order * 180)} />;
        }}
      />
      <g className="sc-float" style={d(1100)}>
        <circle cx="124" cy="40" r="13" fill={OK_BG} />
        <path d="M118 44 l12 -8 M130 36 l-1 6 M130 36 l-6 0" fill="none" stroke={OK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <Chip x={98} y={60} w={54} text="Shared" delay={1300} />
    </g>
  ),
  // Coordinator: members join the committee.
  appoint: () => (
    <g>
      <rect x="10" y="14" width="140" height="62" rx="10" fill="none" stroke={N300} strokeWidth="1.8" strokeDasharray="5 4" />
      <text x="20" y="28" fontSize="9" fontWeight="600" fill={N400}>
        Panel
      </text>
      {[
        { x: 42, c: "#22252E" },
        { x: 80, c: "#283453" },
        { x: 118, c: "#CDAACB" },
      ].map((p, i) => (
        <g key={p.x} className="sc-slide-l" style={d(200 + i * 250)}>
          <Person x={p.x} y={44} color={p.c} />
        </g>
      ))}
      <Chip x={50} y={82} w={60} text="Appointed" delay={1100} />
    </g>
  ),
  // Coordinator: documents checked, date and room confirmed.
  check: () => (
    <g>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="10" y={10 + i * 22} width="92" height="18" rx="5" fill="#fff" stroke={N200} strokeWidth="1.5" />
          <path d={`M18 ${15 + i * 22} h7 l3 3 v5 h-10 Z`} fill={N100} stroke={N400} strokeWidth="1.2" />
          <path d={`M34 ${19 + i * 22} h${[44, 36, 50][i]}`} stroke={N300} strokeWidth="3" strokeLinecap="round" />
          <Check cx={92} cy={19 + i * 22} r={6} delay={200 + i * 300} />
        </g>
      ))}
      <g className="sc-rise" style={d(1200)}>
        <rect x="10" y="78" width="92" height="18" rx="9" fill={BLUE_BG} />
        <text x="56" y="90.5" textAnchor="middle" fontSize="9" fontWeight="600" fill={BLUE}>
          Date and room set
        </text>
      </g>
      <g className="sc-pop" style={d(1000)}>
        <rect x="112" y="22" width="36" height="56" rx="3" fill="#A9774A" stroke={INK} strokeWidth="1.5" />
        <circle cx="140" cy="52" r="2.5" fill={GOLD} />
      </g>
    </g>
  ),
  // Coordinator: the stage closes, so the next one opens.
  close: () => (
    <g>
      <path d="M26 54 H134" stroke={N200} strokeWidth="5" strokeLinecap="round" />
      <path className="sc-grow-x" d="M26 54 H80" stroke={OK} strokeWidth="5" strokeLinecap="round" />
      <path className="sc-grow-x" style={d(900)} d="M80 54 H134" stroke={M} strokeWidth="5" strokeLinecap="round" />
      <Check cx={26} cy={54} r={10} />
      <g className="sc-swap-out" style={d(500)}>
        <circle cx="80" cy="54" r="10" fill={N100} stroke={N400} strokeWidth="2" />
        <rect x="75" y="52" width="10" height="7" rx="1.5" fill={N400} />
        <path d="M77 52 v-3 a3 3 0 0 1 6 0 v3" fill="none" stroke={N400} strokeWidth="1.8" />
      </g>
      <Check cx={80} cy={54} r={10} delay={600} />
      <g className="sc-pop" style={d(1300)}>
        <circle className="sc-pulse" cx="134" cy="54" r="13" fill={M100} />
        <circle cx="134" cy="54" r="8" fill="#fff" stroke={M} strokeWidth="3.5" />
      </g>
      <Chip x={52} y={74} w={56} text="Stage closed" delay={700} />
      <g className="sc-drop" style={d(1500)}>
        <rect x="104" y="18" width="52" height="18" rx="9" fill={M} />
        <text x="130" y="30.5" textAnchor="middle" fontSize="9" fontWeight="600" fill="#fff">
          Now open
        </text>
      </g>
    </g>
  ),
  // Coordinator: every thesis at a glance, with a flag on the one that is held up.
  overview: () => (
    <g>
      {[0.82, 0.55, 0.3, 0.66].map((p, i) => (
        <g key={i}>
          <circle cx="18" cy={18 + i * 20} r="5" fill={[BLUE_BG, M100, "#FCEEDD", OK_BG][i]} />
          <rect x="30" y={14 + i * 20} width="96" height="8" rx="4" fill={N100} />
          <rect x="30" y={14 + i * 20} width={96 * p} height="8" rx="4" fill={i === 2 ? "#8F4A06" : M} className="sc-grow-x" style={d(i * 150)} />
        </g>
      ))}
      <g className="sc-wave" style={d(900)}>
        <path d="M136 56 v-18" stroke={INK} strokeWidth="2" strokeLinecap="round" />
        <path d="M136 38 h14 l-4 5 l4 5 h-14 Z" fill="#8F4A06" />
      </g>
      <Chip x={38} y={84} w={84} text="One view, all theses" fill={N100} color={INK} delay={1000} />
    </g>
  ),
};

export function FeatureScene({ scene }: { scene: SceneKey }) {
  return (
    <svg viewBox="0 0 160 100" className="scene block h-auto w-full" aria-hidden="true" focusable="false">
      {SCENES[scene]()}
    </svg>
  );
}
