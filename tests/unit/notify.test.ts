import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/cron/daily/route";
import { isCronAuthorized, runDailyJob } from "@/server/notify/daily";
import { buildEventEmail, sendEmail } from "@/server/notify/email";
import { pstDate } from "@/server/notify/time";

// P0-E05-T02: region and cron (FR-NTF-06, DFD T6).
describe("vercel.json", () => {
  const cfg = JSON.parse(readFileSync("vercel.json", "utf8"));
  it("runs functions in sin1, near the Neon database", () => {
    expect(cfg.regions).toEqual(["sin1"]);
  });
  it("runs the daily job once a day at 00:xx UTC (Hobby timing)", () => {
    expect(cfg.crons).toEqual([{ path: "/api/cron/daily", schedule: "0 0 * * *" }]);
  });
});

// NFR-11: PST dates from UTC instants.
describe("pstDate", () => {
  it("moves to the next PST day at 16:00 UTC", () => {
    expect(pstDate(new Date("2026-11-22T15:59:59Z"))).toBe("2026-11-22");
    expect(pstDate(new Date("2026-11-22T16:00:00Z"))).toBe("2026-11-23");
  });
  it("gives the same PST date for the whole cron window", () => {
    expect(pstDate(new Date("2026-11-22T00:00:00Z"))).toBe("2026-11-22");
    expect(pstDate(new Date("2026-11-22T00:59:00Z"))).toBe("2026-11-22");
  });
});

// P0-E05-T03: only Vercel Cron can start the job.
describe("isCronAuthorized", () => {
  it("accepts only the exact bearer secret", () => {
    expect(isCronAuthorized("Bearer s3cret", "s3cret")).toBe(true);
    expect(isCronAuthorized("Bearer wrong", "s3cret")).toBe(false);
    expect(isCronAuthorized("s3cret", "s3cret")).toBe(false);
    expect(isCronAuthorized(null, "s3cret")).toBe(false);
  });
  it("refuses every request when no secret is set", () => {
    expect(isCronAuthorized("Bearer ", undefined)).toBe(false);
    expect(isCronAuthorized("Bearer ", "")).toBe(false);
  });
});

// P0-E05-T04: FR-NTF-02, AGENTS.md §10. Event, next action, deadline and link only.
describe("buildEventEmail", () => {
  const email = buildEventEmail({
    event: "Gate 1b passed",
    nextAction: "Print three copies.",
    deadline: "2026-12-01",
    link: "https://thesisko-tau.vercel.app/student",
  });
  it("holds exactly the four allowed lines", () => {
    expect(email.text.split("\n")).toEqual([
      "Event: Gate 1b passed",
      "Next action: Print three copies.",
      "Deadline: 2026-12-01 (PST)",
      "Open the system: https://thesisko-tau.vercel.app/student",
    ]);
    expect(email.subject).toBe("Thesis progress: Gate 1b passed");
  });
  it("puts a line break from a field on one line", () => {
    const e = buildEventEmail({ event: "A\nB", nextAction: "x", deadline: null, link: "https://a.b/" });
    expect(e.text.split("\n")).toHaveLength(4);
    expect(e.text).toContain("Deadline: None");
  });
  it("refuses a plain http link outside localhost", () => {
    expect(() =>
      buildEventEmail({ event: "e", nextAction: "n", deadline: null, link: "http://evil.example/" }),
    ).toThrow();
  });
});

describe("sendEmail", () => {
  it("posts to Resend and returns the ID", async () => {
    const fetchMock = vi.fn(async () => Response.json({ id: "em_1" }));
    const id = await sendEmail("a@example.com", { subject: "s", text: "t" }, {
      apiKey: "k",
      from: "onboarding@resend.dev",
      fetch: fetchMock as unknown as typeof fetch,
    });
    expect(id).toBe("em_1");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(JSON.parse(init.body as string)).toEqual({
      from: "onboarding@resend.dev",
      to: ["a@example.com"],
      subject: "s",
      text: "t",
    });
  });
  it("throws on an error status", async () => {
    const fetchMock = vi.fn(async () => new Response("no", { status: 403 }));
    await expect(
      sendEmail("a@example.com", { subject: "s", text: "t" }, {
        apiKey: "k",
        from: "f",
        fetch: fetchMock as unknown as typeof fetch,
      }),
    ).rejects.toThrow("HTTP 403");
  });
});

describe("runDailyJob", () => {
  const now = new Date("2026-11-22T00:05:00Z");
  it("logs the run and sends no email without NOTIFY_TEST_TO", async () => {
    const log = vi.fn();
    const fetchMock = vi.fn();
    const r = await runDailyJob(now, { RESEND_API_KEY: "k" }, { log, fetch: fetchMock });
    expect(r).toEqual({ pstDate: "2026-11-22", testEmailId: null });
    expect(log).toHaveBeenCalledWith(expect.stringContaining("PST date 2026-11-22"));
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("sends one test email when NOTIFY_TEST_TO is set", async () => {
    const fetchMock = vi.fn(async () => Response.json({ id: "em_2" }));
    const r = await runDailyJob(
      now,
      { NOTIFY_TEST_TO: "me@example.com", RESEND_API_KEY: "k", EMAIL_FROM: "f", APP_URL: "https://x.vercel.app" },
      { log: () => {}, fetch: fetchMock as unknown as typeof fetch },
    );
    expect(r.testEmailId).toBe("em_2");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("GET /api/cron/daily", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("returns 401 without the cron secret", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    const res = await GET(new Request("http://localhost/api/cron/daily"));
    expect(res.status).toBe(401);
  });
  it("returns 200 with the cron secret", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    vi.stubEnv("NOTIFY_TEST_TO", "");
    vi.spyOn(console, "log").mockImplementation(() => {});
    const res = await GET(
      new Request("http://localhost/api/cron/daily", { headers: { authorization: "Bearer s3cret" } }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ testEmailId: null });
  });
});
