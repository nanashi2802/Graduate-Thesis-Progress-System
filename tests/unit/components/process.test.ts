// Task R4.3 (design/screens/PROCESS.md, DESIGN.md §8.2, §8.12, G2, G3, FR-TRK-01, FR-DOC-01): the content and the
// view of the Thesis process screen. 4 steps, no Stage 0, the counts of the Student's degree level only.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { processPosition, processSteps } from "@/app/student/process/steps";
import { ProcessView } from "@/app/student/process/view";

const text = (degree: "masters" | "doctoral") =>
  processSteps(degree)
    .flatMap((s) => s.activities.map((a) => `${a.who} ${a.text}`))
    .join("\n");

describe("PROCESS content (R4.3)", () => {
  it("has 4 steps: Proposal, Pre-Final, Final, Clearance. Stage 0 is not a step", () => {
    expect(processSteps("masters").map((s) => s.title)).toEqual(["Proposal", "Pre-Final", "Final", "Clearance"]);
    const codes = processSteps("doctoral").flatMap((s) => s.forms.map((f) => f.code));
    for (const advising of ["TDW_01", "TDW_02", "TDW_04"]) expect(codes).not.toContain(advising);
  });

  it("names the counts of the degree level only (G2): 2 or 3 Panel Members, Final Panel 3 or 4, 5 or 6 copies", () => {
    const m = text("masters");
    const d = text("doctoral");
    expect(m).toContain("2 Panel Members");
    expect(m).not.toContain("3 Panel Members");
    expect(d).toContain("3 Panel Members");
    expect(d).not.toContain("2 Panel Members");
    expect(m).toMatch(/Final Panel of 3 members/);
    expect(d).toMatch(/Final Panel of 4 members/);
    expect(m).toContain("5 printed copies");
    expect(d).toContain("6 printed copies");
  });

  it("lists the forms of each step from the default templates (migration 0003)", () => {
    const forms = Object.fromEntries(processSteps("masters").map((s) => [s.title, s.forms.map((f) => f.code)]));
    expect(forms["Proposal"]).toEqual(["TDW_03", "TDW_05", "TDW_06", "TDW_07", "TDW_08"]);
    expect(forms["Pre-Final"]).toEqual(["TDW_03", "TDW_09", "TDW_10"]);
    expect(forms["Final"]).toEqual(["TDW_03", "TDW_05", "TDW_11", "TDW_12", "TDW_13"]);
    expect(forms["Clearance"]).toEqual([]);
  });

  it("names each gate and each defense in its step, in order", () => {
    const kinds = (title: string) => processSteps("masters").find((s) => s.title === title)!.activities.filter((a) => a.kind).map((a) => a.text.split(".")[0]);
    expect(kinds("Proposal")).toEqual(["Gate 1a", "Gate 1b", "Proposal Defense"]);
    expect(kinds("Final")).toEqual(["Gate 1a", "Gate 1b", "Final Defense"]);
    expect(kinds("Clearance")).toContain("Gate 2");
    // UI words: no "signed" for an in-system action (BR-01, G9), no "Evaluator" or "Admin" (AGENTS.md §8).
    const all = text("masters") + text("doctoral");
    expect(all).not.toMatch(/Evaluator|Admin|e-sign/i);
    expect(all).not.toMatch(/\b(endorsement|approval) (is )?signed\b/i);
  });

  it("maps the milestone to the step, with the same rule as the S1 stepper", () => {
    expect(processPosition("proposal", "DRAFT")).toEqual({ current: 1, completed: [] });
    expect(processPosition("pre_final", "READY")).toEqual({ current: 2, completed: [1] });
    expect(processPosition("final", "DEFENSE_SCHEDULED")).toEqual({ current: 3, completed: [1, 2] });
    expect(processPosition("final", "FINAL_APPROVED")).toEqual({ current: 4, completed: [1, 2, 3] });
    expect(processPosition("final", "CLEARED")).toEqual({ current: null, completed: [1, 2, 3, 4] });
  });
});

describe("PROCESS view (R4.3)", () => {
  const render = (extra: Partial<Parameters<typeof ProcessView>[0]> = {}) =>
    renderToStaticMarkup(
      createElement(ProcessView, { degreeLevel: "masters", position: processPosition("pre_final", "READY"), formHref: (c: string) => `/forms/${c}.doc`, ...extra }),
    );

  it("shows the title with the degree level, the stepper and the 4 steps", () => {
    const html = render();
    expect(html).toMatch(/<h1[^>]*>Thesis process<\/h1>/);
    expect(html).toContain("Master&#x27;s");
    expect(html).toMatch(/data-slot="stepper"/);
    expect(html.match(/data-slot="step"/g)).toHaveLength(4);
    expect(html).toMatch(/aria-current="step"[^]*Pre-Final/);
  });

  it("gives each form its mono number, its name and a 'Download form' link with a unique name", () => {
    const html = render();
    expect(html).toMatch(/font-mono[^>]*>TDW 09</);
    expect(html).toContain("Pre-Final Defense Endorsement Form");
    expect(html).toMatch(/<a[^>]*href="\/forms\/TDW_09.doc"[^>]*download[^>]*>Download form<span class="sr-only">, TDW 09/);
  });

  it("has no action other than form downloads: no button except the step toggles", () => {
    const html = render();
    const buttons = html.match(/<button[^>]*>/g) ?? [];
    for (const b of buttons) expect(b).toMatch(/aria-expanded|data-slot="step-toggle-all"/);
    expect(html).not.toMatch(/<form/);
  });

  it("without formHref (R4-b C), a form shows its number and name and no download", () => {
    const html = render({ formHref: undefined });
    expect(html).toContain("TDW 09");
    expect(html).not.toContain("Download form");
  });
});
