// Task R3.10 (UX-010 to UX-013, R3-h A, DESIGN.md §8.4, §8.9, §10 Forms): the one form-feedback contract on the
// live forms, and the confirm dialog on the permanent actions. The server actions do not change.
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionForm as CoordinatorForm, Field as CoordinatorField, feedbackOf, ResultSlot } from "@/app/coordinator/_lib/form-parts";

const read = (p: string) => readFileSync(p, "utf8");
const actionForm = read("src/app/_components/action-form.tsx");
const formParts = read("src/app/coordinator/_lib/form-parts.tsx");

describe("feedbackOf: a coordinator result in the FormFeedback slot", () => {
  it("shows ok as a workflow result on the screen, an error as an error, and nothing while it waits", () => {
    expect(feedbackOf({ ok: "The date is confirmed." })).toEqual({ status: "done", message: "The date is confirmed." });
    expect(feedbackOf({ error: "Upload the scan first." })).toEqual({ status: "error", message: "Upload the scan first." });
    expect(feedbackOf({ error: "x", ok: "y" })).toEqual({ status: "error", message: "x" });
    expect(feedbackOf({})).toEqual({ status: "idle" });
    expect(feedbackOf({ ok: "y" }, true)).toEqual({ status: "pending" });
  });
});

describe("coordinator form parts (R3.10)", () => {
  it("ActionForm has a PendingButton and a fixed-height message slot", () => {
    const html = renderToStaticMarkup(createElement(CoordinatorForm, { action: async () => ({}), submit: "Save" }));
    expect(html).toMatch(/data-slot="form-feedback" class="[^"]*\bh-10\b/);
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*>[\s\S]*Save[\s\S]*Saving…/);
  });

  it("ResultSlot shows an error with role=alert and a result with role=status", () => {
    const err = renderToStaticMarkup(createElement(ResultSlot, { state: { error: "The member declined." } }));
    expect(err).toMatch(/role="alert"/);
    expect(err).toContain("The member declined.");
    const ok = renderToStaticMarkup(createElement(ResultSlot, { state: { ok: "Seat proposed." } }));
    expect(ok).toMatch(/role="status"/);
    expect(ok).not.toMatch(/role="alert"/);
  });

  it("Field is the FormField pattern: the label names the control, and the hint is linked", () => {
    const html = renderToStaticMarkup(
      // Field has no hooks, so a direct call renders it (createElement with children as props breaks a lint rule).
      CoordinatorField({ label: "Email address", htmlFor: "email", hint: "The system sends the sign-in email.", children: createElement("input", { id: "email" }) }),
    );
    expect(html).toMatch(/<label for="email"/);
    expect(html).toMatch(/<input id="email" aria-describedby="email-hint"/);
    expect(html).toContain('data-slot="form-field"');
  });

  it("the old class names are the form-field control classes (44 px on tablet)", () => {
    expect(formParts).toMatch(/export const fieldClass = control\.input;/);
    expect(actionForm).toMatch(/export const inputClass = control\.input;/);
    expect(actionForm).toMatch(/export const areaClass = control\.textarea;/);
  });
});

describe("shared ActionForm (R3.10)", () => {
  it("uses PendingButton and FormFeedback, and no ad-hoc error line", () => {
    expect(actionForm).toMatch(/<PendingButton pending=\{pending\}/);
    expect(actionForm).toMatch(/<FormFeedback state=\{state\} id=\{formId\} lines=\{feedbackLines\} \/>/);
    expect(actionForm).not.toContain("text-destructive");
  });

  it("keeps the toast for small actions only and refreshes after success", () => {
    expect(actionForm).toMatch(/if \(successToast\) toast\.show\(\{ label: successToast, tone: "done" \}\)/);
    expect(actionForm).toMatch(/router\.refresh\(\)/);
  });

  it("a confirm prop holds the FormData and sends it from the dialog", () => {
    expect(actionForm).toMatch(/if \(confirm\) \{\s*setHeld\(data\);\s*return;/);
    expect(actionForm).toMatch(/const res = await action\(held\);/);
  });
});

describe("no live form keeps an ad-hoc error line (UX-011)", () => {
  const files = [
    "src/app/coordinator/committees/committee-forms.tsx",
    "src/app/coordinator/schedule/schedule-forms.tsx",
    "src/app/coordinator/clearance/forms.tsx",
    "src/app/coordinator/documents/review-form.tsx",
    "src/app/coordinator/defense/[defenseId]/defense-forms.tsx",
  ];
  for (const f of files) {
    it(f, () => {
      const src = read(f);
      // The uploader on C6 keeps its progress line until R7d (R3.10 notes). Every other message is the slot.
      const rest = src.replace(/export function SheetScanUploader[\s\S]*?\n}\n/, "");
      expect(rest).not.toMatch(/role="status" aria-live="polite"/);
      expect(src).toMatch(/ResultSlot/);
    });
  }
});

describe("permanent actions ask once more (R3-h A, UX-010, BR-19)", () => {
  it("Endorse (Gate 1a, Gate 1b) and Gate 2 open a ConfirmDialog before the server action", () => {
    const src = read("src/app/_components/workspace-controls.tsx");
    const endorse = src.slice(src.indexOf("export function EndorseButton"), src.indexOf("export function ReturnForm"));
    expect(endorse).toMatch(/onClick=\{\(\) => blockedReason === undefined && setOpen\(true\)\}/);
    expect(endorse).toMatch(/<ConfirmDialog/);
    expect(endorse).toMatch(/await e\.act\(milestoneId\)/);
    expect(endorse).not.toMatch(/onClick=\{[^}]*run\(/);
    expect(src).toMatch(/gate1a: \{[^}]*copy: "endorse1a", act: endorseGate1a/);
    expect(src).toMatch(/gate1b: \{[^}]*copy: "endorse1b", act: endorseCommit/);
    expect(src).toMatch(/gate2: \{[^}]*copy: "gate2", act: approveFinalAction/);
  });

  it("Record verdict passes the verdict copy to ActionForm", () => {
    const src = read("src/app/_components/defense-day.tsx");
    expect(src).toMatch(/submitLabel="Record verdict"[\s\S]{0,200}confirm=\{confirmCopy\(\{ kind: "verdict" \}\)\}/);
  });

  it("Verify on C4 is a ConfirmButton with to=verified; Return stays a submit", () => {
    const src = read("src/app/coordinator/documents/review-form.tsx");
    expect(src).toMatch(/<ConfirmButton[\s\S]*fields=\{\{ to: "verified" \}\}[\s\S]*kind: "verify"/);
    expect(src).toMatch(/type="submit" name="to" value="returned"/);
    expect(src).not.toMatch(/value="verified"/);
  });

  it('"Scan matches" and "Close the stage" on C6 are ConfirmButtons; Mismatch stays a submit', () => {
    const src = read("src/app/coordinator/defense/[defenseId]/defense-forms.tsx");
    expect(src).toMatch(/fields=\{\{ result: "matched" \}\}[\s\S]*kind: "scanMatches"/);
    expect(src).toMatch(/<ConfirmButton action=\{closeDefenseAction\}[^>]*kind: "closeStage"/);
    expect(src).toMatch(/type="submit" name="result" value="mismatch"/);
    expect(src).not.toMatch(/value="matched"/);
  });

  it("ConfirmButton never opens the dialog for a blocked action, and sends the form data to the same action", () => {
    expect(formParts).toMatch(/onClick=\{\(\) => blockedReason === undefined && setOpen\(true\)\}/);
    expect(formParts).toMatch(/const data = new FormData\(formRef\.current \?\? undefined\);/);
    expect(formParts).toMatch(/const res = await action\(\{\}, data\);\s*if \(res\.error\) return \{ error: res\.error \};/);
  });
});
