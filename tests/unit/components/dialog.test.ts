// Task R3.5 (DESIGN.md §8.9, UX-010, BR-19, decision R3-e): the confirm dialog for permanent actions.
// Server rendering does not render a portal, so the open dialog is checked through its body part and
// the source; the keyboard walk in /lab checks focus, Escape and focus return (R3.9).
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConfirmBody, confirmCopy } from "@/components/patterns/dialog";

const src = readFileSync("src/components/patterns/dialog/index.tsx", "utf8");

describe("confirm dialog copy (R3.5)", () => {
  it("Verify: the form and the Student in the title, and the lock in the body", () => {
    expect(confirmCopy({ kind: "verify", form: "TDW_12", student: "Dino Aquino" })).toEqual({
      title: "Verify TDW 12 for Dino Aquino?",
      body: "This locks the document.",
      confirmLabel: "Verify",
    });
  });

  it("uses the same shape for Endorse, Gate 2, Record verdict, Scan matches and Close the stage", () => {
    const kinds = [
      { kind: "endorse1a", student: "Dino Aquino" },
      { kind: "endorse1b", student: "Dino Aquino" },
      { kind: "gate2", student: "Dino Aquino" },
      { kind: "verdict", student: "Dino Aquino" },
      { kind: "scanMatches", student: "Dino Aquino", form: "TDW_08" },
      { kind: "closeStage", student: "Dino Aquino" },
    ] as const;
    for (const k of kinds) {
      const c = confirmCopy(k);
      expect(c.title).toMatch(/\?$/);
      expect(c.title).toContain("Dino Aquino");
      expect(c.body.split(/\.\s/).length).toBe(1); // one sentence
      expect(c.body.split(" ").length).toBeLessThanOrEqual(25);
      expect(c.confirmLabel).not.toMatch(/approve|reject|sign/i);
    }
    expect(confirmCopy({ kind: "endorse1b", student: "Dino Aquino", locks: true }).confirmLabel).toBe("Endorse and lock manuscript");
    expect(confirmCopy({ kind: "endorse1b", student: "Dino Aquino" }).confirmLabel).toBe("Endorse (Gate 1b)");
  });

  it("states the facts of the domain: only the last Gate 1b endorsement locks, and a verdict can change until held (R3.10)", () => {
    expect(confirmCopy({ kind: "endorse1b" }).body).toMatch(/the manuscript locks after the last endorsement/);
    expect(confirmCopy({ kind: "endorse1b", locks: true }).body).toMatch(/this locks the manuscript until the defense closes/);
    expect(confirmCopy({ kind: "verdict" }).body).toMatch(/change it only until the defense is held/);
    expect(confirmCopy({ kind: "verdict" }).body).not.toMatch(/cannot change/);
  });

  it("names the record only when the screen has no Student name (PR workspace, Defense Day)", () => {
    for (const kind of ["endorse1a", "endorse1b", "gate2", "verdict"] as const) {
      const c = confirmCopy({ kind });
      expect(c.title).toMatch(/\?$/);
      expect(c.title).not.toMatch(/undefined|for \?$/);
    }
    expect(confirmCopy({ kind: "gate2" }).title).toBe("Endorse the final manuscript (Gate 2)?");
  });
});

describe("confirm dialog body (R3.5)", () => {
  const html = renderToStaticMarkup(
    createElement(ConfirmBody, {
      body: "This locks the document.",
      confirmLabel: "Verify",
      pending: false,
      state: { status: "idle" },
      formId: "f",
    }),
  );

  it('shows the body, the confirm button named with the verb, and "Cancel"', () => {
    expect(html).toContain("This locks the document.");
    expect(html).toMatch(/>Verify</);
    expect(html).toMatch(/>Cancel</);
  });

  it("keeps an error inside the dialog in the feedback slot", () => {
    const err = renderToStaticMarkup(
      createElement(ConfirmBody, {
        body: "This locks the document.",
        confirmLabel: "Verify",
        pending: false,
        state: { status: "error", message: "The scan is no longer waiting." },
        formId: "f",
      }),
    );
    expect(err).toMatch(/role="alert"/);
    expect(err).toContain("The scan is no longer waiting.");
  });

  it("waits with a pending button that keeps its width", () => {
    const p = renderToStaticMarkup(
      createElement(ConfirmBody, { body: "b", confirmLabel: "Verify", pending: true, state: { status: "pending" }, formId: "f" }),
    );
    expect(p).toMatch(/aria-busy="true"/);
  });
});

describe("confirm dialog source (R3.5, R3-e)", () => {
  it("uses Base UI dialog, starts focus on Cancel by default (option A), and has no red fill (F3)", () => {
    expect(src).toContain('from "@base-ui/react/dialog"');
    expect(src).toMatch(/initialFocus=\{/);
    expect(src).toMatch(/focus = "cancel"/);
    expect(src).not.toMatch(/bg-destructive\b|variant="destructive"/);
  });
  it("uses tokens only, a reduced-motion path and solid focus outlines", () => {
    expect(src).toMatch(/^"use client";\r?\n\/\/ Source: /);
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(src).toMatch(/motion-reduce:/);
  });
});
