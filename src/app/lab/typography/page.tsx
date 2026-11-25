// /lab/typography: four font sets on the same real screen parts (owner request, UX-P-01 revision).
// Each set swaps the three font variables that the `font-serif`, `font-sans` and `font-mono` classes use.
import type { CSSProperties, ReactNode } from "react";
import { BlockedAction } from "@/components/patterns/blocked-action";
import { Docket } from "@/components/patterns/docket";
import { IdentityLine } from "@/components/patterns/identity-line";
import { DocumentStamp, MilestoneStatusPill } from "@/components/patterns/status";
import { Stepper } from "@/components/patterns/stepper";
import { atkinson, atkinsonMono, inter, jetbrains, newsreader, plexMono, plexSans, poppins, publicSans, sourceCode, sourceSans, sourceSerif } from "../_mock/fonts";
import { LabHeader } from "../_mock/panels";

type FontSet = { id: string; name: string; serif: string; sans: string; mono: string; vars: CSSProperties; className: string; note: string };

// Override only the variables a set changes. A variable that points at itself is invalid CSS.
const v = (serif?: string, sans?: string, mono?: string) =>
  ({
    ...(serif && { "--font-display": serif }),
    ...(sans && { "--font-text": sans }),
    ...(mono && { "--font-data": mono }),
  }) as CSSProperties;

const SERIF = "var(--font-lab-source-serif)";

const SETS: FontSet[] = [
  {
    id: "E",
    name: "E · Brand guide (approved, UX-D-11)",
    serif: "Poppins",
    sans: "Inter",
    mono: "JetBrains Mono",
    vars: v("var(--font-lab-poppins)", "var(--font-lab-inter)", "var(--font-lab-jetbrains)"),
    className: `${poppins.variable} ${inter.variable} ${jetbrains.variable}`,
    note: "The ThesIsko brand guide: Poppins for titles and headings (round, like the symbol), Inter for text and the interface, JetBrains Mono for revision numbers, dates and IDs.",
  },
  {
    id: "A",
    name: "A · Current",
    serif: "Source Serif 4",
    sans: "IBM Plex Sans",
    mono: "IBM Plex Mono",
    vars: v(SERIF, "var(--font-lab-plex-sans)", "var(--font-lab-plex-mono)"),
    className: `${sourceSerif.variable} ${plexSans.variable} ${plexMono.variable}`,
    note: "Exact and technical. Plex carries a strong IBM corporate voice and a narrow, mechanical rhythm in long Student-facing text.",
  },
  {
    id: "B",
    name: "B · Source family (UX-D-09, replaced by UX-D-11)",
    serif: "Source Serif 4",
    sans: "Source Sans 3",
    mono: "Source Code Pro",
    vars: v(SERIF, "var(--font-lab-source-sans)", "var(--font-lab-source-code)"),
    className: `${sourceSerif.variable} ${sourceSans.variable} ${sourceCode.variable}`,
    note: "One superfamily, drawn to work together. Calm, academic and neutral. Humanist sans reads well in long text and dense tables.",
  },
  {
    id: "C",
    name: "C · Civic",
    serif: "Newsreader",
    sans: "Public Sans",
    mono: "IBM Plex Mono",
    vars: v("var(--font-lab-newsreader)", "var(--font-lab-public-sans)"),
    className: `${newsreader.variable} ${publicSans.variable}`,
    note: "Public Sans is the USWDS font (our Student-path reference). Plain and governmental. Newsreader gives a warmer, editorial title.",
  },
  {
    id: "D",
    name: "D · Legibility first",
    serif: "Source Serif 4",
    sans: "Atkinson Hyperlegible Next",
    mono: "Atkinson Hyperlegible Mono",
    vars: v(SERIF, "var(--font-lab-atkinson)", "var(--font-lab-atkinson-mono)"),
    className: `${sourceSerif.variable} ${atkinson.variable} ${atkinsonMono.variable}`,
    note: "Drawn by the Braille Institute for low vision. Every look-alike character differs (I l 1, O 0). Has the most character, so less neutral.",
  },
];

function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3 border-t border-border pt-4">{children}</div>;
}

function Sample() {
  return (
    <div className="flex flex-col gap-4">
      <p className="font-serif text-[28px] leading-9 font-semibold">Documents</p>
      <IdentityLine title="A fake study of thesis tracking for graduate programs" degreeLevel="masters" student="Ma. Niña Dela Cruz" adviser="Fake Adviser" />
      <Row>
        <Stepper current={3} completed={[1, 2]} />
      </Row>
      <Docket step={3} milestone="Final" status="READY" blocker="Your Adviser has open comments." action={<BlockedAction>Open the manuscript</BlockedAction>} />
      <Row>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th scope="col" className="pb-2 font-semibold">Student</th>
              <th scope="col" className="pb-2 font-semibold">Form</th>
              <th scope="col" className="pb-2 font-semibold">Uploaded</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {[
              ["Ma. Niña Dela Cruz", "TDW_12", "Tue 12 Jan 2027, 09:00 PHT"],
              ["Juan Miguel Illustre", "TDW_11", "Mon 11 Jan 2027, 14:30 PHT"],
              ["Lilibeth O. Ocampo", "OR", "Fri 08 Jan 2027, 10:05 PHT"],
            ].map(([n, f, d]) => (
              <tr key={n} className="border-t border-border">
                <td className="py-2">{n}</td>
                <td className="py-2"><DocumentStamp form={f!} state="scan_uploaded" /></td>
                <td className="py-2 font-mono text-[13px]">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Row>
      <Row>
        <p className="max-w-[60ch] text-base">
          The discussion in chapter 3 does not answer the second research question. Add the results of the pilot test on p. 14,
          then mark a new commit Ready.
        </p>
        <p className="font-mono text-[13px] text-muted-foreground">v3 · a1b2c3d · Il1| O0 · 2027-01-12</p>
        <p className="text-xs leading-4 font-medium text-muted-foreground">Locked until Gate 1b.</p>
        <div className="flex flex-wrap gap-2">
          <MilestoneStatusPill status="CERTIFIED" />
          <MilestoneStatusPill status="RETURNED" />
        </div>
      </Row>
    </div>
  );
}

export default function TypographyLab() {
  return (
    <>
      <LabHeader
        title="Typography options"
        round="R1 · UX-P-01 revision · set E approved (UX-D-11)"
        states={["four font sets", "title, identity line, stepper, docket, table, thread text, data, caption", "Filipino names with ñ", "look-alike characters"]}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {SETS.map((s) => (
          <section key={s.id} aria-label={s.name} className={`${s.className} font-sans flex flex-col gap-4 rounded-card border border-border bg-card p-6`} style={s.vars}>
            <header className="flex flex-col gap-1">
              <h2 className="font-sans text-base font-semibold">{s.name}</h2>
              <p className="font-mono text-xs text-muted-foreground">
                {s.serif} / {s.sans} / {s.mono}
              </p>
              <p className="font-sans text-sm text-muted-foreground">{s.note}</p>
            </header>
            <Sample />
          </section>
        ))}
      </div>
      <UiSizeCompare />
    </>
  );
}

// Open point for the gate: Source Sans 3 sets smaller than Plex, so the `ui` token may move from 14 to 15 px.
function UiSizeCompare() {
  const rows = [
    ["Ma. Niña Dela Cruz", "TDW 12", "Check scan"],
    ["Juan Miguel Illustre", "TDW 11", "Confirm date"],
  ];
  return (
    <section aria-label="UI text size" className="mt-8 flex flex-col gap-4 rounded-card border border-border bg-card p-6">
      <h2 className="text-base font-semibold">Table and control text with Inter: 14 px (table metadata, allowed above the 12.8 px floor) against 15 px</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        {[
          ["14 px (DESIGN.md today)", "text-[14px] leading-5"],
          ["15 px (proposal)", "text-[15px] leading-[22px]"],
        ].map(([label, cls]) => (
          <div key={label} className="flex flex-col gap-3">
            <p className="font-mono text-xs text-muted-foreground">{label}</p>
            <table className={`w-full ${cls}`}>
              <tbody>
                {rows.map(([n, f, a]) => (
                  <tr key={n} className="h-12 border-t border-border">
                    <td>{n}</td>
                    <td className="font-mono">{f}</td>
                    <td className="text-right">
                      <span className={`inline-flex h-8 w-[132px] items-center justify-center rounded-control border border-input ${cls}`}>{a}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <nav className={`flex gap-4 ${cls}`} aria-label={`Sample navigation ${label}`}>
              <span className="font-semibold text-primary">Documents</span>
              <span>Schedule</span>
              <span>Clearance</span>
            </nav>
          </div>
        ))}
      </div>
    </section>
  );
}
