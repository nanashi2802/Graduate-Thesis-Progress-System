// Email sign-in attempts, for the app's own login rate limit (FR-ACC-01, NFR-01, issue #57).
// Neon Auth sees only the server address, so its own limit cannot tell users apart.
// It is not an audit record (BR-19 does not apply): old rows are deleted.
// It holds a hash, never the email address or the client address.
import { index, text } from "drizzle-orm/pg-core";
import { app } from "./app";
import { createdAt, id } from "./columns";

export const signInAttempt = app.table(
  "sign_in_attempt",
  {
    id: id(),
    // sha256 of "email:<address>" or "ip:<address>".
    bucket: text("bucket").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sign_in_attempt_bucket_created_idx").on(t.bucket, t.createdAt)],
);
