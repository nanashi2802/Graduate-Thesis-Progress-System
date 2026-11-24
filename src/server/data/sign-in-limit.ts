// The app's own login rate limit (FR-ACC-01, NFR-01, issue #57). Server only.
// Neon Auth gets every email sign-in from the server, so it sees one address for all users.
// This limit counts failures for each email address and for each client address instead.
// It runs before any user is known, so it takes no actor: it reads and writes only its own table.
import "server-only";
import { createHash } from "node:crypto";
import { and, count, eq, gt, lt } from "drizzle-orm";
import type { Db } from "./db";
import { signInFailure } from "./schema";

export const SIGN_IN_WINDOW_MS = 15 * 60 * 1000;
// One account: 5 wrong passwords in 15 minutes. One client address: 20 (many users can share one).
export const MAX_FAILURES_PER_EMAIL = 5;
export const MAX_FAILURES_PER_IP = 20;

export type SignInKey = { email: string; ip: string | null };

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const emailBucket = (email: string) => hash(`email:${email.trim().toLowerCase()}`);
const ipBucket = (ip: string) => hash(`ip:${ip}`);

async function failuresSince(db: Db, bucket: string, now: Date): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(signInFailure)
    .where(and(eq(signInFailure.bucket, bucket), gt(signInFailure.createdAt, new Date(now.getTime() - SIGN_IN_WINDOW_MS))));
  return row?.n ?? 0;
}

// True when this email address or this client address has too many recent failures.
export async function isSignInLimited(db: Db, key: SignInKey, now = new Date()): Promise<boolean> {
  if ((await failuresSince(db, emailBucket(key.email), now)) >= MAX_FAILURES_PER_EMAIL) return true;
  return key.ip !== null && (await failuresSince(db, ipBucket(key.ip), now)) >= MAX_FAILURES_PER_IP;
}

export async function recordSignInFailure(db: Db, key: SignInKey, now = new Date()): Promise<void> {
  const buckets = [emailBucket(key.email), ...(key.ip !== null ? [ipBucket(key.ip)] : [])];
  await db.insert(signInFailure).values(buckets.map((bucket) => ({ bucket, createdAt: now })));
  // Keep the table small: rows older than the window count for nothing.
  await db.delete(signInFailure).where(lt(signInFailure.createdAt, new Date(now.getTime() - SIGN_IN_WINDOW_MS)));
}

// A correct password clears the failures of that email address. The client address keeps its count.
export async function clearSignInFailures(db: Db, key: SignInKey): Promise<void> {
  await db.delete(signInFailure).where(eq(signInFailure.bucket, emailBucket(key.email)));
}

// The client address. Vercel sets `x-real-ip` and overwrites `x-forwarded-for`, so a client cannot fake it there.
export function clientIp(headers: { get(name: string): string | null }): string | null {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const first = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return first || null;
}
