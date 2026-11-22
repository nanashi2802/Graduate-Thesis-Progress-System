// P0-E06-T02 spike (AS-13, R12, R13, NFR-12). Fake data only: random bytes.
// Uploads one file of SIZE_MB under the agent-b/ prefix of thesis-files, then
// downloads it ROUNDS times and prints the bytes moved. Compare the Neon project
// `data_transfer_bytes` before and after (see P0-report.md).
// Run: node --env-file=.env.local spec/spikes/transfer_test.mjs [SIZE_MB] [ROUNDS]
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const sizeMb = Number(process.argv[2] ?? 20);
const rounds = Number(process.argv[3] ?? 5);
const { S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET } = process.env;
if (!S3_ENDPOINT || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) throw new Error("S3 variables are not set");

const s3 = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION ?? "ap-southeast-1",
  forcePathStyle: true,
  credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
});
const Bucket = S3_BUCKET ?? "thesis-files";
// AGENTS.md §13.8: only the agent-b/ prefix. Write-once key (INV-09).
const Key = `agent-b/spike/transfer-${new Date().toISOString().slice(0, 10)}-${randomUUID()}.bin`;

const body = randomBytes(sizeMb * 1024 * 1024); // random, so no compression hides bytes
const sha = createHash("sha256").update(body).digest("base64");
let t = Date.now();
await s3.send(new PutObjectCommand({ Bucket, Key, Body: body, ChecksumSHA256: sha, IfNoneMatch: "*" }));
console.log(`upload ${sizeMb} MB to ${Key}: ${Date.now() - t} ms`);

let total = 0;
for (let i = 1; i <= rounds; i++) {
  t = Date.now();
  const res = await s3.send(new GetObjectCommand({ Bucket, Key }));
  const bytes = await res.Body.transformToByteArray();
  total += bytes.length;
  console.log(`download ${i}: ${bytes.length} bytes, ${Date.now() - t} ms`);
}
console.log(`total downloaded: ${total} bytes (${(total / 1024 / 1024).toFixed(1)} MB) at ${new Date().toISOString()}`);
