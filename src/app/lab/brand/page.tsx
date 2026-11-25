// /lab/brand: the hybrid logo strategy (UX-D-10, UX-D-11 item 6) in the places it applies.
// The master artwork files are not in the repository yet (UX-X-19), so `full` and `symbol` show the
// approved text treatment. Drop the SVGs in public/brand/ and pass them as `artwork`.
import { BrandMark } from "@/components/patterns/brand-mark";
import { ThemeToggle } from "@/components/patterns/theme-toggle";
import { Demo, LabHeader, ThemePanels } from "../_mock/panels";

export default function BrandLab() {
  return (
    <>
      <LabHeader
        title="Brand mark"
        round="R1 · UX-P-01 · hybrid logo (UX-D-10)"
        states={["LOGIN: full logo", "role shell top bar: text treatment", "compact navigation: symbol", "artwork pending: text fallback"]}
      />
      <p className="mb-6 max-w-[72ch] rounded-card border border-tone-pending-line bg-tone-pending-bg p-4 text-sm text-tone-pending-fg">
        The official logo artwork (horizontal, vertical, symbol, reversed) is not in the repository yet. Until the SVG files are in
        public/brand/, every slot below shows the text treatment. No logo is redrawn.
      </p>
      <ThemePanels>
        <div className="flex flex-col gap-6">
          <Demo title="LOGIN header: complete symbol and wordmark (artwork slot)">
            <div className="flex w-full flex-col items-center gap-2 rounded-card border border-border bg-card p-8">
              <BrandMark variant="full" descriptor />
              <p className="text-sm text-muted-foreground">Clear space on each side: half the symbol height.</p>
            </div>
          </Demo>
          <Demo title="Role shell top bar: text treatment">
            <div className="flex h-14 w-full items-center gap-3 border-b border-border bg-card px-4">
              <BrandMark variant="text" />
              <span className="text-sm text-muted-foreground">Coordinator</span>
              <div className="ml-auto">
                <ThemeToggle compact />
              </div>
            </div>
          </Demo>
          <Demo title="Compact navigation (below 140 px): symbol only (artwork slot)">
            <div className="flex h-14 w-16 items-center justify-center border border-dashed border-divider-strong bg-card">
              <BrandMark variant="symbol" />
            </div>
            <p className="max-w-[40ch] text-sm text-muted-foreground">Empty until the symbol artwork arrives. A screen reader still reads “ThesIsko”.</p>
          </Demo>
        </div>
      </ThemePanels>
    </>
  );
}
