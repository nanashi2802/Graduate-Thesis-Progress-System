// The app's own login rate limit (FR-ACC-01, NFR-01, issue #57). Server only.
// Neon Auth gets every email sign-in from the server, so it sees one address for all users.
// This limit counts attempts for each email address and for each client address instead.
// It runs before any user is known, so it takes no actor: it reads and writes only its own table.
import "server-only";
import { createHash } from "node:crypto";
import { and, count, eq, gt, inArray, lt } from "drizzle-orm";
import type { Db } from "./db";
import { signInAttempt } from "./schema";

export const SIGN_IN_WINDOW_MS = 15 * 60 * 1000;
// One account: 5 attempts in 15 minutes. One client address: 20 (many users can share one).
export const MAX_ATTEMPTS_PER_EMAIL = 5;
export const MAX_ATTEMPTS_PER_IP = 20;

export type SignInKey = { email: string; ip: string | null };

// What the Neon Auth call gave: a user, or the HTTP status of its error.
export type AttemptResult<U> = { user: U } | { status: number };

export type SignInOutcome<U> =
  | { kind: "ok"; user: U }
  | { kind: "wrong" } // wrong email address or password
  | { kind: "limited" } // too many attempts: Neon Auth was not called
  | { kind: "unavailable" }; // Neon Auth failed (5xx or network): the attempt does not count

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const emailBucket = (email: string) => hash(`email:${email.trim().toLowerCase()}`);
const ipBucket = (ip: string) => hash(`ip:${ip}`);

async function attemptsSince(db: Db, bucket: string, now: Date): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(signInAttempt)
    .where(and(eq(signInAttempt.bucket, bucket), gt(signInAttempt.createdAt, new Date(now.getTime() - SIGN_IN_WINDOW_MS))));
  return row?.n ?? 0;
}

// Run one email sign-in under the limit.
// The attempt row is written BEFORE the count and the Neon Auth call. So requests sent at the
// same time each see the rows of the others, and at most 5 for one email address reach Neon Auth.
export async function withSignInLimit<U>(
  db: Db,
  key: SignInKey,
  attempt: () => Promise<AttemptResult<U>>,
  now = new Date(),
): Promise<SignInOutcome<U>> {
  const email = emailBucket(key.email);
  const ip = key.ip !== null ? ipBucket(key.ip) : null;
  const rows = await db
    .insert(signInAttempt)
    .values([email, ...(ip ? [ip] : [])].map((bucket) => ({ bucket, createdAt: now })))
    .returning({ id: signInAttempt.id, bucket: signInAttempt.bucket });
  const ids = rows.map((r) => r.id);
  const release = () => db.delete(signInAttempt).where(inArray(signInAttempt.id, ids));

  const limited =
    (await attemptsSince(db, email, now)) > MAX_ATTEMPTS_PER_EMAIL ||
    (ip !== null && (await attemptsSince(db, ip, now)) > MAX_ATTEMPTS_PER_IP);
  if (limited) {
    // A refused attempt does not count, so a user who waits is not locked out longer.
    await release();
    return { kind: "limited" };
  }

  let result: AttemptResult<U>;
  try {
    result = await attempt();
  } catch (e) {
    await release();
    throw e;
  }
  if ("user" in result) {
    // A correct password clears the count of this email address, and this attempt's client address row.
    const ipRow = rows.find((r) => r.bucket === ip);
    await db.delete(signInAttempt).where(eq(signInAttempt.bucket, email));
    if (ipRow) await db.delete(signInAttempt).where(eq(signInAttempt.id, ipRow.id));
    return { kind: "ok", user: result.user };
  }
  if (result.status >= 500) {
    // A Neon Auth outage must not lock users out.
    await release();
    return { kind: "unavailable" };
  }
  // Keep the table small: rows older than the window count for nothing.
  await db.delete(signInAttempt).where(lt(signInAttempt.createdAt, new Date(now.getTime() - SIGN_IN_WINDOW_MS)));
  return { kind: "wrong" };
}

// The client address. Vercel sets `x-real-ip` and overwrites `x-forwarded-for`, so a client cannot fake it there.
export function clientIp(headers: { get(name: string): string | null }): string | null {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const first = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return first || null;
}
