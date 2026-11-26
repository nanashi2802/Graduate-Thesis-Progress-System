// Tasks R2.4 and R2.5 (UX-011, UX-026, DESIGN.md §8.4): loading blocks, the inline error, and the form-feedback contract.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ErrorState } from "@/components/patterns/error";
import { FormFeedback, PendingButton } from "@/components/patterns/form-feedback";
import { LoadingBlocks, PageLoadingBlocks, Spinner } from "@/components/patterns/loading";

describe("LoadingBlocks (R2.5, UX-D-15)", () => {
  const html = renderToStaticMarkup(createElement(LoadingBlocks, { rows: 3, label: "Loading the queue" }));

  it("marks the region busy and gives a hidden text", () => {
    expect(html).toMatch(/aria-busy="true"/);
    expect(html).toMatch(/<span class="sr-only">Loading the queue<\/span>/);
  });

  it("pulses by default and stops with reduced motion (UX-D-15)", () => {
    expect(html.match(/data-block/g)!.length).toBeGreaterThanOrEqual(3);
    expect(html).toContain("animate-skeleton");
    expect(html).toContain("motion-reduce:animate-none");
    const b = renderToStaticMarkup(createElement(LoadingBlocks, { rows: 2, effect: "shimmer" }));
    expect(b).toContain("animate-shimmer");
    expect(b).toContain("motion-reduce:animate-none");
  });

  it.each(["rows", "rows-compact", "kpi", "cards", "docket", "form", "list", "inbox", "tasks", "steps"] as const)("draws the %s shape", (shape) => {
    const out = renderToStaticMarkup(createElement(LoadingBlocks, { shape }));
    expect(out).toMatch(new RegExp(`data-shape="${shape}"`));
    expect(out).toMatch(/aria-busy="true"/);
    expect(out).toMatch(/data-block/);
  });

  it.each(["dashboard", "queue", "record", "form", "overview", "inbox", "process"] as const)("has a page preset for a %s screen", (kind) => {
    const out = renderToStaticMarkup(createElement(PageLoadingBlocks, { kind }));
    expect(out).toMatch(new RegExp(`data-page="${kind}"`));
    expect(out.match(/aria-busy="true"/g)).toHaveLength(1);
  });

  it("gives a spinner for inline waits, hidden from screen readers, still with reduced motion", () => {
    const out = renderToStaticMarkup(createElement(Spinner));
    expect(out).toMatch(/aria-hidden="true"/);
    expect(out).toContain("animate-spin");
    expect(out).toContain("motion-reduce:animate-none");
  });
});

describe("ErrorState (R2.5)", () => {
  const html = renderToStaticMarkup(createElement(ErrorState, { what: "The queue did not load.", todo: "Try again. If it fails again, tell the Coordinator.", onRetry: () => {} }));

  it("names what failed and what to do, with a Try again button", () => {
    expect(html).toContain("The queue did not load.");
    expect(html).toContain("Try again. If it fails again, tell the Coordinator.");
    expect(html).toMatch(/<button[^>]*>[\s\S]*Try again<\/button>/);
  });

  it("is an alert region and shows no internal detail", () => {
    expect(html).toMatch(/role="alert"/);
    expect(html).not.toMatch(/digest|stack|Error:/);
  });
});

describe("form-feedback contract (R2.4)", () => {
  it("keeps the pending button focusable, busy and the same width (both labels in one grid cell)", () => {
    const html = renderToStaticMarkup(createElement(PendingButton, { pending: true, label: "Save", pendingLabel: "Saving" }));
    expect(html).toMatch(/aria-busy="true"/);
    expect(html).toMatch(/aria-disabled="true"/);
    expect(html).not.toMatch(/\sdisabled=""/);
    expect(html).toMatch(/class="[^"]*invisible[^"]*"[^>]*>Save</);
    expect(html).toContain("Saving");
  });

  it("shows an error as an alert under the form, linked to the field when the server names one", () => {
    const html = renderToStaticMarkup(createElement(FormFeedback, { state: { status: "error", message: "Enter a date.", field: "date" }, id: "f1" }));
    expect(html).toMatch(/role="alert"/);
    expect(html).toMatch(/id="f1-error"/);
    expect(html).toMatch(/data-field="date"/);
  });

  it("shows a workflow result as an on-screen status, polite", () => {
    const html = renderToStaticMarkup(createElement(FormFeedback, { state: { status: "done", message: "Returned to the Student." }, id: "f2" }));
    expect(html).toMatch(/role="status"/);
    expect(html).toContain("Returned to the Student.");
  });

  // UX-D-16 addition (owner, 26 Nov 2026): one fixed height for the slot in every state.
  const LONG =
    "The server refused the date. The defense date must be at least 7 days after Gate 1b, and the printed copies are due 7 days before it. Choose a later date.";
  const slot = (h: string) => h.match(/^<div[^>]*data-slot="form-feedback"[^>]*>/)?.[0] ?? "";
  const render = (state: Parameters<typeof FormFeedback>[0]["state"], lines?: 2 | 3 | 4) =>
    renderToStaticMarkup(createElement(FormFeedback, { state, id: "f3", lines }));

  it("gives the slot the same fixed height in idle, error and done (3 lines by default)", () => {
    const idle = slot(render({ status: "idle" }));
    expect(idle).toMatch(/(^|\s|")h-15(\s|")/);
    expect(slot(render({ status: "error", message: "Enter a date." }))).toBe(idle);
    expect(slot(render({ status: "done", message: "Saved." }))).toBe(idle);
    expect(slot(render({ status: "pending" }))).toBe(idle);
  });

  it("uses no minimum height, and takes another line count from the lines prop", () => {
    for (const lines of [2, 3, 4] as const) expect(slot(render({ status: "idle" }, lines))).not.toMatch(/min-h-/);
    expect(slot(render({ status: "idle" }, 2))).toMatch(/(^|\s|")h-10(\s|")/);
    expect(slot(render({ status: "idle" }, 4))).toMatch(/(^|\s|")h-20(\s|")/);
  });

  it("keeps the slot height for a long message, clamps it on the screen, and keeps the full text in the DOM", () => {
    const html = render({ status: "error", message: LONG, field: "date" });
    expect(slot(html)).toMatch(/(^|\s|")h-15(\s|")/);
    expect(html).toMatch(/line-clamp-3/);
    expect(html).toContain(LONG);
    // The field link points to the element that holds the full text.
    expect(html).toMatch(new RegExp(`id="f3-error"[^>]*>[\s\S]*${LONG.slice(0, 40)}`));
    expect(html).not.toMatch(/role="alert"[^>]*aria-hidden/);
  });

  it("keeps role=alert for an error and role=status for a result, with the glyph on the first line", () => {
    expect(render({ status: "error", message: "Enter a date." })).toMatch(/role="alert"/);
    const done = render({ status: "done", message: "Saved." });
    expect(done).toMatch(/role="status"/);
    expect(done).toMatch(/items-start/);
    expect(done).toMatch(/mt-0\.5/);
  });

  it("shows nothing in an idle slot", () => {
    expect(render({ status: "idle" })).not.toMatch(/role="alert"|role="status"/);
  });
});

// Task R5.7 (UX-D-15): the workspace shape and page preset: the header, the box, the viewer block and the feed lines.
describe("loading: the workspace (R5.7)", () => {
  it("draws the workspace shape: header, box, a viewer block and feed lines, split at laptop", () => {
    const out = renderToStaticMarkup(createElement(LoadingBlocks, { shape: "workspace" }));
    expect(out).toMatch(/data-shape="workspace"/);
    expect(out).toMatch(/data-part="box"/);
    expect(out).toMatch(/data-part="viewer"/);
    expect(out).toMatch(/data-part="feed"/);
    expect(out).toMatch(/lg:grid-cols-\[minmax\(0,1fr\)_400px\]/);
  });

  it("has a workspace page preset with one busy region", () => {
    const out = renderToStaticMarkup(createElement(PageLoadingBlocks, { kind: "workspace" }));
    expect(out).toMatch(/data-page="workspace"/);
    expect(out.match(/aria-busy="true"/g)).toHaveLength(1);
  });
});
