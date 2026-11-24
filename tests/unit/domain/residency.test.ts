import { describe, expect, it } from "vitest";
import { residency } from "@/server/domain/residency";

describe("residency (FR-WFL-12, R7)", () => {
  it("adds 5 years for a Master's student", () => {
    expect(residency("masters", "2025-1", "2026-01-01")).toMatchObject({ endDate: "2030-12-31", warning: false });
  });
  it("adds 7 years for a Doctoral student", () => {
    expect(residency("doctoral", "2025-2", "2026-01-01")?.endDate).toBe("2032-12-31");
  });
  it("warns inside 90 days and after the end date", () => {
    expect(residency("masters", "2025-1", "2030-10-02")?.warning).toBe(true);
    expect(residency("masters", "2025-1", "2030-10-01")?.warning).toBe(false);
    expect(residency("masters", "2025-1", "2031-02-01")).toMatchObject({ warning: true, daysLeft: -32 });
  });
  it("gives no date and no warning for a bad start term", () => {
    expect(residency("masters", "soon", "2026-01-01")).toBeNull();
    expect(residency("masters", "", "2026-01-01")).toBeNull();
  });
});
