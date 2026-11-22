// The auth proxy blocks admin, sign-up and delete paths (FR-ACC-06, BR-19, D-23, AD-A-010).
import { describe, expect, it } from "vitest";
import { isBlockedAuthPath } from "@/server/auth/blocked-paths";

describe("isBlockedAuthPath", () => {
  it.each([["admin", "remove-user"], ["admin", "impersonate-user"], ["admin", "create-user"], ["sign-up", "email"], ["delete-user"]])(
    "blocks %s/%s",
    (...path) => expect(isBlockedAuthPath(path.filter(Boolean) as string[])).toBe(true),
  );
  it.each([["sign-in", "email"], ["sign-in", "social"], ["get-session"], ["sign-out"], ["callback", "google"]])(
    "allows %s/%s",
    (...path) => expect(isBlockedAuthPath(path.filter(Boolean) as string[])).toBe(false),
  );
});
