import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionButton } from "@/components/action-button";
import { FlagBanner, LockedBanner } from "@/components/banners";
import { Docket, NOTHING_BLOCKS } from "@/components/docket";
import { EmptyState } from "@/components/empty-state";

describe("Docket (DESIGN.md §5.2)", () => {
  it("says that nothing blocks when there is no blocker", () => {
    const html = renderToStaticMarkup(createElement(Docket, { where: "Proposal" }));
    expect(html).toContain(NOTHING_BLOCKS);
    expect(NOTHING_BLOCKS).toBe("Nothing blocks this step.");
  });

  it("shows the blocker sentence", () => {
    const html = renderToStaticMarkup(
      createElement(Docket, { where: "Pre-Final", blocker: "IPMO check has not passed." }),
    );
    expect(html).toContain("IPMO check has not passed.");
    expect(html).not.toContain(NOTHING_BLOCKS);
  });

  it("keeps the action enabled under a flag (BR-17)", () => {
    const html = renderToStaticMarkup(
      createElement(Docket, {
        where: "Proposal",
        flag: createElement(FlagBanner, null, "The residency period is short."),
        actions: createElement(ActionButton, null, "Close stage"),
      }),
    );
    expect(html).toContain('role="note"');
    expect(html).toContain("The residency period is short.");
    expect(html).not.toContain('aria-disabled="true"');
    expect(html.indexOf("residency")).toBeLessThan(html.indexOf("Close stage"));
  });
});

describe("LockedBanner and EmptyState", () => {
  it("renders the locked text (BR-07)", () => {
    const html = renderToStaticMarkup(
      createElement(LockedBanner, null, "Locked at Gate 1b on Mon 4 Jan 2027. Unlocks when the defense closes."),
    );
    expect(html).toContain("Unlocks when the defense closes.");
  });

  it("says what is missing and the next step (DESIGN.md §7.11)", () => {
    const html = renderToStaticMarkup(
      createElement(EmptyState, {
        title: "No endorsements are waiting.",
        detail: "New items appear when a Student marks a commit Ready.",
      }),
    );
    expect(html).toContain("No endorsements are waiting.");
    expect(html).toContain("marks a commit Ready");
  });
});
