// A page under a portal gets a non-ok state for another role, so it makes no data call (issue #58, FR-ACC-02, NFR-01).
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("next/navigation", () => ({ redirect: () => {} }));
vi.mock("@/server/auth/neon-auth", () => ({
  getAuth: () => ({ getSession: async () => ({ data: { user: { id: "a", email: "s@example.test" } } }) }),
}));
vi.mock("@/server/data/db", () => ({ getDb: () => ({}) }));
vi.mock("@/server/data/actors", () => ({ resolveActor: async () => ({ userId: "u1", role: "student", isActive: true }) }));
const { getRoleState } = await import("@/server/auth/session");

describe("getRoleState", () => {
  it("returns the actor for the matching role", async () => {
    expect((await getRoleState("student")).status).toBe("ok");
  });

  it.each(["adviser", "panel_member", "coordinator"] as const)("returns a non-ok state for a Student on the %s route", async (role) => {
    expect((await getRoleState(role)).status).not.toBe("ok");
  });
});
