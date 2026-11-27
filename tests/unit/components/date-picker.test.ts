// Task R6.2 (DESIGN.md §7.4 `date-picker`, design/screens/S4.md, BR-09, BR-18, UX-022, R6-a A): the S4 date picker.
// Days are PHT days. A day before the earliest date stays focusable, has aria-disabled and the BR-09 reason.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { addDays, addMonths, DATE_REASON, DatePicker, moveDay, phtDay } from "@/components/patterns/date-picker";

// 18 Jan 2027, 17:00 UTC is 19 Jan 2027, 01:00 PHT: the PHT day differs from the UTC day.
const earliest = new Date("2027-01-18T17:00:00Z");
const render = (value: string | null = null) =>
  renderToStaticMarkup(createElement(DatePicker, { id: "defense-date", label: "Defense date", name: "date", earliest, value, onChange: () => {} }));

describe("date picker day keys (PHT, UTC+8)", () => {
  it("takes the day in Philippine time, not in UTC", () => {
    expect(phtDay(earliest)).toBe("2027-01-19");
  });

  it("adds days and months across month and year ends, and keeps the day inside a short month", () => {
    expect(addDays("2027-01-31", 1)).toBe("2027-02-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
    expect(addMonths("2027-01-31", 1)).toBe("2027-02-28");
    expect(addMonths("2027-01-15", -1)).toBe("2026-12-15");
  });
});

describe("date picker keyboard grid", () => {
  // 13 Jan 2027 is a Wednesday.
  it.each([
    ["ArrowLeft", "2027-01-12"],
    ["ArrowRight", "2027-01-14"],
    ["ArrowUp", "2027-01-06"],
    ["ArrowDown", "2027-01-20"],
    ["Home", "2027-01-10"],
    ["End", "2027-01-16"],
    ["PageUp", "2026-12-13"],
    ["PageDown", "2027-02-13"],
  ])("%s moves to %s", (key, to) => {
    expect(moveDay("2027-01-13", key)).toBe(to);
  });

  it("ignores other keys", () => {
    expect(moveDay("2027-01-13", "a")).toBeNull();
  });
});

describe("date picker (R6.2)", () => {
  it("blocks each day before the earliest date with aria-disabled and the BR-09 reason, and keeps it focusable", () => {
    const html = render();
    const blocked = html.match(/<button[^>]*data-day="2027-01-18"[^>]*>/)![0];
    expect(blocked).toContain('aria-disabled="true"');
    expect(blocked).not.toMatch(/\sdisabled(=|\s|>)/);
    const reasonId = blocked.match(/aria-describedby="([^"]+)"/)![1];
    expect(html).toMatch(new RegExp(`id="${reasonId}"[^>]*>[\\s\\S]*${DATE_REASON.replace(/\./g, "\\.")}`));
    expect(DATE_REASON).toBe("At least 7 days after Gate 1b.");
  });

  it("leaves the earliest date and later days open", () => {
    const html = render();
    const open = html.match(/<button[^>]*data-day="2027-01-19"[^>]*>/)![0];
    expect(open).not.toContain("aria-disabled");
    expect(html.match(/<button[^>]*data-day="2027-01-25"[^>]*>/)![0]).not.toContain("aria-disabled");
  });

  it("is a labelled grid with one tab stop, on the earliest date when nothing is chosen", () => {
    const html = render();
    expect(html).toMatch(/<table[^>]*role="grid"/);
    const days = html.match(/<button[^>]*data-day="[^"]+"[^>]*>/g)!;
    expect(days.filter((b) => b.includes('tabindex="0"'))).toHaveLength(1);
    expect(html).toMatch(/<button[^>]*data-day="2027-01-19"[^>]*tabindex="0"|<button[^>]*tabindex="0"[^>]*data-day="2027-01-19"/);
    expect(html).toContain("January 2027");
  });

  it("marks the chosen day, opens on its month and sends it as yyyy-mm-dd in the form", () => {
    const html = render("2027-02-03");
    expect(html).toContain("February 2027");
    expect(html).toMatch(/<td[^>]*aria-selected="true"[^>]*>\s*<button[^>]*data-day="2027-02-03"/);
    expect(html).toMatch(/<input[^>]*type="hidden"[^>]*name="date"[^>]*value="2027-02-03"|<input[^>]*name="date"[^>]*type="hidden"[^>]*value="2027-02-03"/);
  });

  it("names each day in full for screen readers and uses tokens only", () => {
    const html = render();
    expect(html).toContain('aria-label="Tuesday 19 January 2027"');
    expect(html).not.toMatch(/#[0-9a-fA-F]{6}\b/);
  });
});
