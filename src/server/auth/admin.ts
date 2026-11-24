// The Neon Auth side of account creation (FR-ACC-05, AD-A-006). Server only.
// It runs with the signed-in Coordinator's session. That user has the Neon Auth role `admin`.
import "server-only";
import type { CreateAuthUser } from "@/server/data/accounts";
import { appLink } from "@/server/notify/link";
import { getAuth } from "./neon-auth";

type AdminApi = {
  createUser(input: { name: string; email: string; password: string; role: string }): Promise<{
    data: { user?: { id?: string } } | null;
    error: { message?: string } | null;
  }>;
};

export const neonCreateAuthUser: CreateAuthUser = async ({ name, email, password }) => {
  // The SDK types `admin` as unknown. The endpoint is `admin/create-user` (the seed script uses it).
  const admin = getAuth().admin as unknown as AdminApi;
  const { data, error } = await admin.createUser({ name, email, password, role: "user" });
  const id = data?.user?.id;
  if (error || !id) throw new Error(`Neon Auth did not make the user: ${error?.message ?? "no user id"}`);
  return { authUserId: id };
};

// Neon Auth sends the set-password email itself and returns no token (AD-A-034).
export async function neonSendSetLink(email: string): Promise<void> {
  const { error } = await getAuth().requestPasswordReset({ email, redirectTo: appLink("/login/reset") });
  if (error) throw new Error("Neon Auth did not send the link.");
}
