// /lab/glyphs: every glyph at 16, 20 and 30 px, in both themes (Task R1.3, DESIGN.md §6.2).
import { Glyph, GLYPH_NAMES } from "@/components/patterns/glyphs";
import { LabHeader, ThemePanels } from "../_mock/panels";

export default function GlyphsLab() {
  return (
    <>
      <LabHeader title="Glyphs" round="R1 · UX-P-01" states={["22 approved glyphs", "16, 20 and 30 px", "ink, link and tone colors"]} />
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
    </>
  );
}
