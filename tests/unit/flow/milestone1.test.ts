// P1-E13: the Milestone 1 exit test (PRD §8). One fake Student goes from account creation to CERTIFIED with every role,
// through the real data layer on the real migrations (PGlite). The browser run needs Neon Auth: see AD-A-025.
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/server/data/db";
import * as s from "@/server/data/schema";
import { runMilestone1 } from "../../support/flow";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let close: () => Promise<void>;
beforeAll(async () => {
  ({ db, close } = await makeTestDb());
});
afterAll(() => close());

describe("Milestone 1: account to CERTIFIED with every role", () => {
  it("runs the whole path", async () => {
    const flow = await runMilestone1(db);
    expect(await flow.status()).toBe("CERTIFIED");
    const [m] = await db.select().from(s.milestoneInstance).where(eq(s.milestoneInstance.id, flow.milestoneId));
    expect(m!.dataGatheringApprovedAt).not.toBeNull();
  });
});
