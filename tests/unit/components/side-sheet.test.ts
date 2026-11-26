// Task R3.6 (DESIGN.md §7.4 side-sheet, decisions R3-d and R3-g): the side sheet. The top bar uses the same popup.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SHEET_WIDTH } from "@/components/patterns/side-sheet";

const src = readFileSync("src/components/patterns/side-sheet/index.tsx", "utf8");
const topBar = readFileSync("src/components/patterns/top-bar/index.tsx", "utf8");

describe("side sheet (R3.6)", () => {
  it("opens from the right with the Base UI drawer (focus trap, Escape) and a swipe to the right", () => {
    expect(src).toContain('from "@base-ui/react/drawer"');
    expect(src).toMatch(/swipeDirection="right"/);
    expect(src).toMatch(/translateX\(100%\)/);
  });

  it("offers 400, 480 and 560 px, and is full width below 640 px (R3-d)", () => {
    expect(Object.keys(SHEET_WIDTH)).toEqual(["400", "480", "560"]);
    for (const w of Object.values(SHEET_WIDTH)) expect(w).toMatch(/^w-full sm:w-\[\d{3}px\]$/);
  });

  it("has a sticky footer slot for the one primary action", () => {
    expect(src).toMatch(/data-slot="sheet-footer" className="[^"]*shrink-0[^"]*border-t/);
  });

  it("uses the scrim token as the one backdrop of every overlay (R3-g A, R3.10)", () => {
    expect(src).toContain('SCRIM = "bg-(--scrim)"');
    const overlays = [
      src,
      readFileSync("src/components/patterns/dialog/index.tsx", "utf8"),
      readFileSync("src/components/patterns/app-shell/nav-drawer.tsx", "utf8"),
      topBar,
    ];
    for (const o of overlays) {
      expect(o).toMatch(/bg-\(--scrim\)|\bSCRIM\b/);
      expect(o).not.toContain("bg-foreground/30");
    }
    const tokens = readFileSync("src/styles/tokens.css", "utf8");
    expect(tokens).toMatch(/--scrim: rgb\(15 23 42 \/ 0\.45\)/);
    expect(tokens).toMatch(/--scrim: rgb\(2 6 23 \/ 0\.6\)/);
  });

  it("is the one sheet look: the top bar imports it, with no copy of its own", () => {
    expect(topBar).toMatch(/from "@\/components\/patterns\/side-sheet"/);
    expect(topBar).not.toMatch(/function SheetPopup/);
  });

  it("uses tokens only, a reduced-motion path and solid focus outlines", () => {
    expect(src).toMatch(/^"use client";\r?\n\/\/ Source: /);
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(src).toMatch(/motion-reduce:/);
    expect(src).toContain("focus-visible:outline-solid");
  });
});
