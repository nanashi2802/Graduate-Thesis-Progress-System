// File rules with no I/O (NFR-02, NFR-10, INV-09). Tests and the browser form can use them.

// NFR-10: a manuscript is a PDF. A scan is a PDF or an image. 50 MB at most (AS-11, proposed).
export const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const MANUSCRIPT_TYPES = ["application/pdf"] as const;
export const SCAN_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
export type FileKind = "manuscript" | "scan";

export type UploadRequest = { kind: FileKind; sha256: string; size: number; contentType: string };

// The reason the upload is refused, or null when it is allowed (BR-18: show the reason).
export function uploadProblem(r: UploadRequest): string | null {
  const types: readonly string[] = r.kind === "manuscript" ? MANUSCRIPT_TYPES : SCAN_TYPES;
  if (!types.includes(r.contentType)) {
    return r.kind === "manuscript" ? "The manuscript must be a PDF." : "A scan must be a PDF, a JPEG or a PNG.";
  }
  if (!Number.isInteger(r.size) || r.size <= 0) return "The file is empty.";
  if (r.size > MAX_FILE_BYTES) return "The file is larger than 50 MB.";
  if (!/^[0-9a-f]{64}$/.test(r.sha256)) return "The file hash is not a SHA-256 hash.";
  return null;
}

// S3 checksums are base64. The database keeps 64 lowercase hex characters (ERD §1).
export function hexToBase64(hex: string): string {
  return Buffer.from(hex, "hex").toString("base64");
}
export function base64ToHex(b64: string): string {
  return Buffer.from(b64, "base64").toString("hex");
}

const EXT: Record<string, string> = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" };

// A new write-once key for each file (INV-09, BR-19). The prefix keeps agent test files apart
// (AGENTS.md §13.8). No key is used twice.
export function newFileKey(prefix: string, kind: FileKind, contentType: string, id: string): string {
  const head = prefix ? `${prefix.replace(/\/+$/, "")}/` : "";
  return `${head}${kind}/${id}.${EXT[contentType] ?? "bin"}`;
}
