// Each portal is open to its role only (FR-ACC-02). Portal layouts wrap their routes in it.
// This gate is for the screen only. The data layer still checks access on every read (NFR-01).
import { Suspense, type ReactNode } from "react";
import { checkRole } from "@/server/auth/session";
import type { UserRole } from "@/server/data/schema";
import { AccessDenied } from "./access-denied";

async function Gate({ role, children }: { role: UserRole; children: ReactNode }) {
  const check = await checkRole(role);
  if (!check.ok) return <AccessDenied reason={check.reason} />;
  return children;
}

export function RoleGate({ role, children }: { role: UserRole; children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <Gate role={role}>{children}</Gate>
    </Suspense>
  );
}
