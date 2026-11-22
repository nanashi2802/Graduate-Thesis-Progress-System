import { describe, expect, it } from "vitest";
import {
  blocksStageClose,
  canUploadScan,
  decideDocumentChange,
  type DocumentActor,
  type DocumentState,
} from "@/server/domain/documents";

const STATES: DocumentState[] = [
  "not_started", "prepared", "scan_uploaded", "locked_as_submitted",
  "physical_received", "verified", "mismatch", "returned",
];

// Each allowed change of ERD §7.2 with its actor.
const ALLOWED: [DocumentState, DocumentState, DocumentActor][] = [
  ["not_started", "prepared", "system"],
  ["prepared", "scan_uploaded", "uploader"],
  ["scan_uploaded", "locked_as_submitted", "system"],
  ["locked_as_submitted", "physical_received", "coordinator"],
  ["physical_received", "verified", "coordinator"],
  ["locked_as_submitted", "mismatch", "coordinator"],
  ["physical_received", "mismatch", "coordinator"],
  ["verified", "mismatch", "coordinator"],
  ["mismatch", "locked_as_submitted", "uploader"],
  ["returned", "scan_uploaded", "uploader"],
];

describe("decideDocumentChange (FR-DOC-02, ERD §7.2)", () => {
  it.each(ALLOWED)("allows %s to %s by %s", (from, to, actor) => {
    expect(decideDocumentChange(from, to, actor)).toEqual({ ok: true });
  });

  it("allows a Return from any other state, by the Coordinator, with a reason (FR-DOC-06, BR-13)", () => {
    for (const from of STATES.filter((s) => s !== "returned")) {
      expect(decideDocumentChange(from, "returned", "coordinator", "The OR number is not readable.")).toEqual({
        ok: true,
      });
      expect(decideDocumentChange(from, "returned", "coordinator", "  ")).toMatchObject({ code: "reason_required" });
    }
  });

  it("refuses every other change, so a locked scan is never replaced without a Return (BR-19)", () => {
    const allowedKeys = new Set(ALLOWED.map(([f, t]) => `${f}>${t}`));
    for (const from of STATES) {
      for (const to of STATES) {
        if (to === "returned" && from !== "returned") continue;
        if (allowedKeys.has(`${from}>${to}`)) continue;
        expect(decideDocumentChange(from, to, "coordinator", "reason")).toMatchObject({ ok: false, code: "not_allowed" });
      }
    }
  });

  it("refuses the wrong actor", () => {
    expect(decideDocumentChange("physical_received", "verified", "uploader")).toMatchObject({ code: "wrong_actor" });
    expect(decideDocumentChange("prepared", "scan_uploaded", "coordinator")).toMatchObject({ code: "wrong_actor" });
    expect(decideDocumentChange("verified", "returned", "uploader", "x")).toMatchObject({ code: "wrong_actor" });
  });
});

describe("upload and close rules", () => {
  it("allows a new scan only when prepared, returned or in mismatch (FR-DOC-03)", () => {
    expect(STATES.filter(canUploadScan)).toEqual(["prepared", "mismatch", "returned"]);
  });

  it("blocks the stage close while a document is in mismatch (BR-12)", () => {
    expect(blocksStageClose(["verified", "mismatch"])).toBe(true);
    expect(blocksStageClose(["verified", "physical_received"])).toBe(false);
  });
});
