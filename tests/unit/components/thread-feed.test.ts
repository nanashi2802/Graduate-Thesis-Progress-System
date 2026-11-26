// Task R5.4 (DESIGN.md §8.8, §7.4 `thread-feed`, FR-REV-04 to FR-REV-08, BR-05, BR-06, UX-D-03, D-26, ADR-009):
// the thread feed of S2, A2 and P2. Tabs Open (first), All, Resolved with counts. "p. 14" per R5-d. Outdated tag.
// "Addressed by v4". Reply for all, Resolve only for the author, never for the Student. The amber edge on own open threads.
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ThreadFeed, type FeedThread, type ThreadFeedProps } from "@/components/patterns/thread-feed";
import { nextTab } from "@/lib/tabs";

const T = (over: Partial<FeedThread>): FeedThread => ({
  id: "t",
  commitOrdinal: 3,
  author: "Adviser",
  context: "iteration",
  state: "OPEN",
  page: null,
  body: "Chapter 2 needs a clearer statement of the problem.",
  outdated: false,
  addressedBy: [],
  replies: [],
  own: false,
  canResolve: false,
  ...over,
});

const THREADS: FeedThread[] = [
  T({ id: "t1", page: 14, own: true, canResolve: true, body: "Table 4 has no units." }),
  T({ id: "t2", commitOrdinal: 2, outdated: true, addressedBy: [3], author: "Panel Member · Panel Chair", context: "committee_review" }),
  T({ id: "t3", state: "RESOLVED", body: "Fix the reference list order.", replies: [{ id: "r1", author: "Student", body: "Done in v3." }] }),
];

const noop = async () => {};
const props = (over: Partial<ThreadFeedProps> = {}): ThreadFeedProps => ({ threads: THREADS, viewerRole: "adviser", onReply: noop, onResolve: noop, ...over });
const render = (over: Partial<ThreadFeedProps> = {}) => renderToStaticMarkup(createElement(ThreadFeed, props(over)));

describe("thread feed (R5.4)", () => {
  it("has the tabs Open (first, selected), All and Resolved, with counts", () => {
    const html = render();
    const tabs = [...html.matchAll(/<button[^>]*role="tab"[^>]*>([\s\S]*?)<\/button>/g)].map((m) => m[0]);
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toMatch(/aria-selected="true"/);
    expect(tabs[0]).toMatch(/Open[\s\S]*>2</);
    expect(tabs[1]).toMatch(/All[\s\S]*>3</);
    expect(tabs[2]).toMatch(/Resolved[\s\S]*>1</);
    expect(html).toMatch(/role="tablist"/);
    expect(html).toMatch(/role="tabpanel"/);
  });

  it("the Open tab lists the open threads only", () => {
    const html = render();
    expect(html).toContain("Table 4 has no units.");
    expect(html).not.toContain("Fix the reference list order.");
  });

  it('page 14 gives a "p. 14" link to ?commit=3&page=14 (R5-d B), page null gives none', () => {
    const html = render();
    expect(html.match(/>p\. 14</g)).toHaveLength(1);
    expect(html).toMatch(/<a[^>]*href="\?commit=3&amp;page=14"[^>]*>p\. 14<\/a>/);
    expect(html.match(/>p\. \d+</g)).toHaveLength(1);
  });

  it('"p. 14" is never a button (R5-d B only, UX-P-05), and pageHref can keep a page\'s own query', () => {
    expect(render()).not.toMatch(/<button[^>]*>p\. 14<\/button>/);
    const html = render({ pageHref: (p, o) => `/lab/x?role=adviser&commit=${o}&page=${p}` });
    expect(html).toMatch(/href="\/lab\/x\?role=adviser&amp;commit=3&amp;page=14"/);
  });

  it("a Student sees Reply and never Resolve, even on a thread marked canResolve (BR-05)", () => {
    const html = render({ viewerRole: "student" });
    expect(html.match(/<button[^>]*aria-expanded="false"[^>]*>Reply<\/button>/g)).toHaveLength(2);
    expect(html).not.toMatch(/>Resolve</);
  });

  it("Reply is a disclosure button: the reply form stays closed until it is opened", () => {
    const html = render();
    const btn = html.match(/<button[^>]*aria-expanded="false"[^>]*>Reply<\/button>/)?.[0];
    expect(btn).toBeDefined();
    expect(btn).toMatch(/aria-controls="[^"]+"/);
    // The form is not in the page until the button opens it.
    expect(html).not.toContain("Send reply");
  });

  it("a reviewer sees Resolve only on the threads they can resolve (BR-05)", () => {
    const html = render();
    expect(html.match(/>Resolve</g)).toHaveLength(1);
    const t1 = html.split('data-slot="thread"')[1] ?? "";
    expect(t1).toContain(">Resolve<");
  });

  it("gives the viewer's own open threads the amber edge", () => {
    const html = render();
    const items = html.split('data-slot="thread"').slice(1);
    expect(items[0]).toMatch(/data-own="true"/);
    expect(items[0]).toMatch(/border-l-tone-pending-fg/);
    expect(items[1]).not.toMatch(/border-l-tone-pending-fg/);
  });

  it('shows the Outdated tag (BR-06) and "Addressed by v3" (FR-REV-08)', () => {
    const html = render();
    expect(html).toMatch(/>Outdated</);
    expect(html).toMatch(/Addressed by <span[^>]*font-mono[^>]*>v3<\/span>/);
  });

  it("names the author with the designation and the review context", () => {
    const html = render();
    expect(html).toContain("Panel Member · Panel Chair");
    expect(html).toContain("Committee review");
    expect(html).toContain("Adviser review");
  });

  it("sets the body text to a 65-character measure (UX-D-03)", () => {
    const html = render();
    expect(html).toMatch(/<p[^>]*max-w-\[65ch\][^>]*>Table 4 has no units\.<\/p>/);
  });

  it("in the Resolved tab, a resolved thread is one line with the done glyph and a disclosure button", () => {
    const html = render({ defaultTab: "resolved" });
    expect(html).toMatch(/<button[^>]*aria-expanded="false"[^>]*>[\s\S]*?Fix the reference list order\.[\s\S]*?<\/button>/);
    expect(html).toMatch(/data-state="RESOLVED"/);
  });

  it("New thread: a reviewer sees the composer with the optional Page field; it shows its reason when blocked", () => {
    const html = render({ onPost: noop });
    expect(html).toMatch(/<label[^>]*>New thread on v3|New thread/);
    expect(html).toMatch(/<input[^>]*type="number"[^>]*min="1"[^>]*max="9999"/);
    const blocked = render({ onPost: noop, postBlockedReason: "The comment window is closed." });
    expect(blocked).toMatch(/aria-disabled="true"[\s\S]*The comment window is closed\./);
    expect(render({ viewerRole: "student", onPost: noop })).not.toMatch(/New thread/);
  });

  it("puts the thread, reply and post forms on the form-feedback contract (UX-011)", () => {
    const src = readFileSync("src/components/patterns/thread-feed/index.tsx", "utf8");
    expect(src).toContain("FormFeedback");
    expect(src).toContain("PendingButton");
    expect(src).not.toMatch(/#[0-9a-fA-F]{6}\b/);
  });

  it("has no pin or highlight control for the PDF (ADR-009)", () => {
    expect(render()).not.toMatch(/highlight|\bpin\b/i);
  });

  it("an empty tab shows an empty state", () => {
    const html = render({ threads: [] });
    expect(html).toContain("No open threads.");
  });
});

describe("tab keys", () => {
  it("moves with the arrow keys, wraps, and jumps with Home and End", () => {
    expect(nextTab("ArrowRight", 0, 3)).toBe(1);
    expect(nextTab("ArrowRight", 2, 3)).toBe(0);
    expect(nextTab("ArrowLeft", 0, 3)).toBe(2);
    expect(nextTab("Home", 2, 3)).toBe(0);
    expect(nextTab("End", 0, 3)).toBe(2);
    expect(nextTab("a", 1, 3)).toBeNull();
  });
});
