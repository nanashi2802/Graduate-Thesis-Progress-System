// Set the CORS rule on the `thesis-files` bucket (P0-E04, NFR-12, AD-A-008).
// Run: pnpm storage:cors. Needs the S3_* variables in .env.local.
// Only the app origins may read or upload from a browser. The app never deletes (BR-19),
// so DELETE is not allowed.
import { GetBucketCorsCommand, PutBucketCorsCommand, S3Client } from "@aws-sdk/client-s3";

try {
  process.loadEnvFile(".env.local");
} catch {}
const e = process.env;
const s3 = new S3Client({
  endpoint: e.S3_ENDPOINT,
  region: e.S3_REGION,
  forcePathStyle: true,
  credentials: { accessKeyId: e.S3_ACCESS_KEY_ID, secretAccessKey: e.S3_SECRET_ACCESS_KEY },
});

// Origins from AD-B-001 (Vercel project `thesisko`). Change them when the domain changes.
const origins = [
  "http://localhost:3000",
  "https://thesisko-tau.vercel.app",
  "https://thesisko-*-yushinbjornmatsuda-9110s-projects.vercel.app",
];

await s3.send(
  new PutBucketCorsCommand({
    Bucket: e.S3_BUCKET,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: origins,
          AllowedMethods: ["GET", "HEAD", "PUT"],
          AllowedHeaders: ["content-type", "x-amz-checksum-sha256", "if-none-match", "range"],
          // pdf.js needs these to load page ranges (DFD T5).
          ExposeHeaders: ["ETag", "Content-Range", "Accept-Ranges", "Content-Length"],
          MaxAgeSeconds: 3000,
        },
      ],
    },
  }),
);
const now = await s3.send(new GetBucketCorsCommand({ Bucket: e.S3_BUCKET }));
console.log(JSON.stringify(now.CORSRules, null, 2));
