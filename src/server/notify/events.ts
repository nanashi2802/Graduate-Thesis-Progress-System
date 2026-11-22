// The event catalog (FR §4.10, FR-NTF-01 to 05, INV-29). Pure data and pure checks.
// Each event has a fixed text, so no user writes free text into an email (FR-NTF-02).
// The data layer writes the `notification` row first, then the email (INV-30, P1-E12).

import { buildEventEmail, type EmailMessage } from "./email";

export type EventCode =
  | "A1" | "A2" | "A3" | "A4" | "A5" | "A6"
  | "B1" | "B2" | "B3" | "B4" | "B5" | "B6" | "B7"
  | "C1" | "C2" | "C3" | "C4" | "C5" | "C6"
  | "E1" | "E2" | "E3"
  | "F1" | "F2";

/** Who gets the event. The data layer turns each token into users of the thesis. */
export type Recipient =
  | "student"
  | "adviser"
  | "members"
  | "affected_members"
  | "substitute"
  | "coordinator"
  | "reviewer"
  | "thread_author"
  | "user";

/** `immediate`: one email for each event. `reminder`: made by the daily job. `digest`: grouped (FR-NTF-04). */
export type Delivery = "immediate" | "reminder" | "digest";

export type EventDef = {
  code: EventCode;
  /** The in-app text and the email "Event" line. */
  event: string;
  /** The email "Next action" line. */
  nextAction: string;
  recipients: readonly Recipient[];
  delivery: Delivery;
};

// Texts follow AGENTS.md §5 and DESIGN.md §8. None holds a verdict, score, comment or meeting link (FR-NTF-03).
export const EVENTS: Record<EventCode, EventDef> = {
  A1: { code: "A1", event: "A Student proposed a defense date", nextAction: "Confirm the date and the room or link.", recipients: ["coordinator"], delivery: "immediate" },
  A2: { code: "A2", event: "The defense date is confirmed", nextAction: "Open the schedule to see the date and the place.", recipients: ["student", "adviser", "members"], delivery: "immediate" },
  A3: { code: "A3", event: "The defense date was returned or changed", nextAction: "Open the schedule to see the reason and the new date.", recipients: ["student", "affected_members"], delivery: "immediate" },
  A4: { code: "A4", event: "The defense is near", nextAction: "Prepare for the defense.", recipients: ["student", "adviser", "members"], delivery: "reminder" },
  A5: { code: "A5", event: "A substitute Panel Member is recorded", nextAction: "Open the defense page.", recipients: ["substitute", "student"], delivery: "immediate" },
  A6: { code: "A6", event: "Your defense results are available", nextAction: "Sign in to see the results.", recipients: ["student"], delivery: "immediate" },
  B1: { code: "B1", event: "Printed copies are due in 7 days", nextAction: "Give the printed copies to the office.", recipients: ["student"], delivery: "reminder" },
  B2: { code: "B2", event: "The milestone target date is near or over", nextAction: "Open the dashboard to see the next step.", recipients: ["student", "adviser"], delivery: "reminder" },
  B3: { code: "B3", event: "A document was returned", nextAction: "Read the reason and upload a corrected scan.", recipients: ["student"], delivery: "immediate" },
  B4: { code: "B4", event: "Revision items wait for acceptance", nextAction: "Open the revision items.", recipients: ["student", "members"], delivery: "digest" },
  B5: { code: "B5", event: "A clearance item changed", nextAction: "Open the clearance checklist.", recipients: ["student"], delivery: "immediate" },
  B6: { code: "B6", event: "The residency warning date is near", nextAction: "Open the dashboard to see the date.", recipients: ["student", "coordinator"], delivery: "reminder" },
  B7: { code: "B7", event: "A commit waits for your review", nextAction: "Open the manuscript workspace.", recipients: ["reviewer"], delivery: "digest" },
  C1: { code: "C1", event: "A commit is marked Ready", nextAction: "Review the commit.", recipients: ["adviser", "members"], delivery: "immediate" },
  C2: { code: "C2", event: "New critique threads", nextAction: "Open the manuscript workspace.", recipients: ["student"], delivery: "digest" },
  C3: { code: "C3", event: "New replies in your threads", nextAction: "Open the manuscript workspace.", recipients: ["thread_author"], delivery: "digest" },
  C4: { code: "C4", event: "Threads were resolved", nextAction: "Open the manuscript workspace.", recipients: ["student"], delivery: "digest" },
  C5: { code: "C5", event: "New document comments", nextAction: "Open the documents page.", recipients: ["student", "adviser"], delivery: "digest" },
  C6: { code: "C6", event: "A gate is done", nextAction: "Open the dashboard to see the next step.", recipients: ["student", "coordinator"], delivery: "immediate" },
  E1: { code: "E1", event: "Your account is ready, or your password was reset", nextAction: "Sign in.", recipients: ["user"], delivery: "immediate" },
  E2: { code: "E2", event: "Manuscript access is open", nextAction: "Open the manuscript workspace.", recipients: ["members"], delivery: "immediate" },
  E3: { code: "E3", event: "The committee changed", nextAction: "Open the committee page.", recipients: ["coordinator", "student"], delivery: "immediate" },
  F1: { code: "F1", event: "A consultation is requested", nextAction: "Confirm or decline the request.", recipients: ["adviser"], delivery: "immediate" },
  F2: { code: "F2", event: "Your consultation request has an answer", nextAction: "Open the consultation page.", recipients: ["student"], delivery: "immediate" },
};

/** The events a user can turn off (FR-NTF-05). INV-29: preference rows exist for these only. */
export const OPTIONAL_EVENTS: readonly EventCode[] = ["A4", "B1", "B2", "B4", "B6", "B7", "C2", "C3", "C4", "C5"];

export function isOptional(code: EventCode): boolean {
  return OPTIONAL_EVENTS.includes(code);
}

/**
 * Send the email? A required event always sends (FR-NTF-05). The in-app notification
 * is written in every case (FR-NTF-01, NFR-05).
 */
export function shouldEmail(code: EventCode, turnedOff: ReadonlySet<EventCode>): boolean {
  return !isOptional(code) || !turnedOff.has(code);
}

/** The email for one event. Only the deadline and the link vary (FR-NTF-02, FR-NTF-03). */
export function buildNotificationEmail(code: EventCode, deadline: string | null, link: string): EmailMessage {
  const def = EVENTS[code];
  return buildEventEmail({ event: def.event, nextAction: def.nextAction, deadline, link });
}
