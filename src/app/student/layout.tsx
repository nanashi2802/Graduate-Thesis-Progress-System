// The `/student` portal: open to the student role only (FR-ACC-02). The shell gives the navigation and the notification center.
import { RoleGate } from "@/app/_components/role-gate";
import { RoleShell } from "@/app/_components/role-shell";

export default function Layout({ children }: LayoutProps<"/student">) {
  return (
    <RoleGate role="student">
      <RoleShell role="student">{children}</RoleShell>
    </RoleGate>
  );
}
