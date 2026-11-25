// /lab/foundations: ramps, semantic tokens, status tones, type scale, spacing, radius and focus,
// in both themes (Task R1.1, DESIGN.md §3, §4, §5.5, §6.1, §10, §12).
import { BlockedAction } from "@/components/patterns/blocked-action";
import { StatusPill, type Tone } from "@/components/patterns/status";
import { Demo, LabHeader, ThemePanels } from "../_mock/panels";

const RAMP_STEPS = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"];
const SEMANTIC = [
  ["background", "bg-background"], ["card", "bg-card"], ["popover", "bg-popover"], ["muted", "bg-muted"],
  ["primary", "bg-primary"], ["accent", "bg-accent"], ["border", "bg-border"], ["input", "bg-input"],
  ["ring", "bg-ring"], ["divider-strong", "bg-divider-strong"],
] as const;
const TONES: Tone[] = ["neutral", "active", "pending", "done", "returned", "locked", "achieved"];
// Brand guide, Font Sizes for Web and Mobile: 16 px base, ratio 1.25, line height 1.2 headings and 1.5 body,
// caption floor 12.8 px (UX-D-11). Titles in Poppins, text in Inter, data in JetBrains Mono.
const TYPE = [
  ["kpi 39/47 mono", "font-mono text-[2.441rem] leading-[1.2] font-semibold tabular-nums", "12"],
  ["display 39/47 Poppins", "font-serif text-[2.441rem] leading-[1.2] font-semibold", "Fake thesis title"],
  ["title 31/37 Poppins", "font-serif text-[1.953rem] leading-[1.2] font-semibold", "Documents"],
  ["heading 25/30 Poppins", "font-serif text-[1.563rem] leading-[1.2] font-medium", "This milestone"],
  ["subheading 20/24 Inter", "text-[1.25rem] leading-[1.2] font-semibold", "Readiness"],
  ["body 16/24 Inter", "text-base leading-6", "The Coordinator confirms the date."],
  ["ui 14/20 Inter (table metadata, buttons)", "text-sm", "Upload scan"],
  ["caption 12.8/16 Inter", "text-[0.8rem] leading-4 font-medium", "Locked until Gate 1b."],
  ["mono 13/20 JetBrains Mono", "font-mono text-[13px] leading-5", "TDW 07 · v3 · Tue 12 Jan 2027, 09:00 PHT"],
] as const;
const SPACE = [4, 8, 12, 16, 24, 32, 48, 64];

export default function FoundationsLab() {
  return (
    <>
      <LabHeader
        title="Foundations"
        round="R1 · UX-P-01 · brand-aligned (UX-D-11)"
        states={["primitive ramps", "semantic tokens", "status tones", "type scale", "spacing", "radius", "focus ring (Tab to see it)"]}
      />
      <ThemePanels>
        <div className="flex flex-col gap-6">
          <Demo title="Semantic tokens (these change with the theme)">
            {SEMANTIC.map(([name, cls]) => (
              <div key={name} className="flex w-24 flex-col gap-1">
                <span className={`h-10 rounded-control border border-border ${cls}`} />
                <span className="font-mono text-[11px] text-muted-foreground">{name}</span>
              </div>
            ))}
          </Demo>
          <Demo title="Text tokens">
            <p className="text-foreground">Foreground</p>
            <p className="text-text-secondary">Secondary text</p>
            <p className="text-muted-foreground">Muted text</p>
            <p className="text-link underline">Link</p>
            <p className="text-destructive">Returned text</p>
          </Demo>
          <Demo title="Status tones (glyph and label, never color alone)">
            {TONES.map((t) => (
              <StatusPill key={t} tone={t} label={t[0]!.toUpperCase() + t.slice(1)} />
            ))}
          </Demo>
          <Demo title="Primitive ramps from the brand guide (the same in both themes)">
            {(["maroon", "gold", "neutral"] as const).map((ramp) => (
              <div key={ramp} className="flex flex-col gap-1">
                <span className="font-mono text-[11px] text-muted-foreground">{ramp}</span>
                <div className="flex">
                  {RAMP_STEPS.filter((s) => !(ramp === "gold" && s === "900")).map((s) => (
                    <span key={s} title={`${ramp}-${s}`} className="h-6 w-6" style={{ background: `var(--color-${ramp}-${s})` }} />
                  ))}
                </div>
              </div>
            ))}
          </Demo>
          <Demo title="Type scale">
            <div className="flex flex-col gap-3">
              {TYPE.map(([name, cls, sample]) => (
                <div key={name} className="flex flex-col">
                  <span className="font-mono text-[11px] text-muted-foreground">{name}</span>
                  <span className={cls}>{sample}</span>
                </div>
              ))}
            </div>
          </Demo>
          <Demo title="Spacing (4 px base, each step 25% or more)">
            {SPACE.map((n) => (
              <div key={n} className="flex flex-col items-start gap-1">
                <span className="bg-primary" style={{ width: n, height: 8 }} />
                <span className="font-mono text-[11px] text-muted-foreground">{n}</span>
              </div>
            ))}
          </Demo>
          <Demo title="Radius: stamp 2, control 6, card 8, panel 12 (brand guide)">
            <span className="h-10 w-16 rounded-stamp border border-divider-strong bg-card" />
            <span className="h-10 w-16 rounded-control border border-divider-strong bg-card" />
            <span className="h-10 w-16 rounded-card border border-divider-strong bg-card" />
            <span className="h-10 w-16 rounded-panel border border-divider-strong bg-card" />
          </Demo>
          <Demo title="Focus: maroon edge and soft maroon ring (press Tab)">
            <BlockedAction>Primary</BlockedAction>
            <BlockedAction variant="secondary">Secondary</BlockedAction>
            <a href="#focus" className="self-center text-link underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring">
              A link
            </a>
          </Demo>
        </div>
      </ThemePanels>
    </>
  );
}
