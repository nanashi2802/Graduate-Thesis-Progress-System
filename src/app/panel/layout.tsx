// The `/panel` portal: open to the panel_member role only (FR-ACC-02). The shell gives the navigation and the notification center.
import { RoleGate } from "@/app/_components/role-gate";
import { RoleShell } from "@/app/_components/role-shell";

export default function Layout({ children }: LayoutProps<"/panel">) {
  return (
    <RoleGate role="panel_member">
      <RoleShell role="panel_member">{children}</RoleShell>
    </RoleGate>
  );
}
