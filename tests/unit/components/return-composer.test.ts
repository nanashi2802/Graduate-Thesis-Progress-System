// Task R3.4 (DESIGN.md §8.9, design/screens/C4.md "Writing a Return", BR-13, BR-18, UX-D-16): the inline Return composer.
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ReturnComposer, ReturnResult, canSend } from "@/components/patterns/return-composer";

const props = { onSend: async () => {}, onCancel: () => {}, placeholder: "Example: the scan has no Adviser signature." };

describe("Return composer (R3.4)", () => {
  it('labels the field "Reason for return" with one placeholder example', () => {
    const html = renderToStaticMarkup(createElement(ReturnComposer, props));
    expect(html).toMatch(/<label[^>]*for="[^"]+"[^>]*>Reason for return<\/label>/);
    expect(html).toMatch(/<textarea[^>]*placeholder="Example: the scan has no Adviser signature."/);
  });

  it('blocks "Send return" with "Write a reason first" while the field is empty', () => {
    const html = renderToStaticMarkup(createElement(ReturnComposer, props));
    expect(html).toMatch(/aria-disabled="true"[^>]*>[\s\S]*Send return/);
    expect(html).toContain("Write a reason first");
  });

  it("treats a reason of only spaces as empty", () => {
    expect(canSend("")).toBe(false);
    expect(canSend("   \n\t")).toBe(false);
    expect(canSend("The scan has no Adviser signature.")).toBe(true);
  });

  it("has a Cancel button, no preset reasons and no solid red fill (F3)", () => {
    const html = renderToStaticMarkup(createElement(ReturnComposer, props));
    expect(html).toMatch(/>Cancel</);
    expect(html).not.toMatch(/<select|type="radio"|bg-destructive\b|bg-tone-returned-fg/);
    const src = readFileSync("src/components/patterns/return-composer/index.tsx", "utf8");
    expect(src).toContain("FormFeedback");
  });

  it("keeps the result on the screen: Returned to the Student, the reason in quotes, the time", () => {
    const html = renderToStaticMarkup(
      createElement(ReturnResult, { student: "Dino Aquino", reason: "The scan has no Adviser signature.", at: new Date("2027-01-12T01:00:00Z") }),
    );
    expect(html).toMatch(/role="status"/);
    expect(html).toContain("Returned to Dino Aquino");
    expect(html).toContain("“The scan has no Adviser signature.”");
    expect(html).toMatch(/<time dateTime="2027-01-12T01:00:00.000Z"/);
  });
});
