// Task R5.3 (DESIGN.md §8.7, §7.4 `commit-selector`, BR-19, FR-REV-01): the commit selector of S2, A2, P2 and SV.
// `v3` in mono, the short hash, the date in PHT, the uploader, the Ready pill. A list of links that sets ?commit=.
// No edit or delete control.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CommitSelector, shortHash, type CommitEntry } from "@/components/patterns/commit-selector";

const sha = (c: string) => c.repeat(64).slice(0, 64);
const COMMITS: CommitEntry[] = [
  { id: "c1", ordinal: 1, sha256: sha("a1"), uploadedAt: new Date("2027-01-04T02:00:00Z"), uploader: "You" },
  { id: "c2", ordinal: 2, sha256: sha("b2"), uploadedAt: new Date("2027-01-08T06:30:00Z"), uploader: "You", changeNote: "Chapter 3 rewritten" },
  { id: "c3", ordinal: 3, sha256: sha("c3"), uploadedAt: new Date("2027-01-12T09:15:00Z"), uploader: "You" },
];

const render = (extra: Record<string, unknown> = {}) => renderToStaticMarkup(createElement(CommitSelector, { commits: COMMITS, selectedId: "c3", readyId: "c3", ...extra }));

describe("commit selector (R5.3)", () => {
  it("shows v3 in mono and the 7-character short hash in muted mono", () => {
    const html = render();
    expect(html).toMatch(/<span[^>]*font-mono[^>]*>v3<\/span>/);
    expect(shortHash(sha("c3"))).toBe("c3c3c3c");
    expect(html).toMatch(/<span[^>]*font-mono[^>]*text-muted-foreground[^>]*>c3c3c3c<\/span>/);
  });

  it("shows the date in Philippine Standard Time and the uploader", () => {
    const html = render();
    // 09:15 UTC is 5:15 PM in Manila (UTC+8).
    expect(html).toMatch(/12 Jan 2027|Jan 12, 2027/);
    expect(html).toMatch(/5:15\s?(PM|pm)/);
    expect(html).toContain("PHT");
    expect(html).toContain("You");
  });

  it("marks the Ready commit with the active pill, and only that commit", () => {
    const html = render({ readyId: "c2" });
    expect(html.match(/data-slot="status-pill"/g)).toHaveLength(1);
    const row2 = html.split('data-slot="commit-row"')[2] ?? "";
    expect(row2).toMatch(/data-tone="active"[\s\S]*Ready/);
  });

  it("is a list of links that set ?commit=, with aria-current on the selected commit", () => {
    const html = render();
    expect(html).toMatch(/<nav[^>]*aria-label="Commits"/);
    expect(html).toMatch(/<a[^>]*href="\?commit=1"/);
    expect(html).toMatch(/<a[^>]*href="\?commit=3"[^>]*aria-current="true"/);
    expect(html.match(/aria-current=/g)).toHaveLength(1);
  });

  it("has no edit or delete control (BR-19)", () => {
    const html = render();
    expect(html).not.toMatch(/delete|remove|edit|rename/i);
  });

  it("shows the newest commit first", () => {
    const html = render();
    expect(html.indexOf(">v3<")).toBeLessThan(html.indexOf(">v1<"));
  });

  it("keeps the 3 newest commits open and puts older ones behind a disclosure button with aria-expanded", () => {
    const many: CommitEntry[] = Array.from({ length: 6 }, (_, i) => ({ id: `c${i + 1}`, ordinal: i + 1, sha256: sha(String(i)), uploadedAt: new Date(2027, 0, i + 1), uploader: "You" }));
    const html = renderToStaticMarkup(createElement(CommitSelector, { commits: many, selectedId: "c6" }));
    const button = html.match(/<button[^>]*aria-expanded="false"[^>]*>[\s\S]*?<\/button>/)?.[0];
    expect(button).toMatch(/3 older commits/);
    const controls = button!.match(/aria-controls="([^"]+)"/)?.[1];
    expect(html).toMatch(new RegExp(`id="${controls}"[^>]*hidden`));
  });

  it("opens the older group when the selected commit is in it", () => {
    const many: CommitEntry[] = Array.from({ length: 6 }, (_, i) => ({ id: `c${i + 1}`, ordinal: i + 1, sha256: sha(String(i)), uploadedAt: new Date(2027, 0, i + 1), uploader: "You" }));
    const html = renderToStaticMarkup(createElement(CommitSelector, { commits: many, selectedId: "c1" }));
    expect(html).toMatch(/aria-expanded="true"/);
  });
});
