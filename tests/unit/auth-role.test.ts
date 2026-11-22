// P0-E03: each portal is open to its role only (FR-ACC-02, FR-ACC-06, BR-03).
import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/neon-auth", () => ({ getAuth: () => ({}) }));
vi.mock("@/server/data/db", () => ({ getDb: () => ({}) }));
const { roleDecision } = await import("@/server/auth/session");

const actor = { userId: "u1", role: "student" as const, isActive: true };

describe("roleDecision", () => {
  it("opens the route to its role", () => {
    expect(roleDecision({ status: "ok", actor }, "student")).toEqual({ ok: true, actor });
  });

  it.each(["adviser", "panel_member", "coordinator"] as const)("denies a Student the %s route, with a reason", (role) => {
    const check = roleDecision({ status: "ok", actor }, role);
    expect(check.ok).toBe(false);
    expect(check.ok ? "" : check.reason).not.toBe("");
  });

  it("denies a sign-in with no account", () => {
    expect(roleDecision({ status: "no_account" }, "student").ok).toBe(false);
  });

  it("denies a deactivated account", () => {
    expect(roleDecision({ status: "ok", actor: { ...actor, isActive: false } }, "student").ok).toBe(false);
  });
});
