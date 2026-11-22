// The `/student` portal: open to the student role only (FR-ACC-02).
import { RoleGate } from "@/app/_components/role-gate";

export default function Layout({ children }: LayoutProps<"/student">) {
  return <RoleGate role="student">{children}</RoleGate>;
}
