// The `/panel` portal: open to the panel_member role only (FR-ACC-02).
import { RoleGate } from "@/app/_components/role-gate";

export default function Layout({ children }: LayoutProps<"/panel">) {
  return <RoleGate role="panel_member">{children}</RoleGate>;
}
