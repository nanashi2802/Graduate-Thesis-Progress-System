// /lab/glyphs: every glyph at 16, 20 and 30 px, in both themes (Task R1.3, DESIGN.md §6.2).
// R2.7: the candidate glyphs of D-06 and D-07, two options for each concept, for gate UX-P-02.
import { Glyph, GLYPH_NAMES } from "@/components/patterns/glyphs";
import { CANDIDATES, CandidateGlyph, chosenOf } from "../_mock/glyph-candidates";
import { Demo, LabHeader, ThemePanels } from "../_mock/panels";

export default function GlyphsLab() {
  return (
    <>
      <LabHeader title="Glyphs" round="R1 · UX-P-01" states={["35 approved glyphs", "16, 20 and 30 px", "ink, link and tone colors"]} />
      <ThemePanels>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          {GLYPH_NAMES.map((name) => (
            <li key={name} className="flex items-center gap-3">
              <span className="flex items-end gap-2 text-foreground">
                <Glyph name={name} size={16} />
                <Glyph name={name} size={20} />
                <Glyph name={name} size={30} />
              </span>
              <span className="font-mono text-xs text-muted-foreground">{name}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex gap-4">
          <span className="text-link"><Glyph name="gate" size={30} /></span>
          <span className="text-tone-done-fg"><Glyph name="verify" size={30} /></span>
          <span className="text-tone-returned-fg"><Glyph name="return" size={30} /></span>
          <span className="text-tone-pending-fg"><Glyph name="flag" size={30} /></span>
        </div>
      </ThemePanels>
      <h2 id="candidates" className="mt-10 mb-2 font-serif text-xl font-semibold">R2 candidates (D-06, D-07)</h2>
      <p className="mb-4 max-w-[72ch] text-sm text-muted-foreground">
        Two options for each concept. The chosen option (26 Nov 2026) is marked. 24 px grid, 1.75 px stroke, outline only, no star, seal or laurel (F1). The status
        glyphs replace the Lucide icons in the pills. The sidebar shows them at 20 px with a label.
      </p>
      <ThemePanels>
        {(["D-06", "D-07"] as const).map((d) => (
          <Demo key={d} title={d === "D-06" ? "D-06: status pill glyphs" : "D-07: sidebar glyphs"}>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {["Concept", "Option A", "Option B"].map((h) => (
                    <th key={h} scope="col" className="border-b border-border px-2 py-2 text-left font-semibold text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CANDIDATES.filter((c) => c.decision === d).map((c) => (
                  <tr key={c.name}>
                    <th scope="row" className="border-b border-border px-2 py-3 text-left font-normal">
                      {c.concept}
                      {c.note ? <span className="block text-[0.8rem] text-muted-foreground">{c.note}</span> : null}
                    </th>
                    {[c.a, c.b].map((g, i) => (
                      <td key={i} className={`border-b border-border px-2 py-3 ${chosenOf(c.name) === (i ? "b" : "a") ? "bg-accent" : "opacity-50"}`}>
                        <span className="flex items-end gap-2 text-foreground">
                          <CandidateGlyph size={16}>{g}</CandidateGlyph>
                          <CandidateGlyph size={20} label={`${c.concept}, option ${i ? "B" : "A"}`}>{g}</CandidateGlyph>
                          <CandidateGlyph size={30}>{g}</CandidateGlyph>
                        </span>
                        {chosenOf(c.name) === (i ? "b" : "a") ? <span className="mt-1 block font-mono text-[0.8rem] text-accent-foreground">Chosen</span> : null}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Demo>
        ))}
      </ThemePanels>
    </>
  );
}
