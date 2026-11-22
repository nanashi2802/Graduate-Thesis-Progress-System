// The `/coordinator` portal: open to the coordinator role only (FR-ACC-02).
import { RoleGate } from "@/app/_components/role-gate";

export default function Layout({ children }: LayoutProps<"/coordinator">) {
  return <RoleGate role="coordinator">{children}</RoleGate>;
}
