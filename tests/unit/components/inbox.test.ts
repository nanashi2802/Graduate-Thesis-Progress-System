// Task R3.3 (design/screens/C4.md, C5.md, UX-034, BR-19): the inbox (list, viewer, record).
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Inbox, InboxList, InboxRecord, StateBar, type InboxItem } from "@/components/patterns/inbox";

const ITEMS: InboxItem[] = [
  { id: "b", href: "?scan=b", student: "Bea Santos", ageDays: 3, late: false, form: "TDW_07", state: "scan_uploaded", milestone: "Proposal" },
  { id: "d", href: "?scan=d", student: "Dino Aquino", ageDays: 6, late: true, form: "TDW_12", state: "scan_uploaded", milestone: "Final" },
];

describe("inbox (R3.3)", () => {
  it("lays out 300 px / flexible / 300 px at laptop, and puts the record under the viewer below 1024 px", () => {
    const html = renderToStaticMarkup(createElement(Inbox, { label: "Scans to check", list: "L", viewer: "V", record: "R" }));
    expect(html).toContain("lg:grid-cols-[300px_minmax(0,1fr)_300px]");
    expect(html).toMatch(/data-region="list"[\s\S]*data-region="viewer"[\s\S]*data-region="record"/);
    const src = readFileSync("src/components/patterns/inbox/index.tsx", "utf8");
    expect(src).toMatch(/sm:\[grid-template-areas:'list_viewer'_'list_record'\]/);
    expect(src).toMatch(/^"use client";\r?\n\/\/ Source: |^\/\/ Source: /);
  });

  it("lists one link for each scan, oldest first, with the stamp, the Student, the age and the milestone", () => {
    const html = renderToStaticMarkup(createElement(InboxList, { label: "Scans to check", items: ITEMS, selectedId: "d", empty: "No scans" }));
    expect(html.indexOf("Dino Aquino")).toBeLessThan(html.indexOf("Bea Santos"));
    expect(html.match(/<a /g)?.length).toBe(2);
    expect(html).toMatch(/<a[^>]*aria-current="true"[^>]*href="\?scan=d"|<a[^>]*href="\?scan=d"[^>]*aria-current="true"/);
    expect(html).toContain("TDW 12");
    expect(html).toContain("6d");
    expect(html).toContain("Final");
  });

  it("shows the first-day text when no scan waits", () => {
    const html = renderToStaticMarkup(
      createElement(InboxList, { label: "Scans to check", items: [], empty: "No scans are waiting. New scans appear here when a Student uploads one." }),
    );
    expect(html).toContain("No scans are waiting. New scans appear here when a Student uploads one.");
    expect(html).not.toContain("<a ");
  });

  it("shows a 2-step state bar with a text label for each step", () => {
    const html = renderToStaticMarkup(
      createElement(StateBar, { steps: [{ label: "Scan uploaded", state: "done" }, { label: "Verified", state: "todo" }] }),
    );
    expect(html).toMatch(/<ol/);
    expect(html.match(/<li/g)?.length).toBe(2);
    expect(html).toContain("Scan uploaded");
    expect(html).toMatch(/sr-only[^>]*>[^<]*(done|Done)/);
  });

  it("always shows the file details in the record", () => {
    const html = renderToStaticMarkup(
      createElement(InboxRecord, {
        form: "TDW_12",
        state: "scan_uploaded",
        name: "Final Defense Endorsement",
        student: "Dino Aquino",
        milestone: "Final",
        steps: [{ label: "Scan uploaded", state: "done" }, { label: "Verified", state: "todo" }],
        actions: "ACTIONS",
        details: { uploadedAt: new Date("2027-01-12T01:00:00Z"), by: "Dino Aquino", sha256: "ab".repeat(32) },
      }),
    );
    expect(html).toContain("ACTIONS");
    expect(html).toContain("SHA-256");
    expect(html).toContain("ab".repeat(32));
  });
});
