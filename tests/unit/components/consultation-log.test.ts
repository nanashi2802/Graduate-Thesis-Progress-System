// Task R6.5 (DESIGN.md §7.4 `consultation-log`, design/screens/A3.md, FR-SCH-05, FR-SCH-06): the TDW 03 columns on the
// queue-table pattern, comfortable density.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConsultationLog, type ConsultationEntry } from "@/components/patterns/consultation-log";

const rows: ConsultationEntry[] = [
  { id: "c1", heldAt: new Date("2027-01-12T01:00:00Z"), place: "Room 301", topics: "Chapter 3 method", confirmed: true },
  { id: "c2", heldAt: new Date("2027-01-19T06:30:00Z"), place: "Google Meet", topics: null, confirmed: false },
];
const render = (r = rows) =>
  renderToStaticMarkup(createElement(ConsultationLog, { rows: r, empty: createElement("p", null, "No consultations yet. Entries appear here after each booked consultation.") }));

describe("consultation log (R6.5)", () => {
  it("is a real table with the TDW 03 columns in sentence case", () => {
    const html = render();
    expect(html).toMatch(/<table/);
    for (const h of ["Date and time", "Place or platform", "Topics", "Adviser confirmation"]) expect(html).toMatch(new RegExp(`<th[^>]*scope="col"[\\s\\S]*?${h}`));
  });

  it("shows the time in PHT, the topics, and the confirmation as a status", () => {
    const html = render();
    expect(html).toContain("Tue 12 Jan 2027, 09:00 PHT");
    expect(html).toContain("Chapter 3 method");
    expect(html).toContain("No topics yet");
    expect(html).toMatch(/Confirmed/);
    expect(html).toMatch(/To confirm/);
  });

  it("uses the comfortable density (56 px rows)", () => {
    expect(render()).toContain("h-(--row-h-comfortable)");
  });

  it("shows the empty state with the first-day text when there are no rows", () => {
    const html = render([]);
    expect(html).toContain("No consultations yet.");
  });
});
