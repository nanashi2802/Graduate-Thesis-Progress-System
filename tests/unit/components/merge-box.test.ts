// Task R5.1 (DESIGN.md §5.3 S2 merge box, §7.4 `merge-box`, design/screens/S2.md, BR-07, BR-18): the S2 merge box.
// One sentence, at most one action. When there is no action, the locked reason shows in its place.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MergeBox } from "@/components/patterns/merge-box";

const button = createElement("button", { type: "button" }, "Mark Ready");

describe("merge box (R5.1)", () => {
  it("shows one sentence and one action", () => {
    const html = renderToStaticMarkup(createElement(MergeBox, { sentence: "Mark v3 Ready when you want your Adviser to read it.", action: button }));
    expect(html.match(/data-slot="merge-sentence"/g)).toHaveLength(1);
    expect(html).toContain("Mark v3 Ready when you want your Adviser to read it.");
    expect(html.match(/data-slot="merge-action"/g)).toHaveLength(1);
    expect(html).toContain(">Mark Ready<");
    expect(html).not.toContain('data-slot="merge-reason"');
  });

  it("shows the locked reason with the lock glyph when the action is null (BR-07, BR-18)", () => {
    const html = renderToStaticMarkup(
      createElement(MergeBox, { sentence: "Your manuscript is with the Evaluation Committee.", action: null, lockedReason: "Locked until the defense is closed.", state: "locked" }),
    );
    expect(html).not.toContain('data-slot="merge-action"');
    expect(html).toMatch(/data-slot="merge-reason"[^>]*>[\s\S]*<svg[\s\S]*Locked until the defense is closed\./);
  });

  it("refuses a box with no action and no reason (BR-18: never hide a blocked action without its reason)", () => {
    expect(() => renderToStaticMarkup(createElement(MergeBox, { sentence: "x", action: null }))).toThrow(/reason/);
  });

  it("refuses an action and a locked reason together (one action or its reason, not both)", () => {
    expect(() => renderToStaticMarkup(createElement(MergeBox, { sentence: "x", action: button, lockedReason: "Locked." }))).toThrow(/both/);
  });

  it("marks the state for the glyph and uses tokens only (no raw hex)", () => {
    const html = renderToStaticMarkup(createElement(MergeBox, { sentence: "Your Adviser reads v3 next.", action: null, lockedReason: "Wait for the Adviser to endorse or return this commit.", state: "ready" }));
    expect(html).toContain('data-state="ready"');
    expect(html).not.toMatch(/#[0-9a-fA-F]{6}\b/);
  });

  it("holds no upload control: the upload is in the workspace (R5-b A adapted, UX-P-05)", () => {
    const html = renderToStaticMarkup(createElement(MergeBox, { sentence: "Mark v4 Ready.", action: button }));
    expect(html).not.toMatch(/type="file"|merge-upload/);
  });
});
