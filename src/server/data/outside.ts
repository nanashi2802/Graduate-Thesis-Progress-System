// Outside statuses: the Coordinator records each change (FR-WFL-10, BR-14, INV-27, AD-A-017). Server only.
import "server-only";
import { desc, eq } from "drizzle-orm";
import type { DataContext } from "./access";
import { recordAudit } from "./audit";
import { InputProblem, requireCoordinator } from "./coordinator";
import type { Db } from "./db";
import { milestoneInstance, OUTSIDE_VALUES, outsideStatusEvent, type OutsideKind, type OutsideValue } from "./schema";
import { requireThesisRead } from "./scope";

export type OutsideStatuses = {
  ethics: (typeof OUTSIDE_VALUES.ethics)[number];
  ipmo: (typeof OUTSIDE_VALUES.ipmo)[number];
  rpo: (typeof OUTSIDE_VALUES.rpo)[number];
  copyright: (typeof OUTSIDE_VALUES.copyright)[number];
};

const START: OutsideStatuses = { ethics: "NOT_SUBMITTED", ipmo: "NOT_SUBMITTED", rpo: "NOT_SUBMITTED", copyright: "NOT_APPLIED" };

// The current status of each kind: the latest event (ERD §4.2). Call only after an access check.
export async function currentOutsideStatuses(db: Db, milestoneId: string): Promise<OutsideStatuses> {
  const events = await db
    .select({ kind: outsideStatusEvent.kind, value: outsideStatusEvent.value })
    .from(outsideStatusEvent)
    .where(eq(outsideStatusEvent.milestoneInstanceId, milestoneId))
    .orderBy(desc(outsideStatusEvent.id));
  const out: Record<string, string> = { ...START };
  const seen = new Set<string>();
  for (const e of events) {
    if (seen.has(e.kind)) continue;
    seen.add(e.kind);
    out[e.kind] = e.value;
  }
  return out as OutsideStatuses;
}

// Every role with access to the thesis sees the statuses (BR-14: the Coordinator sets them).
export async function readOutsideStatuses(ctx: DataContext, milestoneId: string): Promise<OutsideStatuses> {
  const [m] = await ctx.db.select().from(milestoneInstance).where(eq(milestoneInstance.id, milestoneId));
  if (!m) throw new InputProblem("This milestone does not exist.");
  await requireThesisRead(ctx, m.thesisInstanceId);
  return currentOutsideStatuses(ctx.db, milestoneId);
}

export async function setOutsideStatus(
  ctx: DataContext,
  milestoneId: string,
  kind: OutsideKind,
  value: OutsideValue,
): Promise<void> {
  requireCoordinator(ctx, "sets outside statuses");
  if (!(OUTSIDE_VALUES[kind] as readonly string[]).includes(value)) {
    throw new InputProblem(`${value} is not a value for ${kind} (INV-27).`);
  }
  await ctx.db.transaction(async (tx) => {
    await tx.insert(outsideStatusEvent).values({ milestoneInstanceId: milestoneId, kind, value, setByUserId: ctx.actor.userId });
    await recordAudit(
      { db: tx, actor: ctx.actor },
      { action: "outside.set", targetTable: "milestone_instance", targetId: milestoneId, detail: { kind, value } },
    );
  });
}
