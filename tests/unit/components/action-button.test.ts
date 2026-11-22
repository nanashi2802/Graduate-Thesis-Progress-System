import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionButton } from "@/components/action-button";

function render(props: Parameters<typeof ActionButton>[0]) {
  return renderToStaticMarkup(createElement(ActionButton, props));
}

describe("ActionButton (BR-18, DESIGN.md §7.4)", () => {
  it("renders an open action with no reason and no aria-disabled", () => {
    const html = render({ children: "Endorse (Gate 1a)" });
    expect(html).toContain("Endorse (Gate 1a)");
    expect(html).not.toContain('aria-disabled="true"');
    expect(html).not.toContain("aria-describedby");
  });

  it("keeps a blocked action in the tab order with aria-disabled, not disabled", () => {
    const html = render({ children: "Upload commit", blockedReason: "Locked until Gate 1b." });
    expect(html).toContain('aria-disabled="true"');
    expect(html).not.toMatch(/\sdisabled(=""|\s|>)/);
    expect(html).not.toContain('tabindex="-1"');
  });

  it("shows the reason next to the action and links it with aria-describedby", () => {
    const html = render({ children: "Upload commit", blockedReason: "Locked until Gate 1b." });
    const describedBy = html.match(/aria-describedby="([^"]+)"/)?.[1];
    expect(describedBy).toBeTruthy();
    expect(html).toContain(`id="${describedBy}"`);
    expect(html).toMatch(/Locked until Gate 1b\.<\/span>/);
  });

  it("keeps a caller's aria-describedby and adds the reason id", () => {
    const html = render({ children: "Confirm", blockedReason: "Write a reason first.", "aria-describedby": "hint" });
    expect(html).toMatch(/aria-describedby="hint [^"]+"/);
  });

  it("refuses a blocked action with a blank reason", () => {
    expect(() => render({ children: "Confirm", blockedReason: "   " })).toThrow(/BR-18/);
  });
});
