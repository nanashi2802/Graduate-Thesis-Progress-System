// The `/coordinator` portal: open to the coordinator role only (FR-ACC-02). The shell gives the navigation and the notification center.
import { RoleGate } from "@/app/_components/role-gate";
import { RoleShell } from "@/app/_components/role-shell";

export default function Layout({ children }: LayoutProps<"/coordinator">) {
  return (
    <RoleGate role="coordinator">
      <RoleShell role="coordinator">{children}</RoleShell>
    </RoleGate>
  );
}
