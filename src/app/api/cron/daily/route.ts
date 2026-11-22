// Vercel Cron target for the daily job (FR-NTF-06). Schedule: `vercel.json`.
import { isCronAuthorized, runDailyJob } from "@/server/notify/daily";

export async function GET(request: Request): Promise<Response> {
  if (!isCronAuthorized(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { APP_URL, RESEND_API_KEY, EMAIL_FROM, NOTIFY_TEST_TO } = process.env;
  const result = await runDailyJob(new Date(), { APP_URL, RESEND_API_KEY, EMAIL_FROM, NOTIFY_TEST_TO });
  return Response.json(result);
}
