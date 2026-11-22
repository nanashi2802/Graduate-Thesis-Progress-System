import { describe, expect, it } from "vitest";
import { checklistComplete, complianceChecklist, type ChecklistFacts } from "@/server/domain/checklist";

const full: ChecklistFacts = {
  documents: {
    "TDW 03": "locked_as_submitted",
    "TDW 06": "verified",
    "TDW 07": "physical_received",
    "TDW 09": "locked_as_submitted",
    "TDW 11": "verified",
    "TDW 12": "verified",
  },
  ndas: ["verified", "verified"],
  officialReceipt: "verified",
  ethics: "APPROVED",
  ipmo: "PASSED",
};

describe("complianceChecklist (FR-DOC-08, INV-13)", () => {
  it("lists the items of each milestone", () => {
    expect(complianceChecklist("proposal", full).map((i) => i.id)).toEqual(["tdw03", "tdw06", "ndas", "tdw07", "ethics", "or"]);
    expect(complianceChecklist("pre_final", full).map((i) => i.id)).toEqual(["tdw03", "tdw09", "ipmo", "or"]);
    expect(complianceChecklist("final", full).map((i) => i.id)).toEqual(["tdw03", "tdw11", "ndas", "tdw12", "or"]);
  });

  it("is complete when every item is done", () => {
    for (const m of ["proposal", "pre_final", "final"] as const) expect(checklistComplete(m, full)).toBe(true);
  });

  it("needs Ethics APPROVED in Milestone 1 and IPMO PASSED in Milestone 2", () => {
    expect(checklistComplete("proposal", { ...full, ethics: "UNDER_REVIEW" })).toBe(false);
    expect(checklistComplete("pre_final", { ...full, ipmo: "UNDER_CHECK" })).toBe(false);
    expect(checklistComplete("final", { ...full, ethics: "NOT_SUBMITTED", ipmo: "FAILED" })).toBe(true);
  });

  it("needs every NDA verified, and at least one", () => {
    expect(checklistComplete("proposal", { ...full, ndas: ["verified", "locked_as_submitted"] })).toBe(false);
    expect(checklistComplete("final", { ...full, ndas: [] })).toBe(false);
  });

  it("needs a verified OR, not only an uploaded one", () => {
    expect(checklistComplete("pre_final", { ...full, officialReceipt: "locked_as_submitted" })).toBe(false);
    expect(checklistComplete("pre_final", { ...full, officialReceipt: undefined })).toBe(false);
  });

  it("counts a locked scan and a Mismatch as submitted (BR-12), but not a returned or missing scan", () => {
    expect(checklistComplete("proposal", { ...full, documents: { ...full.documents, "TDW 07": "mismatch" } })).toBe(true);
    expect(checklistComplete("proposal", { ...full, documents: { ...full.documents, "TDW 07": "returned" } })).toBe(false);
    expect(checklistComplete("proposal", { ...full, documents: { ...full.documents, "TDW 07": "scan_uploaded" } })).toBe(false);
    expect(checklistComplete("pre_final", { ...full, documents: { ...full.documents, "TDW 09": undefined } })).toBe(false);
  });

  it("gives each item a label for the screen", () => {
    for (const i of complianceChecklist("proposal", full)) expect(i.label.length).toBeGreaterThan(0);
  });
});
