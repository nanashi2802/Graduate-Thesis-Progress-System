// Fake users for local development and the sign-in test (P0-E03, AD-A-006).
// Run: pnpm db:seed-dev. Needs DATABASE_URL, NEON_AUTH_BASE_URL and DEV_SEED_PASSWORD in .env.local.
// Fake data only (AGENTS.md §11). Every address ends in @example.test.
//
// 1. The first Coordinator cannot come from the app, because open sign-up is off and no
//    Neon API key is in use. So this script writes it into the Neon Auth tables (Neon Auth
//    role `admin`). Do this on a development branch only.
// 2. All other users come through `admin/create-user` with the Coordinator's session,
//    the same path the app uses (FR-ACC-05).
// 3. `stranger@example.test` gets a Neon Auth user but no app account. It acts as a Google
//    user that the Coordinator did not add (D-23).
import { randomBytes, randomUUID, scrypt } from "node:crypto";
import { neon } from "@neondatabase/serverless";

try {
  process.loadEnvFile(".env.local");
} catch {}
const { DATABASE_URL, NEON_AUTH_BASE_URL: base, DEV_SEED_PASSWORD: password } = process.env;
if (!DATABASE_URL || !base || !password) {
  console.error("Set DATABASE_URL, NEON_AUTH_BASE_URL and DEV_SEED_PASSWORD in .env.local.");
  process.exit(1);
}
const sql = neon(DATABASE_URL);
const origin = "http://localhost:3000";

// The Better Auth password format: hex salt, colon, hex scrypt key.
function hashPassword(pw) {
  const salt = randomBytes(16).toString("hex");
  return new Promise((ok, fail) =>
    scrypt(pw.normalize("NFKC"), salt, 64, { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 }, (e, k) =>
      e ? fail(e) : ok(`${salt}:${k.toString("hex")}`),
    ),
  );
}

async function authPost(path, body, cookie) {
  const res = await fetch(`${base}/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin, ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status} ${await res.text()}`);
  return res;
}

async function upsertAppUser(authUserId, name, email, role) {
  await sql`insert into app.app_user (auth_user_id, full_name, email, role)
    values (${authUserId}, ${name}, ${email}, ${role})
    on conflict (email) do update set auth_user_id = excluded.auth_user_id, role = excluded.role, is_active = true`;
}

// 1. Bootstrap Coordinator.
const coordinatorEmail = "coordinator@example.test";
let [coord] = await sql`select id from neon_auth."user" where email = ${coordinatorEmail}`;
if (!coord) {
  coord = { id: randomUUID() };
  await sql`insert into neon_auth."user" (id, name, email, "emailVerified", "createdAt", "updatedAt", role)
    values (${coord.id}, 'Fake Coordinator', ${coordinatorEmail}, true, now(), now(), 'admin')`;
  await sql`insert into neon_auth.account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
    values (${randomUUID()}, ${coord.id}, 'credential', ${coord.id}, ${await hashPassword(password)}, now(), now())`;
}
await upsertAppUser(coord.id, "Fake Coordinator", coordinatorEmail, "coordinator");

const signIn = await authPost("sign-in/email", { email: coordinatorEmail, password });
const cookie = signIn.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");

// 2. Users through the Coordinator path.
const users = [
  ["Fake Student", "student@example.test", "student"],
  ["Fake Adviser", "adviser@example.test", "adviser"],
  ["Fake Panel Member", "panel@example.test", "panel_member"],
  ["Fake Stranger", "stranger@example.test", null],
];
for (const [name, email, role] of users) {
  let [u] = await sql`select id from neon_auth."user" where email = ${email}`;
  if (!u) {
    const res = await authPost("admin/create-user", { email, password, name, role: "user" }, cookie);
    u = (await res.json()).user;
  }
  if (role) await upsertAppUser(u.id, name, email, role);
  console.log(`${email}: ${role ?? "no app account"}`);
}
console.log(`${coordinatorEmail}: coordinator (Neon Auth admin)`);
