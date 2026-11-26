// Task R2.3 (UX-D-04, DESIGN.md §6.1): a toast confirms a small action only. 4 s, polite, glyph and label, tokens only.
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TOAST_TIMEOUT_MS, WORKFLOW_RESULTS, toastOptions } from "@/components/patterns/toast/options";

describe("toast options (R2.3)", () => {
  it("closes after 4 s and is announced politely", () => {
    expect(TOAST_TIMEOUT_MS).toBe(4000);
    expect(toastOptions({ label: "Preferences saved.", tone: "done" })).toMatchObject({
      title: "Preferences saved.",
      timeout: 4000,
      priority: "low",
      type: "done",
      data: { glyph: "done" },
    });
  });

  it("uses the tone glyph unless the caller names one", () => {
    expect(toastOptions({ label: "The file did not upload.", tone: "returned" }).data?.glyph).toBe("return");
    expect(toastOptions({ label: "Saved.", tone: "neutral" }).data?.glyph).toBe("commit");
    expect(toastOptions({ label: "Uploaded.", tone: "done", glyph: "received" }).data?.glyph).toBe("received");
  });

  it("refuses a workflow result: it stays on the screen (UX-D-04)", () => {
    for (const label of WORKFLOW_RESULTS) {
      expect(() => toastOptions({ label: `${label}.`, tone: "done" })).toThrow(/stays on the screen/);
    }
  });
});

describe("toast pattern source (R2.3)", () => {
  const src = readFileSync("src/components/patterns/toast/index.tsx", "utf8");

  it("uses Base UI toast, tokens only, and a reduced-motion path", () => {
    expect(src).toContain('from "@base-ui/react/toast"');
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(src).not.toMatch(/\b(?:bg|text|border)-(?:maroon|gold|neutral)-\d/);
    expect(src).toMatch(/motion-reduce:/);
  });

  it("pauses on hover and focus (Base UI default) and keeps a close button with a name", () => {
    expect(src).toMatch(/Toast\.Close[^>]*aria-label="Close"/);
  });
});

describe("useToast outside a provider (R2.8)", () => {
  it("gives a no-op, so a form outside the provider still renders", async () => {
    const { useToast } = await import("@/components/patterns/toast");
    let show: unknown;
    const Probe = () => {
      show = useToast().show;
      return null;
    };
    expect(() => renderToStaticMarkup(createElement(Probe))).not.toThrow();
    expect(() => (show as (t: { label: string; tone: "done" }) => void)({ label: "Saved.", tone: "done" })).not.toThrow();
  });
});
