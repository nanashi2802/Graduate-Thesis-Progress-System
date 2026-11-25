import { describe, expect, it } from "vitest";
import {
  blocksStageClose,
  canUploadScan,
  decideDocumentChange,
  type DocumentActor,
  type DocumentState,
} from "@/server/domain/documents";

const STATES: DocumentState[] = ["not_started", "prepared", "scan_uploaded", "locked_as_submitted", "verified", "returned"];

// Each allowed change of ERD §7.2 with its actor, except the Return (tested below).
const ALLOWED: [DocumentState, DocumentState, DocumentActor][] = [
  ["not_started", "prepared", "system"],
  ["prepared", "scan_uploaded", "uploader"],
  ["scan_uploaded", "locked_as_submitted", "system"],
  ["locked_as_submitted", "verified", "coordinator"],
  ["returned", "scan_uploaded", "uploader"],
];

const RETURN_FROM = new Set(["scan_uploaded>returned", "locked_as_submitted>returned"]);

describe("decideDocumentChange (FR-DOC-02, ERD §7.2, D-28)", () => {
  it.each(ALLOWED)("allows %s to %s by %s", (from, to, actor) => {
    expect(decideDocumentChange(from, to, actor)).toEqual({ ok: true });
  });

  it("allows a Return only from scan_uploaded or locked_as_submitted, with a reason (FR-DOC-06, FR-DOC-07, BR-13)", () => {
    for (const from of ["scan_uploaded", "locked_as_submitted"] as const) {
      expect(decideDocumentChange(from, "returned", "coordinator", "The Dean's signature is missing.")).toEqual({ ok: true });
      expect(decideDocumentChange(from, "returned", "coordinator", "  ")).toMatchObject({ code: "reason_required" });
    }
  });

  it("keeps a verified document final (BR-19, ERD 1.2 §7.2)", () => {
    expect(decideDocumentChange("verified", "returned", "coordinator", "x")).toMatchObject({ code: "not_allowed" });
  });

  it("refuses every other change, so a locked scan is never replaced without a Return (BR-19)", () => {
    const allowedKeys = new Set(ALLOWED.map(([f, t]) => `${f}>${t}`));
    for (const from of STATES) {
      for (const to of STATES) {
        const key = `${from}>${to}`;
        if (RETURN_FROM.has(key) || allowedKeys.has(key)) continue;
        expect(decideDocumentChange(from, to, "coordinator", "reason")).toMatchObject({ ok: false, code: "not_allowed" });
      }
    }
  });

  it("refuses the wrong actor", () => {
    expect(decideDocumentChange("locked_as_submitted", "verified", "uploader")).toMatchObject({ code: "wrong_actor" });
    expect(decideDocumentChange("prepared", "scan_uploaded", "coordinator")).toMatchObject({ code: "wrong_actor" });
    expect(decideDocumentChange("locked_as_submitted", "returned", "uploader", "x")).toMatchObject({ code: "wrong_actor" });
  });
});

describe("upload and close rules", () => {
  it("lets the uploader upload only in prepared or returned (FR-DOC-03, BR-19)", () => {
    expect(STATES.filter(canUploadScan)).toEqual(["prepared", "returned"]);
  });

  it("blocks the stage close while a document is returned (BR-12)", () => {
    expect(blocksStageClose(["verified", "returned"])).toBe(true);
    expect(blocksStageClose(["verified", "locked_as_submitted"])).toBe(false);
  });
});
