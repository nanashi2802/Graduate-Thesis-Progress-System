// Source: UX-D-04, DESIGN.md §6.1, Task R2.3. Pure options for one toast (testable without a browser).
// A toast confirms a small action only: preferences saved, availability published, slot requested, file uploaded.
// A workflow result (Returned, Endorsed, Scheduled, Verified …) stays on the screen, so toastOptions refuses it.
import type { GlyphName } from "@/components/patterns/glyphs";

export type ToastTone = "done" | "returned" | "neutral";
export type ToastInput = { label: string; tone: ToastTone; glyph?: GlyphName };
export type ToastData = { glyph: GlyphName };

export const TOAST_TIMEOUT_MS = 4000;

/** Words that start a workflow result. Such a result stays on the screen (UX-D-04). */
export const WORKFLOW_RESULTS = ["Returned", "Endorsed", "Scheduled", "Verified", "Accepted", "Approved", "Closed", "Certified"] as const;

const TONE_GLYPH: Record<ToastTone, GlyphName> = { done: "done", returned: "return", neutral: "commit" };

export function toastOptions({ label, tone, glyph }: ToastInput) {
  const first = label.trim().split(/[\s.,:]/)[0] ?? "";
  if ((WORKFLOW_RESULTS as readonly string[]).includes(first)) {
    throw new Error(`"${label}" is a workflow result. It stays on the screen, not in a toast (UX-D-04).`);
  }
  return {
    title: label,
    type: tone,
    timeout: TOAST_TIMEOUT_MS,
    priority: "low" as const,
    data: { glyph: glyph ?? TONE_GLYPH[tone] } satisfies ToastData,
  };
}
