// The `/adviser` portal: open to the adviser role only (FR-ACC-02).
import { RoleGate } from "@/app/_components/role-gate";

export default function Layout({ children }: LayoutProps<"/adviser">) {
  return <RoleGate role="adviser">{children}</RoleGate>;
}
