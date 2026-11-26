// Task R2.2 (D-08, FR-NTF-01, UX-005): the top-bar controls. The bell names the unread count; the badge is 12.8 px or more.
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {} }), usePathname: () => "/" }));
const { NotificationsSheet, UserMenu } = await import("@/components/patterns/top-bar");

const noop = async () => {};
const items = [{ id: "n1", event: "Your Adviser endorsed the manuscript.", nextAction: "Wait for the committee.", createdAt: new Date("2027-01-12T01:00:00Z"), read: false }];

describe("top bar (R2.2)", () => {
  it("names the bell with the unread count and hides the badge from screen readers", () => {
    const html = renderToStaticMarkup(createElement(NotificationsSheet, { items, unread: 12, actions: { markRead: noop, markAllRead: noop } }));
    expect(html).toMatch(/aria-label="Notifications, 12 unread"/);
    expect(html).toMatch(/<span aria-hidden="true"[^>]*>9\+<\/span>/);
    expect(renderToStaticMarkup(createElement(NotificationsSheet, { items: [], unread: 0, actions: { markRead: noop, markAllRead: noop } }))).toMatch(
      /aria-label="Notifications, none unread"/,
    );
  });

  it("uses a 12.8 px badge (UX-005), tokens only, and solid focus outlines", () => {
    const src = readFileSync("src/components/patterns/top-bar/index.tsx", "utf8");
    expect(src).not.toMatch(/text-\[1[01]px\]/);
    expect(src).toContain("text-[0.8rem]");
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(src).not.toMatch(/\b(?:bg|text|border)-(?:maroon|gold|neutral)-\d/);
    expect(src).toContain("focus-visible:outline-solid");
  });

  it("keeps the Mark all read row in the source with a fixed height (UX-D-16)", () => {
    const src = readFileSync("src/components/patterns/top-bar/index.tsx", "utf8");
    expect(src).toMatch(/data-slot="mark-all" className="[^"]*h-9/);
  });

  it("renders the user menu trigger with the user name", () => {
    const html = renderToStaticMarkup(
      createElement(UserMenu, { userName: "Ana Cruz", roleLabel: "Student", preferences: [], actions: { savePreferences: noop, signOut: noop } }),
    );
    expect(html).toContain("Ana Cruz");
    expect(html).toMatch(/aria-haspopup="menu"/);
  });
});
