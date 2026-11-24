// P2-E04-T10: notification preferences (FR-NTF-05, FR-NTF-09, INV-29, NFR-01).
import { beforeEach, describe, expect, it } from "vitest";
import type { Actor } from "@/server/data/access";
import type { Db } from "@/server/data/db";
import { listMyPreferences, setMyPreference } from "@/server/data/preferences";
import * as s from "@/server/data/schema";
import { seedMilestone1 } from "../../support/seed-m1";
import { makeTestDb } from "../../support/test-db";

let db: Db;
let seed: Awaited<ReturnType<typeof seedMilestone1>>;
const as = (u: { id: string; role: s.UserRole }) => ({ db, actor: { userId: u.id, role: u.role, isActive: true } as Actor });

beforeEach(async () => {
  ({ db } = await makeTestDb());
  seed = await seedMilestone1(db);
});

describe("preferences", () => {
  it("lists optional events with a switch and the rest as always on", async () => {
    const rows = await listMyPreferences(as(seed.student));
    expect(rows.find((r) => r.code === "C2")).toMatchObject({ optional: true, enabled: true });
    expect(rows.find((r) => r.code === "B3")).toMatchObject({ optional: false, enabled: true });
    expect(rows.find((r) => r.code === "A1")).toBeUndefined(); // A1 goes to the Coordinator only
  });

  it("turns an optional event off and on again", async () => {
    await setMyPreference(as(seed.student), "C2", false);
    expect((await listMyPreferences(as(seed.student))).find((r) => r.code === "C2")!.enabled).toBe(false);
    await setMyPreference(as(seed.student), "C2", true);
    expect((await listMyPreferences(as(seed.student))).find((r) => r.code === "C2")!.enabled).toBe(true);
  });

  it("refuses a code outside INV-29 and an unknown code", async () => {
    await expect(setMyPreference(as(seed.student), "B3", false)).rejects.toThrow("always on");
    await expect(setMyPreference(as(seed.student), "ZZ", false)).rejects.toThrow("always on");
    expect(await db.select().from(s.notificationPreference)).toHaveLength(0);
  });

  it("changes only the own row (NFR-01)", async () => {
    await setMyPreference(as(seed.student), "C2", false);
    expect((await listMyPreferences(as(seed.coordinator))).find((r) => r.code === "C2")?.enabled ?? true).toBe(true);
    const rows = await db.select().from(s.notificationPreference);
    expect(rows.map((r) => r.userId)).toEqual([seed.student.id]);
  });

  it("refuses an inactive user", async () => {
    const ctx = { db, actor: { userId: seed.student.id, role: seed.student.role, isActive: false } as Actor };
    await expect(setMyPreference(ctx, "C2", false)).rejects.toThrow();
  });
});
