import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MilestoneStepper, stepStates } from "@/components/milestone-stepper";

describe("MilestoneStepper (DESIGN.md §7.2, FR-TRK-01)", () => {
  it("marks earlier stages completed, the current one active and later ones locked", () => {
    expect(stepStates(0)).toEqual(["active", "locked", "locked", "locked"]);
    expect(stepStates(2)).toEqual(["completed", "completed", "active", "locked"]);
    expect(stepStates(3, true)).toEqual(["completed", "completed", "completed", "completed"]);
  });

  it("gives the active node aria-current=step and a text state for each node", () => {
    const html = renderToStaticMarkup(createElement(MilestoneStepper, { current: 1 }));
    expect(html.match(/aria-current="step"/g)).toHaveLength(1);
    expect(html).toMatch(/aria-current="step"[^>]*>.*Pre-Final<span class="sr-only">, current stage/);
    expect(html).toContain("Proposal<span class=\"sr-only\">, completed");
    expect(html).toContain("Clearance<span class=\"sr-only\">, not started");
  });

  it("has no active node when all stages are done", () => {
    const html = renderToStaticMarkup(createElement(MilestoneStepper, { current: 3, allDone: true }));
    expect(html).not.toContain("aria-current");
  });

  // UX-D-11 item 2 (UX-P-01): completed steps maroon, the current step gold with a maroon edge. No raw palette class.
  it("uses the approved look: completed maroon, current gold (R1.5)", () => {
    const html = renderToStaticMarkup(createElement(MilestoneStepper, { current: 1 }));
    expect(html).toMatch(/data-state="completed".*?border-primary bg-primary text-primary-foreground/);
    expect(html).toMatch(/data-state="active".*?border-2 border-primary bg-progress/);
    expect(html).not.toMatch(/gold-|maroon-|neutral-/);
  });
});
