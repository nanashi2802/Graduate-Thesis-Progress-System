// Task R6.3 (DESIGN.md §7.4 `defense-form`, design/screens/A5.md, P4.md, FR-DEF-05, BR-01, BR-15, F4, UX-023, UX-025,
// R6-b A, R6-d A): the Defense Day sheet. 48 px steppers, the total is the plain sum, no grade and no color on a score.
// A verified or closed sheet shows its values as text with a `done` stamp. No autosave (AGENTS.md §9).
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DefenseForm, SAVED_LINE, sheetTotal, type DefenseRow } from "@/components/patterns/defense-form";

const rows: DefenseRow[] = [
  { id: "i1", code: "A1", name: "Problem and objectives", weight: 30, score: 27 },
  { id: "i2", code: "A2", name: "Method", weight: 40, score: 31.5 },
  { id: "i3", code: "A3", name: "Presentation", weight: 30, score: null },
];
const render = (mode: "edit" | "verified" | "closed", extra: Record<string, unknown> = {}) =>
  renderToStaticMarkup(createElement(DefenseForm, { rows, mode, onSave: async () => ({ ok: true }), ...extra }));

describe("sheetTotal", () => {
  it("is the plain sum of the saved scores; an empty score counts as nothing", () => {
    expect(sheetTotal(rows)).toBe(58.5);
    expect(sheetTotal([])).toBe(0);
  });
});

describe("defense form (R6.3)", () => {
  it("edit: one 48 px number stepper for each row, named score_<id>, with minus and plus buttons", () => {
    const html = render("edit");
    for (const r of rows) expect(html).toMatch(new RegExp(`<input[^>]*name="score_${r.id}"`));
    expect(html.match(/aria-label="Decrease score for A\d"/g)).toHaveLength(3);
    expect(html.match(/aria-label="Increase score for A\d"/g)).toHaveLength(3);
    expect(html).toMatch(/data-slot="score-stepper"[^>]*class="[^"]*\bh-12\b/);
  });

  it("shows the code, the name and the weight of each row, and the total of the max", () => {
    const html = render("edit");
    expect(html).toContain(">A1<");
    expect(html).toContain("Problem and objectives");
    expect(html).toMatch(/of 30/);
    expect(html).toMatch(/data-slot="sheet-total"[\s\S]*58\.5[\s\S]*of 100/);
  });

  it("has no grade word and no tone color on a score (F4, BR-15)", () => {
    for (const mode of ["edit", "verified"] as const) {
      const html = render(mode);
      expect(html).not.toMatch(/\b(grade|passed|failed|excellent|satisfactory)\b/i);
      const total = html.match(/data-slot="sheet-total"[^>]*>/)![0];
      expect(total).not.toMatch(/text-tone-|text-destructive|text-primary/);
    }
  });

  it("does not show the paper line before a save (BR-01: it shows once, after the save)", () => {
    expect(render("edit")).not.toContain(SAVED_LINE);
    expect(SAVED_LINE).toBe("Saved. Sign the paper sheet.");
  });

  it("edit: a 48 px Save button; a blocked save shows its reason (BR-18)", () => {
    const open = render("edit");
    expect(open).toMatch(/<button[^>]*type="submit"[^>]*class="[^"]*\bh-12\b[\s\S]*Save my evaluation/);
    const blocked = render("edit", { blockedReason: "Opens at the scheduled start." });
    expect(blocked).toMatch(/aria-disabled="true"[\s\S]*Save my evaluation/);
    expect(blocked).toContain("Opens at the scheduled start.");
  });

  it.each(["verified", "closed"] as const)("%s: the values as text with a done stamp, and no field or button (UX-023, R6-b A)", (mode) => {
    const html = render(mode);
    expect(html).not.toMatch(/<input|<textarea|<select|<button/);
    expect(html).toMatch(/data-slot="sheet-stamp"[\s\S]*<svg/);
    expect(html).toContain(mode === "verified" ? "Verified by the Coordinator" : "The defense is closed");
    expect(html).toMatch(/data-slot="sheet-score"[^>]*>27</);
    expect(html).toMatch(/data-slot="sheet-score"[^>]*>Not entered</);
  });

  it("draws the focus ring around the whole stepper, outside it, and none inside the input (DESIGN.md §10)", () => {
    const html = render("edit");
    expect(html).toMatch(/data-slot="score-stepper"[^>]*class="[^"]*has-\[input:focus-visible\]:outline-offset-2/);
    for (const input of html.match(/<input[^>]*aria-roledescription="Number field"[^>]*>/g)!) expect(input).not.toMatch(/focus-visible:(-outline-offset|outline-2)/);
  });

  it("turns off browser validation, so a score like 12.5 is not refused by the hidden step=1 input (the server checks)", () => {
    expect(render("edit")).toMatch(/<form[^>]*novalidate/i);
  });

  it("has no autosave: nothing saves on change or on a timer (AGENTS.md §9)", () => {
    const src = readFileSync("src/components/patterns/defense-form/index.tsx", "utf8");
    expect(src).not.toMatch(/setInterval|setTimeout|onBlur=\{[^}]*onSave|onValueChange=\{[^}]*onSave/);
  });
});
