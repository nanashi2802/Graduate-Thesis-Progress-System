// The app's own login rate limit (FR-ACC-01, NFR-01, issue #57).
import { beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/server/data/db";
import { signInFailure } from "@/server/data/schema";
import {
  clearSignInFailures,
  clientIp,
  isSignInLimited,
  MAX_FAILURES_PER_EMAIL,
  MAX_FAILURES_PER_IP,
  recordSignInFailure,
  SIGN_IN_WINDOW_MS,
} from "@/server/data/sign-in-limit";
import { makeTestDb } from "../../support/test-db";

let db: Db;
const now = new Date("2026-11-25T02:00:00Z");
const later = (ms: number) => new Date(now.getTime() + ms);

beforeEach(async () => {
  ({ db } = await makeTestDb());
});

async function fail(times: number, email: string, ip: string | null, at = now) {
  for (let i = 0; i < times; i++) await recordSignInFailure(db, { email, ip }, at);
}

describe("isSignInLimited", () => {
  it("limits one email address after 5 failures, and not before", async () => {
    await fail(MAX_FAILURES_PER_EMAIL - 1, "student@example.test", null);
    expect(await isSignInLimited(db, { email: "student@example.test", ip: null }, now)).toBe(false);
    await fail(1, "student@example.test", null);
    expect(await isSignInLimited(db, { email: "student@example.test", ip: null }, now)).toBe(true);
  });

  it("matches the email address in any case", async () => {
    await fail(MAX_FAILURES_PER_EMAIL, "Student@Example.test", null);
    expect(await isSignInLimited(db, { email: "student@example.test", ip: null }, now)).toBe(true);
  });

  it("does not block a second account from a different address", async () => {
    await fail(MAX_FAILURES_PER_EMAIL, "student@example.test", "203.0.113.1");
    expect(await isSignInLimited(db, { email: "adviser@example.test", ip: "203.0.113.2" }, now)).toBe(false);
  });

  it("limits one client address after 20 failures over many accounts", async () => {
    for (let i = 0; i < MAX_FAILURES_PER_IP; i++) await fail(1, `user${i}@example.test`, "203.0.113.9");
    expect(await isSignInLimited(db, { email: "new@example.test", ip: "203.0.113.9" }, now)).toBe(true);
    expect(await isSignInLimited(db, { email: "new@example.test", ip: "203.0.113.10" }, now)).toBe(false);
  });

  it("ends the limit after the 15-minute window", async () => {
    await fail(MAX_FAILURES_PER_EMAIL, "student@example.test", null);
    expect(await isSignInLimited(db, { email: "student@example.test", ip: null }, later(SIGN_IN_WINDOW_MS - 1000))).toBe(true);
    expect(await isSignInLimited(db, { email: "student@example.test", ip: null }, later(SIGN_IN_WINDOW_MS + 1000))).toBe(false);
  });
});

describe("recordSignInFailure", () => {
  it("stores hashes only, never the email address or the client address", async () => {
    await fail(1, "student@example.test", "203.0.113.1");
    const rows = await db.select().from(signInFailure);
    expect(rows).toHaveLength(2);
    for (const r of rows) {
      expect(r.bucket).toMatch(/^[0-9a-f]{64}$/);
      expect(r.bucket).not.toContain("student");
    }
  });

  it("deletes rows older than the window", async () => {
    await fail(3, "old@example.test", null, now);
    await fail(1, "new@example.test", null, later(SIGN_IN_WINDOW_MS + 1000));
    expect(await db.select().from(signInFailure)).toHaveLength(1);
  });
});

describe("clearSignInFailures", () => {
  it("clears the email count after a correct password, and keeps the client address count", async () => {
    for (let i = 0; i < MAX_FAILURES_PER_IP - 1; i++) await fail(1, `user${i}@example.test`, "203.0.113.9");
    await fail(MAX_FAILURES_PER_EMAIL - 1, "student@example.test", "203.0.113.9");
    await clearSignInFailures(db, { email: "student@example.test", ip: "203.0.113.9" });
    await fail(1, "student@example.test", null);
    expect(await isSignInLimited(db, { email: "student@example.test", ip: null }, now)).toBe(false);
    expect(await isSignInLimited(db, { email: "x@example.test", ip: "203.0.113.9" }, now)).toBe(true);
  });
});

describe("clientIp", () => {
  const h = (entries: Record<string, string>) => new Headers(entries);
  it("uses x-real-ip first", () => {
    expect(clientIp(h({ "x-real-ip": "203.0.113.1", "x-forwarded-for": "198.51.100.1" }))).toBe("203.0.113.1");
  });
  it("uses the first x-forwarded-for address", () => {
    expect(clientIp(h({ "x-forwarded-for": "198.51.100.1, 10.0.0.1" }))).toBe("198.51.100.1");
  });
  it("returns null with no header", () => {
    expect(clientIp(h({}))).toBeNull();
  });
});
