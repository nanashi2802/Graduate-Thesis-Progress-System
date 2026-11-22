import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

// Proves that Vitest runs and resolves the `@/` alias (P0-E01-T03).
describe("cn", () => {
  it("joins class names and lets the last Tailwind class win", () => {
    expect(cn("px-2", false, "px-4", "text-sm")).toBe("px-4 text-sm");
  });
});
