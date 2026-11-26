// Task R3.7 (DESIGN.md §10 Forms, UX-012, UX-013, UX-D-16, Stripe forms UX-D-03): the form field.
// The label sits above the control, the hint and the error sit under it, both linked with aria-describedby.
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FormField, control } from "@/components/patterns/form-field";

const field = (p: { hint?: string; error?: string; lines?: 1 | 2 }) =>
  renderToStaticMarkup(
    // Children as a prop: the props type of FormField needs it (react/no-children-prop is for JSX use).
    // eslint-disable-next-line react/no-children-prop
    createElement(FormField, { label: "Email", id: "email", ...p, children: createElement("input", { name: "email", className: control.input }) }),
  );

describe("form field (R3.7)", () => {
  it("gives the control its id and the label for it", () => {
    const html = field({});
    expect(html).toMatch(/<label[^>]*for="email"[^>]*>Email<\/label>/);
    expect(html).toMatch(/<input[^>]*id="email"/);
  });

  it("links the hint with aria-describedby", () => {
    const html = field({ hint: "Use the university email." });
    expect(html).toMatch(/<input[^>]*aria-describedby="email-hint"/);
    expect(html).toMatch(/id="email-hint"[^>]*>Use the university email\./);
  });

  it("links the error and the hint, sets aria-invalid, and keeps the hint for screen readers", () => {
    const html = field({ hint: "Use the university email.", error: "This email already has an account." });
    expect(html).toMatch(/<input[^>]*aria-describedby="email-error email-hint"/);
    expect(html).toMatch(/<input[^>]*aria-invalid="true"/);
    expect(html).toMatch(/id="email-error" role="alert"[\s\S]*?This email already has an account\./);
    expect(html).toMatch(/id="email-hint" class="sr-only"/);
  });

  it("gives no aria-describedby and no aria-invalid when there is nothing to describe", () => {
    const html = field({});
    expect(html).not.toMatch(/aria-describedby="/);
    expect(html).not.toMatch(/aria-invalid="/);
  });

  it("keeps one fixed-height slot under the field in every state (UX-D-16)", () => {
    for (const p of [{}, { hint: "h" }, { error: "e" }]) expect(field(p)).toMatch(/data-slot="field-message" class="[^"]*\bh-5\b/);
    for (const p of [{ lines: 2 as const }, { hint: "h", lines: 2 as const }, { error: "e", lines: 2 as const }])
      expect(field(p)).toMatch(/data-slot="field-message" class="[^"]*\bh-10\b/);
  });

  it("gives one control class set: 44 px on tablet, solid focus outline, tokens only (UX-013)", () => {
    expect(control.input).toMatch(/\bh-11\b/);
    expect(control.select).toMatch(/\bh-11\b/);
    expect(control.textarea).not.toMatch(/\bh-11\b/);
    for (const c of Object.values(control)) {
      expect(c).toContain("focus-visible:outline-solid");
      expect(c).toContain("border-input");
      expect(c).toContain("aria-invalid:border-tone-returned-fg");
    }
    const src = readFileSync("src/components/patterns/form-field/index.tsx", "utf8");
    expect(src).toMatch(/^\/\/ Source: /);
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
