// The daily job (FR-NTF-06, DFD T6). Vercel Cron calls it once a day in UTC.
// Phase 0 (P0-E05) proves only that it runs, logs and can send one email.
// Phase 2 (P2-E04) adds digests and reminders here.
import { timingSafeEqual } from "node:crypto";
import { buildEventEmail, sendEmail } from "./email";
import { pstDate } from "./time";

/** True only when the header is exactly `Bearer <secret>`. No secret means no access. */
export function isCronAuthorized(header: string | null, secret: string | undefined): boolean {
  if (!secret || !header) return false;
  const want = Buffer.from(`Bearer ${secret}`);
  const got = Buffer.from(header);
  return want.length === got.length && timingSafeEqual(want, got);
}

export type DailyEnv = {
  APP_URL?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  NOTIFY_TEST_TO?: string;
};

export type DailyResult = { pstDate: string; testEmailId: string | null };

export async function runDailyJob(
  now: Date,
  env: DailyEnv,
  deps: { fetch?: typeof fetch; log?: (line: string) => void } = {},
): Promise<DailyResult> {
  const log = deps.log ?? console.log;
  const date = pstDate(now);
  log(`[daily-job] run at ${now.toISOString()} UTC, PST date ${date}`);

  let testEmailId: string | null = null;
  if (env.NOTIFY_TEST_TO && env.RESEND_API_KEY && env.EMAIL_FROM && env.APP_URL) {
    const msg = buildEventEmail({
      event: "Daily job test",
      nextAction: "No action. This email tests the daily job.",
      deadline: null,
      link: env.APP_URL,
    });
    testEmailId = await sendEmail(env.NOTIFY_TEST_TO, msg, {
      apiKey: env.RESEND_API_KEY,
      from: env.EMAIL_FROM,
      fetch: deps.fetch,
    });
    log(`[daily-job] test email sent, id ${testEmailId}`);
  }
  return { pstDate: date, testEmailId };
}
