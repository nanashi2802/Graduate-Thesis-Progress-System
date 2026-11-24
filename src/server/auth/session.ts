// The signed-in actor and the role check for each portal (FR-ACC-02, NFR-01). Server only.
import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { Actor } from "@/server/data/access";
import { resolveActor } from "@/server/data/actors";
import { getDb } from "@/server/data/db";
import type { UserRole } from "@/server/data/schema";
import { getAuth } from "./neon-auth";

export type SessionState =
  | { status: "signed_out" }
  | { status: "no_account" }
  | { status: "ok"; actor: Actor };

export async function getSessionState(): Promise<SessionState> {
  await connection(); // Per request: never prerender a session read.
  const { data } = await getAuth().getSession();
  const user = data?.user;
  if (!user) return { status: "signed_out" };
  return stateFor(user);
}

async function stateFor(user: { id: string; email: string; emailVerified?: boolean }): Promise<SessionState> {
  const actor = await resolveActor(getDb(), { authUserId: user.id, email: user.email,
    emailVerified: user.emailVerified === true,
  });
  return actor ? { status: "ok", actor } : { status: "no_account" };
}

export const PORTAL: Record<UserRole, string> = {
  student: "/student/dashboard",
  adviser: "/adviser/dashboard",
  panel_member: "/panel/dashboard",
  coordinator: "/coordinator/dashboard",
};

export type RoleCheck = { ok: true; actor: Actor } | { ok: false; reason: string };

// A route is open to its role only. Other users get the reason for the Access Denied banner.
// A signed-out user goes to /login.
export async function checkRole(role: UserRole): Promise<RoleCheck> {
  const state = await getSessionState();
  if (state.status === "signed_out") redirect("/login");
  return roleDecision(state, role);
}

// For a page under a portal: the actor when the role matches, else a non-ok state, so the page
// makes no data call after the gate refused the user (issue #58). The data layer still checks (NFR-01).
export async function getRoleState(role: UserRole): Promise<SessionState> {
  const state = await getSessionState();
  if (state.status !== "ok") return state;
  return roleDecision(state, role).ok ? state : { status: "no_account" };
}

export function roleDecision(state: Exclude<SessionState, { status: "signed_out" }>, role: UserRole): RoleCheck {
  if (state.status === "no_account") {
    return { ok: false, reason: "This sign-in has no account. Ask the Coordinator to make your account." };
  }
  if (!state.actor.isActive) {
    return { ok: false, reason: "Your account is deactivated. Ask the Coordinator." };
  }
  if (state.actor.role !== role) {
    return { ok: false, reason: "This page is for another role." };
  }
  return { ok: true, actor: state.actor };
}

// Where a new sign-in goes (D-23). A sign-in with no app account, or a deactivated one,
// is signed out at once, so it keeps no session. A server action passes the user from the
// sign-in result, because the new session cookie is not readable in the same request.
export async function afterSignInPath(user?: { id: string; email: string; emailVerified?: boolean }): Promise<string> {
  const state = user ? await stateFor(user) : await getSessionState();
  if (state.status === "signed_out") return "/login";
  if (state.status === "no_account" || !state.actor.isActive) {
    await getAuth().signOut();
    return `/login?error=${state.status === "no_account" ? "no_account" : "deactivated"}`;
  }
  return PORTAL[state.actor.role];
}
