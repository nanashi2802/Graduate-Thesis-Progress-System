// Task R5.6 (DESIGN.md §5.6, §7.4 `workspace`, design/screens/S2.md, A2.md, P2.md): the manuscript workspace.
// Header, box, commit selector, viewer and feed. A split view at laptop (feed 400 px). Below 1024 px the thread feed is
// a tab (R5-a A). The S2 upload sits at the foot of the Manuscript column, not sticky (R5-b A adapted, UX-P-05).
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Workspace, type WorkspaceProps } from "@/components/patterns/workspace";

const el = (slot: string, text: string) => createElement("div", { "data-testid": slot }, text);
const props = (over: Partial<WorkspaceProps> = {}): WorkspaceProps => ({
  header: el("header", "Proposal manuscript"),
  box: el("box", "Merge box"),
  commits: el("commits", "Commit list"),
  viewer: el("viewer", "The PDF"),
  feed: el("feed", "The threads"),
  threadCount: 4,
  ...over,
});
const render = (over: Partial<WorkspaceProps> = {}) => renderToStaticMarkup(createElement(Workspace, props(over)));

describe("workspace (R5.6)", () => {
  it("renders the header, box, commits, viewer and feed in that order", () => {
    const html = render();
    const order = ["Proposal manuscript", "Merge box", "Commit list", "The PDF", "The threads"].map((t) => html.indexOf(t));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("splits at laptop: the viewer column and a 400 px feed column", () => {
    const html = render();
    expect(html).toMatch(/lg:grid-cols-\[minmax\(0,1fr\)_400px\]/);
  });

  it("R5-a A: below 1024 px, a tab list Manuscript and Threads with the count; hidden at laptop", () => {
    const html = render();
    const list = html.match(/<div[^>]*role="tablist"[^>]*>[\s\S]*?<\/div>/)?.[0];
    expect(list).toMatch(/lg:hidden/);
    expect(list).toMatch(/Manuscript/);
    expect(list).toMatch(/Threads[\s\S]*>4</);
    // The Manuscript tab starts selected. The feed hides below laptop only, so the split view keeps it.
    expect(list).toMatch(/aria-selected="true"[^>]*>[\s\S]*?Manuscript/);
    const feed = html.match(/<section[^>]*aria-label="Threads"[^>]*>/)?.[0];
    expect(feed).toMatch(/max-lg:hidden/);
    expect(feed).toMatch(/role="tabpanel"/);
  });

  it("R5-b A, adapted (owner, UX-P-05): the upload is a region at the foot of the Manuscript column, never sticky", () => {
    const html = render({ upload: el("upload", "Upload a version") });
    const region = html.match(/<div[^>]*data-slot="upload-region"[^>]*>/)?.[0];
    expect(region).toBeDefined();
    expect(region).not.toMatch(/sticky|fixed/);
    // Inside the Manuscript section, after the viewer: on a tablet it sits in the Manuscript tab.
    const manuscript = html.match(/<section[^>]*aria-label="Manuscript"[\s\S]*?<\/section>/)?.[0] ?? "";
    expect(manuscript.indexOf("The PDF")).toBeLessThan(manuscript.indexOf("Upload a version"));
    expect(render()).not.toContain('data-slot="upload-region"');
  });

  it("has no sticky or fixed part at all (owner, UX-P-05: nothing covers the view)", () => {
    expect(render({ upload: el("upload", "Upload") })).not.toMatch(/\b(sticky|fixed)\b/);
  });

  it("names its regions for screen readers", () => {
    const html = render();
    expect(html).toMatch(/<section[^>]*aria-label="Manuscript"/);
    expect(html).toMatch(/<section[^>]*aria-label="Threads"/);
  });
});
