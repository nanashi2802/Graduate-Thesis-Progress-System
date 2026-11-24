import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

// P3-E07-T07, NFR-01
describe("security headers", () => {
  it("sends the three headers on every route", async () => {
    const rules = (await nextConfig.headers!());
    expect(rules).toHaveLength(1);
    expect(rules[0]!.source).toBe("/:path*");
    expect(Object.fromEntries(rules[0]!.headers.map((h) => [h.key, h.value]))).toEqual({
      "Content-Security-Policy": "frame-ancestors 'none'",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    });
  });
});
