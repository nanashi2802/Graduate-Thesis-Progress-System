// Signed links to Neon Object Storage (NFR-02, NFR-12, INV-09, BR-19, DFD T1 to T5). Server only.
// The browser sends the bytes straight to storage. The server never receives them.
// This module has no delete function, and it issues no delete link (BR-19).
import "server-only";
import { randomUUID } from "node:crypto";
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { base64ToHex, hexToBase64, newFileKey, uploadProblem, type UploadRequest } from "./rules";

// Links live 5 minutes (NFR-12: short-lived).
export const LINK_SECONDS = 300;

let client: S3Client | undefined;
function s3(): S3Client {
  if (!client) {
    const { S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env;
    if (!S3_ENDPOINT || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) throw new Error("S3 variables are not set");
    client = new S3Client({
      endpoint: S3_ENDPOINT,
      region: S3_REGION ?? "ap-southeast-1",
      forcePathStyle: true,
      credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
      // We give the checksum ourselves: the browser's SHA-256 (NFR-02).
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }
  return client;
}
const bucket = () => process.env.S3_BUCKET ?? "thesis-files";

export type UploadLink = { key: string; url: string; headers: Record<string, string> };

// T1. The link is signed with the hash, size, type and `If-None-Match: *`. So storage refuses
// other bytes (BadDigest), another size or type (bad signature), and a second write to the key
// (412). The caller checks access before it calls this (NFR-01).
export async function createUploadLink(req: UploadRequest): Promise<UploadLink> {
  const problem = uploadProblem(req);
  if (problem) throw new Error(problem);
  const key = newFileKey(process.env.FILE_KEY_PREFIX ?? "", req.kind, req.contentType, randomUUID());
  const checksum = hexToBase64(req.sha256);
  const url = await getSignedUrl(
    s3(),
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      ContentType: req.contentType,
      ContentLength: req.size,
      ChecksumSHA256: checksum,
      IfNoneMatch: "*",
    }),
    { expiresIn: LINK_SECONDS, signableHeaders: new Set(["content-type", "content-length", "if-none-match"]) },
  );
  return {
    key,
    url,
    // The browser sets Content-Length itself from the body.
    headers: { "content-type": req.contentType, "x-amz-checksum-sha256": checksum, "if-none-match": "*" },
  };
}

// T3. True only when the stored object has the browser's hash and size (NFR-02).
// The caller makes the file record only after this passes (T4).
export async function checkStoredFile(key: string, sha256: string, size: number): Promise<boolean> {
  try {
    const head = await s3().send(new HeadObjectCommand({ Bucket: bucket(), Key: key, ChecksumMode: "ENABLED" }));
    return !!head.ChecksumSHA256 && base64ToHex(head.ChecksumSHA256) === sha256 && head.ContentLength === size;
  } catch {
    return false;
  }
}

// T5. A short-lived read link. The viewer loads page ranges with it.
export async function createReadLink(key: string): Promise<string> {
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: bucket(), Key: key }), { expiresIn: LINK_SECONDS });
}
