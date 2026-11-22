// Event emails (FR-NTF-02). An email holds the event, the next action, the deadline
// and a link only. It holds no manuscript text, comments, scores or verdicts (AGENTS.md §10).
// It calls the Resend REST API with fetch, so it needs no SDK (AD-B-002).

export type EventEmail = {
  /** What happened, for example "Gate 1b passed". */
  event: string;
  /** What the person must do next. */
  nextAction: string;
  /** The deadline as a PST date (`YYYY-MM-DD`), or null when there is none. */
  deadline: string | null;
  /** A link into the app. The details stay behind sign-in. */
  link: string;
};

export type EmailMessage = { subject: string; text: string };

/** Builds the email. It accepts only the four allowed fields, so no other content can enter. */
export function buildEventEmail(e: EventEmail): EmailMessage {
  const url = new URL(e.link);
  if (url.protocol !== "https:" && url.hostname !== "localhost") {
    throw new Error("Email links must use https");
  }
  const lines = [
    `Event: ${oneLine(e.event)}`,
    `Next action: ${oneLine(e.nextAction)}`,
    `Deadline: ${e.deadline ? `${e.deadline} (PST)` : "None"}`,
    `Open the system: ${url.toString()}`,
  ];
  return { subject: `Thesis progress: ${oneLine(e.event)}`, text: lines.join("\n") };
}

function oneLine(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

export type SendConfig = {
  apiKey: string;
  from: string;
  fetch?: typeof fetch;
};

/** Sends one email through Resend. Returns the Resend email ID. */
export async function sendEmail(to: string, msg: EmailMessage, cfg: SendConfig): Promise<string> {
  const doFetch = cfg.fetch ?? fetch;
  const res = await doFetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: cfg.from, to: [to], subject: msg.subject, text: msg.text }),
  });
  if (!res.ok) {
    // Log the status only. The body can echo the address.
    throw new Error(`Resend returned HTTP ${res.status}`);
  }
  const body = (await res.json()) as { id?: string };
  return body.id ?? "";
}
