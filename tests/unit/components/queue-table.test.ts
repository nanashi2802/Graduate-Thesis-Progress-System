// Task R3.1 (DESIGN.md §5.4, §5.6, §10 Tables, UX-014, UX-036, UX-D-16, BR-18): the queue table.
// Real table markup, sentence-case headers, aria-sort, two densities, equal row actions, long text on one line.
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { QueueTable, type QueueColumn } from "@/components/patterns/queue-table";

type Row = { id: string; student: string; title: string; kind: string; days: number; blocked?: string };

const LONG = "A study of ".padEnd(200, "x");
const ROWS: Row[] = [
  { id: "r1", student: "Dino Aquino", title: LONG, kind: "Check scans", days: 6 },
  { id: "r2", student: "Bea Santos", title: "Short title", kind: "Confirm dates", days: 3, blocked: "Opens at Gate 1b." },
];
const COLUMNS: QueueColumn<Row>[] = [
  { key: "student", label: "Student", width: "180px", sortable: true, text: (r) => r.student },
  { key: "title", label: "Thesis title", long: true, text: (r) => r.title },
  { key: "days", label: "Waiting", width: "96px", sortable: true, text: (r) => `${r.days}d` },
];

const render = (extra: Partial<Parameters<typeof QueueTable<Row>>[0]> = {}) =>
  renderToStaticMarkup(
    createElement(QueueTable<Row>, {
      caption: "Action queue",
      columns: COLUMNS,
      rows: ROWS,
      rowKey: (r) => r.id,
      density: "compact",
      empty: createElement("p", null, "No requests are waiting."),
      action: (r) => ({ label: "Check scan", href: `/x/${r.id}`, reason: r.blocked }),
      ...extra,
    }),
  );

describe("queue table (R3.1)", () => {
  it("uses real table markup with a caption and column headers with scope", () => {
    const html = render();
    expect(html).toMatch(/<table[^>]*>/);
    expect(html).toMatch(/<caption[^>]*>Action queue<\/caption>/);
    expect(html.match(/<th scope="col"/g)?.length).toBe(4); // 3 columns and the action column
    expect(html).not.toMatch(/uppercase/);
  });

  it("compact uses table-layout: fixed and the 48 px row token; comfortable uses 56 px", () => {
    const compact = render();
    expect(compact).toMatch(/<table[^>]*class="[^"]*table-fixed/);
    expect(compact).toContain("h-(--row-h-compact)");
    const comfy = render({ density: "comfortable" });
    expect(comfy).toContain("h-(--row-h-comfortable)");
    expect(comfy).not.toContain("h-(--row-h-compact)");
  });

  it("gives every row action the same width, and a blocked row its reason (BR-18)", () => {
    const html = render();
    const widths = html.match(/w-\(--row-action-w\)/g) ?? [];
    expect(widths.length).toBe(2);
    expect(html).toMatch(/aria-disabled="true"/);
    expect(html).toContain("Opens at Gate 1b.");
    // Compact (R3-i): the reason is linked with aria-describedby, not under the button, so the row keeps 48 px.
    const m = html.match(/aria-describedby="([^"]+)"[^>]*>[\s\S]*?Check scan<span id="([^"]+)" class="sr-only">Opens at Gate 1b\.<\/span>/);
    expect(m).not.toBeNull();
    expect(m?.[1]).toBe(m?.[2]);
    expect(html).toMatch(/<a[^>]*href="\/x\/r1"[^>]*>Check scan<\/a>/);
  });

  it("lets a group collapse: the header is a button with aria-expanded that controls its rows (owner, UX-P-03)", () => {
    const html = render({ groupBy: { key: (r) => r.kind, collapsible: true } });
    const btn = html.match(/<button type="button" aria-expanded="true" aria-controls="([^"]+)"[^>]*>[\s\S]*?Check scans/);
    expect(btn).not.toBeNull();
    for (const id of btn![1]!.split(" ")) expect(html).toContain(`<tr id="${id}"`);
    expect(html.match(/aria-expanded="true"/g)?.length).toBe(2);
  });

  it("starts the groups named in defaultCollapsed closed, with their rows hidden and the count still shown", () => {
    const html = render({ groupBy: { key: (r) => r.kind, collapsible: true, defaultCollapsed: ["Confirm dates"] } });
    expect(html).toMatch(/aria-expanded="false"[^>]*>[\s\S]*?Confirm dates[\s\S]*?>1</);
    expect(html).toMatch(/<tr id="[^"]+" hidden=""/);
    expect(html).not.toMatch(/<tr id="[^"]+" hidden=""[^>]*>[\s\S]*?Dino Aquino/);
  });

  it("never lets a compact table get narrower than its fixed columns, so headers cannot overlap", () => {
    // student 180 + title (no width: 120) + days 96 + the action column 164
    expect(render()).toMatch(/<table style="min-width:560px"/);
    expect(render({ density: "comfortable" })).not.toMatch(/min-width/);
  });

  it("hides a minor column below 1024 px, and leaves it out of the minimum width", () => {
    const cols: QueueColumn<Row>[] = [...COLUMNS, { key: "kind", label: "Queue", width: "110px", hideBelowLaptop: true, text: (r) => r.kind }];
    const html = render({ columns: cols });
    expect(html).toMatch(/<th scope="col" class="[^"]*max-lg:hidden[^"]*">.*Queue/);
    expect(html).toMatch(/<table style="min-width:560px"/);
  });

  it("keeps the group order given, whatever the row sort", () => {
    const html = render({ groupBy: { key: (r) => r.kind, order: ["Confirm dates", "Check scans"] } });
    expect(html.indexOf("Confirm dates")).toBeLessThan(html.indexOf("Check scans"));
  });

  it("keeps a comfortable blocked row action's reason visible under the button (BR-18)", () => {
    expect(render({ density: "comfortable" })).toMatch(/<span id="[^"]+" class="[^"]*">.*Opens at Gate 1b\.<\/span>/);
  });

  it("keeps a 200-character title on one line, with the full text in the DOM and a focus stop (R3-c A)", () => {
    const html = render();
    expect(html).toContain(LONG);
    expect(html).toMatch(/data-long="true"[^>]*tabindex="0"|tabindex="0"[^>]*data-long="true"/);
    expect(html).toMatch(/class="[^"]*\btruncate\b[^"]*"[^>]*>A study of/);
  });

  it("clamps a long title to two lines in option B (R3-c B)", () => {
    expect(render({ longText: "clamp" })).toMatch(/line-clamp-2[^>]*>A study of/);
  });

  it("shows the empty slot when there are no rows, and no table", () => {
    const html = render({ rows: [] });
    expect(html).toContain("No requests are waiting.");
    expect(html).not.toContain("<table");
  });

  it("marks sortable headers with aria-sort, and only those", () => {
    const html = render({ sort: { key: "days", dir: "desc" } });
    expect(html).toMatch(/<th scope="col" aria-sort="descending"[^>]*>.*Waiting/);
    expect(html).toMatch(/<th scope="col" aria-sort="none"[^>]*>.*Student/);
    expect(html.match(/aria-sort=/g)?.length).toBe(2);
  });

  it("groups rows into tbody elements with a row-group header and a count", () => {
    const html = render({ groupBy: { key: (r) => r.kind, glyph: () => "scan" } });
    expect(html.match(/<tbody/g)?.length).toBe(2);
    expect(html).toMatch(/<th scope="rowgroup"[^>]*colSpan="4"|<th colSpan="4" scope="rowgroup"|scope="rowgroup"/);
    expect(html).toMatch(/Check scans[\s\S]*?>1</);
  });

  it("stacks rows on a phone with label and value pairs (R3-b A), or scrolls in option B", () => {
    const stack = render();
    expect(stack).toMatch(/data-label="Student"/);
    expect(stack).toContain("max-sm:block");
    const scroll = render({ phone: "scroll" });
    expect(scroll).toMatch(/overflow-x-auto/);
    expect(scroll).not.toContain("max-sm:block");
  });

  it("shows the one primary row action in maroon, the others as outline (R3-f A)", () => {
    const html = render({ action: (r) => ({ label: "Check scan", onClick: () => {}, primary: r.id === "r1" }) });
    expect(html.match(/<button[^>]*class="[^"]*\bbg-primary text-primary-foreground/g)?.length).toBe(1);
    expect(html.match(/<button[^>]*class="[^"]*\bborder-input bg-card/g)?.length).toBe(1);
  });

  it("uses tokens only and solid focus outlines", () => {
    const src = readFileSync("src/components/patterns/queue-table/index.tsx", "utf8");
    expect(src).toMatch(/^(?:"use client";\r?\n)?\/\/ Source: /);
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(src).not.toMatch(/\b(?:bg|text|border)-(?:maroon|gold|neutral)-\d/);
    expect(src).toContain("focus-visible:outline-solid");
  });
});
