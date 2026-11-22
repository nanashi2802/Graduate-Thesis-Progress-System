// The `/adviser` portal: open to the adviser role only (FR-ACC-02). The shell gives the navigation and the notification center.
import { RoleGate } from "@/app/_components/role-gate";
import { RoleShell } from "@/app/_components/role-shell";

export default function Layout({ children }: LayoutProps<"/adviser">) {
  return (
    <RoleGate role="adviser">
      <RoleShell role="adviser">{children}</RoleShell>
    </RoleGate>
  );
}
