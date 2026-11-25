// The app's own login rate limit (FR-ACC-01, NFR-01, issue #57).
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Db } from "@/server/data/db";
import { signInAttempt } from "@/server/data/schema";
import {
  type AttemptResult,
  clientIp,
  MAX_ATTEMPTS_PER_EMAIL,
  MAX_ATTEMPTS_PER_IP,
  SIGN_IN_WINDOW_MS,
  type SignInKey,
  withSignInLimit,
} from "@/server/data/sign-in-limit";
import { makeTestDb } from "../../support/test-db";

let db: Db;
const now = new Date("2026-11-25T02:00:00Z");
const later = (ms: number) => new Date(now.getTime() + ms);
type User = { id: string };

const wrong = async (): Promise<AttemptResult<User>> => ({ status: 401 });
const correct = async (): Promise<AttemptResult<User>> => ({ user: { id: "u1" } });
const down = async (): Promise<AttemptResult<User>> => ({ status: 502 });

beforeEach(async () => {
  ({ db } = await makeTestDb());
});

const run = (key: SignInKey, attempt = wrong, at = now) => withSignInLimit(db, key, attempt, at);

async function fail(times: number, email: string, ip: string | null, at = now) {
  for (let i = 0; i < times; i++) expect((await run({ email, ip }, wrong, at)).kind).toBe("wrong");
}

describe("withSignInLimit", () => {
  it("refuses the 6th attempt for one email address, and does not call Neon Auth", async () => {
    await fail(MAX_ATTEMPTS_PER_EMAIL, "student@example.test", null);
    const call = vi.fn(correct);
    expect((await run({ email: "student@example.test", ip: null }, call)).kind).toBe("limited");
    expect(call).not.toHaveBeenCalled();
  });

  it("lets at most 5 parallel attempts for one email address reach Neon Auth", async () => {
    const call = vi.fn(wrong);
    const outcomes = await Promise.all(
      Array.from({ length: 10 }, (_, i) => run({ email: "student@example.test", ip: `203.0.113.${i}` }, call)),
    );
    expect(call.mock.calls.length).toBeLessThanOrEqual(MAX_ATTEMPTS_PER_EMAIL);
    expect(outcomes.filter((o) => o.kind === "limited").length).toBeGreaterThanOrEqual(10 - MAX_ATTEMPTS_PER_EMAIL);
  });

  it("matches the email address in any case", async () => {
    await fail(MAX_ATTEMPTS_PER_EMAIL, "Student@Example.test", null);
    expect((await run({ email: "student@example.test", ip: null })).kind).toBe("limited");
  });

  it("does not block a second account from a different address", async () => {
    await fail(MAX_ATTEMPTS_PER_EMAIL, "student@example.test", "203.0.113.1");
    expect((await run({ email: "adviser@example.test", ip: "203.0.113.2" }, correct)).kind).toBe("ok");
  });

  it("refuses one client address after 20 failures over many accounts", async () => {
    for (let i = 0; i < MAX_ATTEMPTS_PER_IP; i++) await fail(1, `user${i}@example.test`, "203.0.113.9");
    expect((await run({ email: "new@example.test", ip: "203.0.113.9" }, correct)).kind).toBe("limited");
    expect((await run({ email: "new@example.test", ip: "203.0.113.10" }, correct)).kind).toBe("ok");
  });

  it("does not count successful sign-ins against a shared client address", async () => {
    for (let i = 0; i < MAX_ATTEMPTS_PER_IP + 5; i++) {
      expect((await run({ email: `user${i}@example.test`, ip: "203.0.113.9" }, correct)).kind).toBe("ok");
    }
  });

  it("ends the limit after the 15-minute window", async () => {
    await fail(MAX_ATTEMPTS_PER_EMAIL, "student@example.test", null);
    expect((await run({ email: "student@example.test", ip: null }, correct, later(SIGN_IN_WINDOW_MS - 1000))).kind).toBe("limited");
    expect((await run({ email: "student@example.test", ip: null }, correct, later(SIGN_IN_WINDOW_MS + 1000))).kind).toBe("ok");
  });

  it("does not extend the lockout with refused attempts", async () => {
    await fail(MAX_ATTEMPTS_PER_EMAIL, "student@example.test", null);
    // 5 refused attempts 10 minutes later. If they counted, they would still block at 15 minutes + 1 s.
    for (let i = 0; i < MAX_ATTEMPTS_PER_EMAIL; i++) {
      expect((await run({ email: "student@example.test", ip: null }, correct, later(10 * 60_000))).kind).toBe("limited");
    }
    expect(await db.select().from(signInAttempt)).toHaveLength(MAX_ATTEMPTS_PER_EMAIL);
    expect((await run({ email: "student@example.test", ip: null }, correct, later(SIGN_IN_WINDOW_MS + 1000))).kind).toBe("ok");
  });

  it("clears the email count after a correct password", async () => {
    await fail(MAX_ATTEMPTS_PER_EMAIL - 1, "student@example.test", null);
    expect((await run({ email: "student@example.test", ip: null }, correct)).kind).toBe("ok");
    await fail(MAX_ATTEMPTS_PER_EMAIL, "student@example.test", null);
  });

  it("does not count a Neon Auth outage (5xx or network error)", async () => {
    for (let i = 0; i < MAX_ATTEMPTS_PER_EMAIL + 2; i++) {
      expect((await run({ email: "student@example.test", ip: "203.0.113.1" }, down)).kind).toBe("unavailable");
    }
    await expect(run({ email: "student@example.test", ip: "203.0.113.1" }, () => Promise.reject(new Error("boom")))).rejects.toThrow();
    expect(await db.select().from(signInAttempt)).toHaveLength(0);
    expect((await run({ email: "student@example.test", ip: "203.0.113.1" }, correct)).kind).toBe("ok");
  });

  it("shows a Neon Auth 429 as too many attempts, and does not count it", async () => {
    const busy = async (): Promise<AttemptResult<User>> => ({ status: 429 });
    expect((await run({ email: "student@example.test", ip: "203.0.113.1" }, busy)).kind).toBe("limited");
    expect(await db.select().from(signInAttempt)).toHaveLength(0);
  });

  it("stores hashes only, never the email address or the client address", async () => {
    await fail(1, "student@example.test", "203.0.113.1");
    const rows = await db.select().from(signInAttempt);
    expect(rows).toHaveLength(2);
    for (const r of rows) {
      expect(r.bucket).toMatch(/^[0-9a-f]{64}$/);
      expect(r.bucket).not.toContain("student");
      expect(r.bucket).not.toContain("203.0.113");
    }
  });

  it("deletes rows older than the window", async () => {
    await fail(3, "old@example.test", null, now);
    await fail(1, "new@example.test", null, later(SIGN_IN_WINDOW_MS + 1000));
    expect(await db.select().from(signInAttempt)).toHaveLength(1);
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
