// The notification center panel (FR-NTF-01, DESIGN.md §9): read and unread states, a count, no raw ids in the text.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { NotificationPanel } from "@/components/notification-panel";
// The server actions pull in the sign-in SDK. The panel test only renders markup, so use stubs.
vi.mock("@/app/_lib/notification-actions", () => ({ markReadAction: async () => {}, markAllReadAction: async () => {} }));

import type { NotificationItem } from "@/server/data/notifications";

const item = (over: Partial<NotificationItem> = {}): NotificationItem => ({
  id: "n1",
  eventCode: "B3",
  event: "A document was returned",
  nextAction: "Read the reason and upload a corrected scan.",
  targetTable: null,
  targetId: null,
  createdAt: new Date("2026-11-22T01:00:00Z"),
  read: false,
  ...over,
});
const render = (items: NotificationItem[], unread: number) => renderToStaticMarkup(createElement(NotificationPanel, { items, unread }));

describe("NotificationPanel", () => {
  it("shows the unread count in the label and the badge", () => {
    const html = render([item()], 1);
    expect(html).toContain("Notifications, 1 unread");
    expect(html).toContain("A document was returned");
    expect(html).toContain("Read the reason and upload a corrected scan.");
    expect(html).toContain("Mark all read");
    expect(html).toContain("Mark read");
  });

  it("marks an unread item for a screen reader, and offers no action on a read item", () => {
    expect(render([item()], 1)).toContain("Unread. ");
    const html = render([item({ read: true })], 0);
    expect(html).not.toContain("Unread. ");
    expect(html).not.toContain("Mark all read");
    expect(html).not.toContain("Mark read");
    expect(html).toContain("Notifications, none unread");
  });

  it("says so when there is nothing, and caps the badge at 9+", () => {
    expect(render([], 0)).toContain("No notifications yet.");
    expect(render([item()], 25)).toContain("9+");
  });

  it("shows times in Philippine Standard Time (NFR-11)", () => {
    expect(render([item()], 1)).toMatch(/Nov 22, 2026.*9:00/); // 01:00 UTC is 09:00 PST.
  });
});
