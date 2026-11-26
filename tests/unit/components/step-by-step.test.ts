// Task R4.2 (DESIGN.md §7.4 `step-by-step`, GOV.UK step-by-step navigation, FR-TRK-01): the PROCESS steps.
// The current step shows "You are here" and is expanded. The other steps are collapsed. Done steps have the `done` glyph.
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StepByStep, type Step } from "@/components/patterns/step-by-step";

const STEPS: Step[] = [
  { id: "proposal", title: "Proposal", current: false, done: true, body: createElement("p", null, "Proposal body") },
  { id: "pre-final", title: "Pre-Final", current: true, done: false, body: createElement("p", null, "Pre-Final body") },
  { id: "final", title: "Final", current: false, done: false, body: createElement("p", null, "Final body") },
  { id: "clearance", title: "Clearance", current: false, done: false, body: createElement("p", null, "Clearance body") },
];

const render = (extra: Partial<Parameters<typeof StepByStep>[0]> = {}) => renderToStaticMarkup(createElement(StepByStep, { steps: STEPS, ...extra }));

/** The <li> of one step, by its title. */
const stepHtml = (html: string, title: string) => html.split('data-slot="step"').slice(1).find((s) => s.includes(`>${title}<`)) ?? "";

describe("step-by-step (R4.2)", () => {
  it("is an ordered list of 4 steps, numbered", () => {
    const html = render();
    expect(html).toMatch(/<ol[^>]*data-slot="step-by-step"/);
    expect(html.match(/data-slot="step"/g)).toHaveLength(4);
    expect(stepHtml(html, "Final")).toMatch(/>3</);
  });

  it("the current step shows 'You are here', has aria-current=step and is expanded", () => {
    const html = render();
    const current = stepHtml(html, "Pre-Final");
    expect(current).toContain("You are here");
    expect(current).toMatch(/aria-current="step"/);
    expect(current).toMatch(/aria-expanded="true"/);
    expect(current).toContain("Pre-Final body");
    expect(html.match(/You are here/g)).toHaveLength(1);
    expect(html.match(/aria-current="step"/g)).toHaveLength(1);
  });

  it("the other steps are collapsed: aria-expanded=false and a hidden body that the button controls", () => {
    const html = render();
    for (const title of ["Proposal", "Final", "Clearance"]) {
      const s = stepHtml(html, title);
      const button = s.match(/<button[^>]*aria-expanded="false"[^>]*>/)?.[0];
      expect(button, title).toBeDefined();
      const controls = button!.match(/aria-controls="([^"]+)"/)?.[1];
      expect(s).toMatch(new RegExp(`id="${controls}"[^>]*hidden`));
    }
  });

  it("done steps have the done glyph and a text state; other steps do not", () => {
    const html = render();
    expect(stepHtml(html, "Proposal")).toMatch(/data-glyph="done"/);
    expect(stepHtml(html, "Proposal")).toContain("Done");
    for (const title of ["Pre-Final", "Final", "Clearance"]) expect(stepHtml(html, title)).not.toMatch(/data-glyph="done"/);
  });

  it("each step heading is a heading with a button inside (GOV.UK), and a 'Show all steps' control exists", () => {
    const html = render();
    expect(html).toMatch(/<h2[^>]*><button[^>]*aria-expanded/);
    expect(html).toContain("Show all steps");
  });

  it("on a phone with phone=current, the other steps are hidden below 640 px and a 'Show all steps' link shows them (R4-d B)", () => {
    const html = render({ phone: "current" });
    expect(stepHtml(html, "Final")).toMatch(/max-sm:hidden/);
    expect(stepHtml(html, "Pre-Final")).not.toMatch(/max-sm:hidden/);
  });

  it("uses tokens only: no raw palette class, no hex", () => {
    const src = readFileSync("src/components/patterns/step-by-step/index.tsx", "utf8");
    expect(src.split("\n")[1]).toMatch(/^\/\/ Source: /);
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
    expect(src).not.toMatch(/\b(bg|text|border)-(neutral|maroon|gold|red|green|slate)-\d/);
  });
});
