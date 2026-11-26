// Task R4.1 (DESIGN.md §7.4 `task-list`, GOV.UK task list, BR-18, UX-D-16): the task list of S1, S3, S6 and C7.
// Groups of items. Each item has at most one stamp, a label, a reason and actions. A collapsed group is a
// disclosure button with aria-expanded (R4-a B, default) or a native <details> (R4-a A).
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TaskList, type TaskGroup } from "@/components/patterns/task-list";

const RETURN_REASON = "The Dean's signature is missing on page 2. Scan the full form again after the Dean signs it.";

const GROUPS: TaskGroup[] = [
  {
    label: "This milestone",
    items: [
      { id: "tdw07", stamp: { kind: "document", form: "TDW_07", state: "not_started" }, label: "Proposal Defense Endorsement Form", actions: createElement("button", { type: "button" }, "Upload scan") },
      { id: "or", stamp: { kind: "document", form: "OR", state: "returned" }, label: "Official Receipt", reason: { text: RETURN_REASON, kind: "returned" } },
      { id: "ethics", stamp: { kind: "outside", outside: "ethics", value: "UNDER_REVIEW" }, label: "Ethics review", reason: { text: "Blocks the date confirmation.", kind: "blocks" } },
    ],
  },
  {
    label: "Advising forms · optional",
    collapsed: true,
    hint: "Optional. Nobody reviews a copy, and a copy never blocks a step.",
    items: [
      { id: "tdw01", stamp: { kind: "document", form: "TDW_01", state: "not_started" }, label: "Concept Paper Adviser Endorsement Form" },
      { id: "tdw04", stamp: { kind: "document", form: "TDW_04", state: "not_started" }, label: "Adviser Appointment and Acknowledgement Form" },
    ],
  },
];

const render = (extra: Partial<Parameters<typeof TaskList>[0]> = {}) => renderToStaticMarkup(createElement(TaskList, { groups: GROUPS, ...extra }));

describe("task list (R4.1)", () => {
  it("renders each group as a labelled section with a list of items", () => {
    const html = render();
    expect(html.match(/data-slot="task-group"/g)).toHaveLength(2);
    expect(html.match(/data-slot="task-item"/g)).toHaveLength(5);
    expect(html).toMatch(/<h2[^>]*>.*This milestone/);
    expect(html).toMatch(/<ul[^>]*>/);
  });

  it("gives each item at most one stamp", () => {
    const html = render();
    const items = html.split('data-slot="task-item"').slice(1);
    for (const item of items) {
      const stamps = item.match(/data-slot="(document-stamp|outside-chip|status-pill)"/g) ?? [];
      expect(stamps.length).toBeLessThanOrEqual(1);
    }
    expect(html).toContain("TDW 07");
    expect(html).toMatch(/data-slot="outside-chip"/);
  });

  it("a collapsed group is a disclosure button with aria-expanded=false that controls a hidden list (R4-a B)", () => {
    const html = render();
    const button = html.match(/<button[^>]*aria-expanded="false"[^>]*>/)?.[0];
    expect(button).toBeDefined();
    const controls = button!.match(/aria-controls="([^"]+)"/)?.[1];
    expect(controls).toBeTruthy();
    expect(html).toMatch(new RegExp(`<ul[^>]*id="${controls}"[^>]*hidden`));
    expect(button).toMatch(/focus-visible:outline-solid/);
    // The open group has no disclosure button.
    expect(html.match(/aria-expanded=/g)).toHaveLength(1);
  });

  it("with disclosure=details, a collapsed group is a native <details> with a <summary> (R4-a A)", () => {
    const html = render({ disclosure: "details" });
    expect(html).toMatch(/<details[^>]*data-slot="task-group"/);
    expect(html).toMatch(/<summary[^>]*>.*Advising forms · optional/);
    expect(html).not.toMatch(/aria-expanded/);
  });

  it("shows the count of a group, also when it is collapsed", () => {
    const html = render();
    expect(html).toMatch(/Advising forms · optional.*?tabular-nums[^>]*>2</);
  });

  it("shows a returned reason word for word, with the full text in the DOM and a two-line clamp (UX-D-16)", () => {
    const html = render();
    expect(html).toContain(RETURN_REASON.replace(/'/g, "&#x27;"));
    expect(html).toMatch(/data-reason="returned"[^>]*>/);
    expect(html).toMatch(/line-clamp-2/);
  });

  it("an empty group shows its empty slot", () => {
    const html = renderToStaticMarkup(
      createElement(TaskList, { groups: [{ label: "Completed milestones", items: [], empty: createElement("p", null, "No completed milestones yet.") }] }),
    );
    expect(html).toContain("No completed milestones yet.");
    expect(html).not.toMatch(/data-slot="task-item"/);
  });

  it("uses tokens only: no raw palette class, no hex", () => {
    const src = readFileSync("src/components/patterns/task-list/index.tsx", "utf8");
    expect(src.split("\n")[1]).toMatch(/^\/\/ Source: /);
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
    expect(src).not.toMatch(/\b(bg|text|border)-(neutral|maroon|gold|red|green|slate)-\d/);
  });
});
