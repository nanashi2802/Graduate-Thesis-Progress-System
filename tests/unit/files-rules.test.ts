// P0-E04: file rules (NFR-02, NFR-10, INV-09).
import { describe, expect, it } from "vitest";
import { base64ToHex, hexToBase64, MAX_FILE_BYTES, newFileKey, uploadProblem } from "@/server/files/rules";

const sha = "a".repeat(64);

describe("uploadProblem (NFR-10)", () => {
  it("allows a PDF manuscript up to 50 MB", () => {
    expect(uploadProblem({ kind: "manuscript", sha256: sha, size: MAX_FILE_BYTES, contentType: "application/pdf" })).toBeNull();
  });
  it("refuses a manuscript that is not a PDF", () => {
    expect(uploadProblem({ kind: "manuscript", sha256: sha, size: 10, contentType: "image/png" })).toMatch(/PDF/);
  });
  it("allows an image scan", () => {
    expect(uploadProblem({ kind: "scan", sha256: sha, size: 10, contentType: "image/jpeg" })).toBeNull();
  });
  it("refuses a file over 50 MB and an empty file", () => {
    expect(uploadProblem({ kind: "scan", sha256: sha, size: MAX_FILE_BYTES + 1, contentType: "application/pdf" })).toMatch(/50 MB/);
    expect(uploadProblem({ kind: "scan", sha256: sha, size: 0, contentType: "application/pdf" })).toMatch(/empty/);
  });
  it("refuses a hash that is not 64 lowercase hex characters (NFR-02)", () => {
    expect(uploadProblem({ kind: "scan", sha256: "A".repeat(64), size: 1, contentType: "application/pdf" })).toMatch(/SHA-256/);
  });
});

describe("hash forms", () => {
  it("turns hex into base64 and back", () => {
    const hex = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";
    expect(base64ToHex(hexToBase64(hex))).toBe(hex);
  });
});

describe("newFileKey (INV-09)", () => {
  it("puts the agent prefix, the kind and a new id in the key", () => {
    expect(newFileKey("agent-a/", "manuscript", "application/pdf", "id1")).toBe("agent-a/manuscript/id1.pdf");
    expect(newFileKey("", "scan", "image/png", "id2")).toBe("scan/id2.png");
  });
});
