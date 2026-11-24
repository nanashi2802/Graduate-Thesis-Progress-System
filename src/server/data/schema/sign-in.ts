// Failed email sign-ins, for the app's own login rate limit (FR-ACC-01, NFR-01, issue #57).
// Neon Auth sees only the server address, so its own limit cannot tell users apart.
// It is not an audit record: old rows are deleted. It holds a hash, never the email address.
import { index, text } from "drizzle-orm/pg-core";
import { app } from "./app";
import { createdAt, id } from "./columns";

export const signInFailure = app.table(
  "sign_in_failure",
  {
    id: id(),
    // sha256 of "email:<address>" or "ip:<address>".
    bucket: text("bucket").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sign_in_failure_bucket_created_idx").on(t.bucket, t.createdAt)],
);
