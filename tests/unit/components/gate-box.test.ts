// Task R5.2 (DESIGN.md §5.3 A2/P2 gate box, §7.4 `gate-box`, §8.9, SITEMAP §9, BR-05, BR-18, BR-19, F3): the gate box.
// One row for each check with a pass or fail glyph. One failing check blocks the gate button with that check's reason.
// Return is never disabled and never a solid red fill.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { confirmCopy } from "@/components/patterns/dialog";
import { GateBox, gateBlock, type GateCheck } from "@/components/patterns/gate-box";

const PASS: GateCheck[] = [
  { id: "ready", label: "The Student marked v3 Ready", ok: true },
  { id: "threads", label: "Your threads are resolved", ok: true },
];
const FAIL: GateCheck[] = [
  { id: "ready", label: "The Student marked v3 Ready", ok: true },
  { id: "threads", label: "Your threads are resolved", ok: false, reason: "You have open threads. Resolve them first." },
  { id: "ipmo", label: "The IPMO check passed", ok: false, reason: "The IPMO check has not passed." },
];

const base = { gateLabel: "Endorse (Gate 1a)", confirm: confirmCopy({ kind: "endorse1a" }), onGate: async () => {}, onReturn: async () => {} };
const render = (checks: GateCheck[], extra: Record<string, unknown> = {}) => renderToStaticMarkup(createElement(GateBox, { ...base, checks, ...extra }));

/** The gate button: the button whose text is the gate label. */
const gateButton = (html: string) => html.match(/<button[^>]*>(?:(?!<\/button>)[\s\S])*Endorse \(Gate 1a\)(?:(?!<\/button>)[\s\S])*<\/button>/)?.[0];

describe("gate box (R5.2)", () => {
  it("shows one row for each check, with a pass or a fail glyph", () => {
    const html = render(FAIL);
    expect(html.match(/data-slot="gate-check"/g)).toHaveLength(3);
    expect(html.match(/data-ok="true"/g)).toHaveLength(1);
    expect(html.match(/data-ok="false"/g)).toHaveLength(2);
    expect(html).toContain("You have open threads. Resolve them first.");
    expect(html).toContain("The IPMO check has not passed.");
  });

  it("one failing check gives aria-disabled on the gate button and links that check's reason (BR-18)", () => {
    const html = render([PASS[0]!, { id: "threads", label: "Your threads are resolved", ok: false, reason: "You have open threads. Resolve them first." }]);
    const btn = gateButton(html);
    expect(btn).toMatch(/aria-disabled="true"/);
    const describedBy = btn!.match(/aria-describedby="([^"]+)"/)?.[1];
    expect(describedBy).toBeTruthy();
    const reasonId = describedBy!.split(" ").at(-1)!;
    expect(html).toMatch(new RegExp(`id="${reasonId}"[^>]*>[\\s\\S]*?You have open threads\\. Resolve them first\\.`));
  });

  it("with two failing checks, the gate button gives the first failing reason", () => {
    expect(gateBlock(FAIL)).toBe("You have open threads. Resolve them first.");
    expect(gateBlock(PASS)).toBeUndefined();
    // A failing check with no reason falls back to its label, so the button never has an empty reason.
    expect(gateBlock([{ id: "x", label: "The scan is verified", ok: false }])).toBe("The scan is verified");
  });

  it("all checks pass: the gate button is the one maroon button, not blocked", () => {
    const html = render(PASS);
    const btn = gateButton(html);
    expect(btn).not.toMatch(/aria-disabled="true"/);
    // A bare `bg-primary` class (not a variant such as `aria-disabled:hover:bg-primary`).
    const fill = /(?<![\w:-])bg-primary(?![\w-])/g;
    expect(btn).toMatch(fill);
    expect(html.match(fill)).toHaveLength(1);
  });

  it("Return is never disabled and never a solid red fill (F3), also when the gate is blocked", () => {
    for (const checks of [PASS, FAIL]) {
      const html = render(checks);
      const ret = html.match(/<button[^>]*>(?:(?!<\/button>)[\s\S])*Return to the Student(?:(?!<\/button>)[\s\S])*<\/button>/)?.[0];
      expect(ret).toBeDefined();
      expect(ret).not.toMatch(/aria-disabled="true"|\sdisabled=""/);
      expect(ret).not.toMatch(/(?<![\w:-])(bg-destructive|bg-tone-returned-fg|bg-primary)(?![\w-])/);
      expect(ret).toMatch(/text-tone-returned-fg/);
    }
  });

  it("shows no Return button when the gate has no Return (Gate 1b, Gate 2)", () => {
    const html = render(PASS, { onReturn: undefined });
    expect(html).not.toContain("Return to the Student");
  });

  it("the waiting state: the gate button is blocked with the waiting sentence (A2, no Ready commit)", () => {
    const html = render([], { waiting: "Waiting for the Student to mark a version Ready." });
    expect(gateButton(html)).toMatch(/aria-disabled="true"/);
    expect(html).toContain("Waiting for the Student to mark a version Ready.");
    expect(html).not.toContain('data-slot="gate-check"');
  });

  it("uses tokens only (no raw hex)", () => {
    expect(render(FAIL)).not.toMatch(/#[0-9a-fA-F]{6}\b/);
  });
});
