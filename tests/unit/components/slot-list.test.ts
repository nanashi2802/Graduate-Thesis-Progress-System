// Task R6.1 (DESIGN.md §7.4 `slot-list`, design/screens/S4.md, A4.md, P3.md, FR-SCH-01 to FR-SCH-03, UX-039, G5):
// one slot list for S4, A4 and P3. At most 3 facts in a row. A confirmed slot names the Student. One state word.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SlotList, type SlotEntry } from "@/components/patterns/slot-list";

const at = (h: number) => new Date(Date.UTC(2027, 0, 12, h - 8));
const slots: SlotEntry[] = [
  { id: "s1", startsAt: at(9), endsAt: at(10), mode: "in_person", place: "Room 301", status: "available" },
  { id: "s2", startsAt: at(13), endsAt: at(14), mode: "online", status: "pending", student: "Dino Aquino" },
  { id: "s3", startsAt: at(15), endsAt: at(16), mode: "in_person", place: "Room 301", status: "confirmed", student: "Ella Santos" },
];
const render = (extra: Record<string, unknown> = {}) =>
  renderToStaticMarkup(createElement(SlotList, { label: "My slots", slots, empty: createElement("p", null, "No slots yet."), ...extra }));

describe("slot list (R6.1)", () => {
  it("is a labelled list with one row for each slot", () => {
    const html = render();
    expect(html).toMatch(/<ul[^>]*aria-label="My slots"/);
    expect(html.match(/data-slot="slot-row"/g)).toHaveLength(3);
  });

  it("shows the time in PHT, the place and one state, and no more than 3 facts (G5)", () => {
    const html = render();
    expect(html).toContain("Tue 12 Jan 2027, 09:00 to 10:00 PHT");
    expect(html).toContain("In person · Room 301");
    for (const row of html.split('data-slot="slot-row"').slice(1)) expect(row.match(/data-fact/g)?.length).toBeLessThanOrEqual(3);
  });

  it("names the Student on a confirmed and a requested slot (UX-039)", () => {
    const html = render();
    expect(html).toMatch(/Confirmed[\s\S]{0,200}Ella Santos/);
    expect(html).toMatch(/Requested[\s\S]{0,200}Dino Aquino/);
  });

  it("uses one state word in a row, never twice (UX-039)", () => {
    const row = render().split('data-slot="slot-row"')[3]!;
    expect(row.match(/Confirmed/g)).toHaveLength(1);
  });

  it("shows the meeting link only when the page passes it (FR-SCH-03)", () => {
    expect(render()).not.toContain("meet.example");
    const withLink = renderToStaticMarkup(
      createElement(SlotList, { label: "My requests", slots: [{ ...slots[2]!, mode: "online", place: null, meetingLink: "https://meet.example/abc" }], empty: null }),
    );
    expect(withLink).toMatch(/<a[^>]*href="https:\/\/meet\.example\/abc"/);
  });

  it("renders the row action the page gives, and the empty state when there are no slots", () => {
    const html = render({ action: (s: SlotEntry) => (s.status === "available" ? createElement("button", { type: "button" }, "Remove") : null) });
    expect(html.match(/>Remove</g)).toHaveLength(1);
    const empty = render({ slots: [] });
    expect(empty).toContain("No slots yet.");
    expect(empty).not.toContain("<ul");
  });
});
