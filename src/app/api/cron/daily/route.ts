// Vercel Cron target for the daily job (FR-NTF-06). Schedule: `vercel.json`.
import { runDailyNotifications } from "@/server/data/daily";
import { getDb } from "@/server/data/db";
import { defaultMailPort } from "@/server/data/recipients";
import { isCronAuthorized, runDailyJob } from "@/server/notify/daily";
import { appLink } from "@/server/notify/link";

export async function GET(request: Request): Promise<Response> {
  if (!isCronAuthorized(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { APP_URL, RESEND_API_KEY, EMAIL_FROM, NOTIFY_TEST_TO } = process.env;
  const now = new Date();
  const result = await runDailyJob(now, { APP_URL, RESEND_API_KEY, EMAIL_FROM, NOTIFY_TEST_TO });
  const notices = await runDailyNotifications(getDb(), now, defaultMailPort(), appLink("/login"));
  return Response.json({ ...result, ...notices });
}
