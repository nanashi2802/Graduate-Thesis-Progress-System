import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/neon-auth", () => ({ getAuth: vi.fn() }));

describe("proxy matcher (FR-ACC-01, issue #53)", () => {
  it("covers /auth/after-sign-in only", async () => {
    const { config } = await import("@/proxy");
    expect(config.matcher).toEqual(["/auth/after-sign-in"]);
  });
});
