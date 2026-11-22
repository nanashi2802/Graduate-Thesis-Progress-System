// P2-E05: the Milestone 2 exit test. The Student of the Milestone 1 flow goes through the Pre-Final Defense with every role:
// the IPMO gate, no new appointment, TDW 09, a comments-only TDW 10 sheet, revision items and the close that opens Milestone 3.
// The steps are in `runMilestone2` (tests/support/flow.ts), shared with the Milestone 3 flow.
import { afterAll, beforeAll, describe, it } from "vitest";
import type { Db } from "@/server/data/db";
import { runMilestone2 } from "../../support/flow";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let close: () => Promise<void>;
beforeAll(async () => {
  ({ db, close } = await makeTestDb());
});
afterAll(() => close());

describe("Milestone 2: Pre-Final Defense with every role", () => {
  it("runs from the open of Milestone 2 to its close, which opens Milestone 3", async () => {
    await runMilestone2(db);
  });
});
