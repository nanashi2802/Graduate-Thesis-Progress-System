// Philippine Standard Time (UTC+8) for all dates in the app (NFR-11).
// The daily job runs in UTC (AGENTS.md §10). This turns a UTC instant into a PST date.
export const PST_TIME_ZONE = "Asia/Manila";

/** Returns the PST calendar date of `now` as `YYYY-MM-DD`. */
export function pstDate(now: Date): string {
  // The `en-CA` locale formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
