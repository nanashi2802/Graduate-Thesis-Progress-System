// P1-E12-T03: each action kind writes an audit record with actor, role, time and target (FR-RPT-01, INV-08, NFR-03, AD-B-031).
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, it } from "vitest";
import type { Actor, DataContext } from "@/server/data/access";
import { approveDataGathering } from "@/server/data/certification";
import {
  confirmLogEntry, decideBooking, draftLogEntry, publishSlots, requestBooking, setLogTopic, updateAgenda, withdrawSlot,
} from "@/server/data/consultations";
import type { Db } from "@/server/data/db";
import { transitionMilestone } from "@/server/data/milestones";
import { acceptRevision, addRevisionItems, linkRevisionToCommit } from "@/server/data/revisions";
import * as s from "@/server/data/schema";
import { setTargetDate } from "@/server/data/templates";
import { expectAudit } from "../../support/audit";
import { makeThesisChain, makeUser } from "../../support/fixtures";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let close: () => Promise<void>;
beforeAll(async () => {
  ({ db, close } = await makeTestDb());
});
afterAll(() => close());

const as = (u: { id: string; role: s.UserRole }): DataContext => ({ db, actor: { userId: u.id, role: u.role, isActive: true } as Actor });
const NOW = new Date("2026-11-22T00:00:00Z");
const at = (days: number, hour = 9) => new Date(NOW.getTime() + days * 86_400_000 + hour * 3_600_000);
const slotIn = (days: number) => ({
  slotType: "consultation" as const, mode: "in_person" as const, meetingLink: null,
  startsAt: at(days, 9), endsAt: at(days, 10), repeatWeeks: 0,
});

describe("audit record for each action kind", () => {
  it("slots, bookings and the consultation log", async () => {
    const t = await makeThesisChain(db);
    let slotIds: string[] = [];
    await expectAudit(db, ["slot.publish"], async () => {
      slotIds = (await publishSlots(as(t.adviser), slotIn(2), NOW)).slotIds;
    });
    const spare = (await publishSlots(as(t.adviser), slotIn(5), NOW)).slotIds[0]!;
    await expectAudit(db, ["slot.withdraw"], () => withdrawSlot(as(t.adviser), spare));
    let bookingId = "";
    await expectAudit(db, ["booking.request"], async () => {
      bookingId = (await requestBooking(as(t.student), { slotId: slotIds[0]! }, NOW)).bookingId;
    });
    await expectAudit(db, ["booking.agenda"], () => updateAgenda(as(t.student), bookingId, { agenda: "Methods", threadIds: [] }, NOW));
    await expectAudit(db, ["booking.confirm"], () => decideBooking(as(t.adviser), bookingId, "confirm"));
    const declined = await makeThesisChain(db);
    const [d] = (await publishSlots(as(declined.adviser), slotIn(3), NOW)).slotIds;
    const { bookingId: b2 } = await requestBooking(as(declined.student), { slotId: d! }, NOW);
    await expectAudit(db, ["booking.decline"], () => decideBooking(as(declined.adviser), b2, "decline"));
    let entryId = "";
    await expectAudit(db, ["log.draft"], async () => {
      entryId = (await draftLogEntry(as(t.adviser), bookingId, {}, at(3))).entryId;
    });
    await expectAudit(db, ["log.topic"], () => setLogTopic(as(t.student), entryId, "Methods"));
    await expectAudit(db, ["log.confirm"], () => confirmLogEntry(as(t.adviser), entryId, "Add a chapter."));
  });

  it("target date, Return and data gathering", async () => {
    const t = await makeThesisChain(db);
    await expectAudit(db, ["milestone.target_date"], () => setTargetDate(as(t.coordinator), t.milestone.id, "2027-03-15"));
    await db.update(s.milestoneInstance).set({ status: "READY" }).where(eq(s.milestoneInstance.id, t.milestone.id));
    await expectAudit(db, ["milestone.return"], () =>
      transitionMilestone(as(t.adviser), t.milestone.id, "RETURNED", { reason: "Fix chapter 2." }),
    );
    const g = await makeThesisChain(db);
    await db.update(s.milestoneInstance).set({ status: "CERTIFIED" }).where(eq(s.milestoneInstance.id, g.milestone.id));
    await expectAudit(db, ["data_gathering.approve"], () => approveDataGathering(as(g.adviser), g.milestone.id));
  });

  it("revision items", async () => {
    const t = await makeThesisChain(db);
    const [attempt] = await db
      .insert(s.defenseAttempt)
      .values({
        milestoneInstanceId: t.milestone.id, attemptNo: 1, status: "held", verdict: "approved_with_revisions",
        verdictByUserId: t.adviser.id, verdictAt: new Date(),
      })
      .returning();
    const member = await makeUser(db, "panel_member");
    const [com] = await db.insert(s.committee).values({ thesisInstanceId: t.thesis.id, kind: "evaluation_committee" }).returning();
    await db.insert(s.committeeMember).values({ committeeId: com!.id, memberUserId: member.id, status: "accepted" });
    await expectAudit(db, ["revision.add"], () => addRevisionItems(as(t.coordinator), attempt!.id, ["Add limits."]));
    const [item] = await db.select().from(s.revisionItem).where(eq(s.revisionItem.defenseAttemptId, attempt!.id));
    await expectAudit(db, ["revision.link"], () => linkRevisionToCommit(as(t.student), item!.id, t.commit.id));
    await expectAudit(db, ["revision.accept"], () => acceptRevision(as(t.adviser), item!.id));
  });
});
