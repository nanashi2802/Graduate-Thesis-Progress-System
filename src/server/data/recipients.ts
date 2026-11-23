// Who gets an event: the recipient tokens of the event catalog turned into user IDs (FR-NTF-01, ERD §8).
// `emitEvent` is the one call a data function makes AFTER its own transaction commits (INV-30, NFR-05).
// It checks that the actor can read the thesis, and it never tells the actor about their own action.
import "server-only";
import { and, eq } from "drizzle-orm";
import type { MilestoneCode } from "@/server/domain/milestone";
import { sendEmail } from "@/server/notify/email";
import { EVENTS, type EventCode, type Recipient } from "@/server/notify/events";
import { requireActive, type DataContext } from "./access";
import { notifyEvent, type EmailPort, type NotifyResult } from "./notifications";
import { appUser, committee, committeeMember, thesisInstance } from "./schema";
import { requireThesisRead } from "./scope";

export type RecipientScope = {
  thesisId: string;
  /** The milestone of the event. It picks the Evaluation Committee (Milestones 1 and 2) or the Final Panel (Milestone 3). */
  milestone?: MilestoneCode;
  /** The people the event names itself: the affected members, the substitute, the reviewer, the thread author, or the user. */
  userIds?: readonly string[];
};

const NAMED: readonly Recipient[] = ["affected_members", "substitute", "reviewer", "thread_author", "user"];

/** The distinct users for the recipient tokens of one event. A named token with no `userIds` is a bug of the caller. */
export async function resolveRecipients(db: DataContext["db"], code: EventCode, scope: RecipientScope): Promise<string[]> {
  const [thesis] = await db.select().from(thesisInstance).where(eq(thesisInstance.id, scope.thesisId));
  if (!thesis) throw new Error("The thesis does not exist.");
  const out = new Set<string>();
  for (const token of EVENTS[code].recipients) {
    if (token === "student") out.add(thesis.studentUserId);
    else if (token === "adviser") out.add(thesis.adviserUserId);
    else if (token === "coordinator") {
      for (const c of await db.select({ id: appUser.id }).from(appUser).where(and(eq(appUser.role, "coordinator"), eq(appUser.isActive, true)))) out.add(c.id);
    } else if (token === "members") {
      const kind = scope.milestone === undefined ? null : scope.milestone === "final" ? "final_panel" : "evaluation_committee";
      const seats = await db
        .select({ id: committeeMember.memberUserId, kind: committee.kind })
        .from(committeeMember)
        .innerJoin(committee, eq(committee.id, committeeMember.committeeId))
        .where(and(eq(committee.thesisInstanceId, thesis.id), eq(committeeMember.status, "accepted")));
      for (const s of seats) if (kind === null || s.kind === kind) out.add(s.id);
    } else if (NAMED.includes(token)) {
      if (!scope.userIds || scope.userIds.length === 0) throw new Error(`Event ${code} needs userIds for ${token}.`);
      for (const id of scope.userIds) out.add(id);
    }
  }
  return [...out];
}

export type EmitInput = { link: string; deadline?: string | null; targetTable?: string | null; targetId?: string | null };

/**
 * Notify the recipients of `code`. Call it only after the event has committed. It writes the in-app rows first,
 * then tries the emails. An email failure never throws (INV-30). The actor gets no notice of their own action.
 */
export async function emitEvent(
  ctx: DataContext,
  code: EventCode,
  scope: RecipientScope,
  input: EmitInput,
  sendMail: EmailPort | null,
): Promise<NotifyResult> {
  requireActive(ctx.actor);
  await requireThesisRead(ctx, scope.thesisId);
  const recipients = (await resolveRecipients(ctx.db, code, scope)).filter((id) => id !== ctx.actor.userId);
  return notifyEvent(ctx, { code, recipientUserIds: recipients, targetTable: input.targetTable, targetId: input.targetId, link: input.link, deadline: input.deadline }, sendMail);
}

// The real email port: Resend, when the keys are set. Without keys (tests, local) there is no email, only the in-app row.
export function defaultMailPort(): EmailPort | null {
  const { RESEND_API_KEY, EMAIL_FROM } = process.env;
  if (!RESEND_API_KEY || !EMAIL_FROM) return null;
  return (to, msg) => sendEmail(to, msg, { apiKey: RESEND_API_KEY, from: EMAIL_FROM });
}

/**
 * The call a data function makes after its transaction commits (INV-30, NFR-05). It never throws: a failed
 * email, a failed notice or a bug in the resolver is logged, and the event stays done. It takes no extra
 * parameter in the public function that calls it. Pass `sendMail` only in tests.
 */
export async function emitSafely(
  ctx: DataContext,
  code: EventCode,
  scope: RecipientScope,
  input: EmitInput,
  sendMail: EmailPort | null = defaultMailPort(),
): Promise<void> {
  try {
    await emitEvent(ctx, code, scope, input, sendMail);
  } catch (e) {
    // Log the event code only. The message can hold an address or a provider body.
    console.error(`Notice for event ${code} failed:`, e instanceof Error ? e.name : "error");
  }
}
