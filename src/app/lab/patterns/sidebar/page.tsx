// /lab/patterns/sidebar (Task R2.1, UX-027, UX-028): every role's sidebar with mock facts, in light and dark.
// Three moments: first day, Milestone 3 (defense scheduled), after the defense (sheets verified).
// Hover or focus a locked item to see its reason. R2-a: option A (brand) and option B (neutral).
import { Demo, LabHeader, ThemePanels } from "../../_mock/panels";
import { SidebarFrame } from "../../_mock/shell-demo";
import { ROLES, ROLE_LABEL, type FactsName } from "../../_mock/shell-facts";

const MOMENTS: { facts: FactsName; label: string }[] = [
  { facts: "firstDay", label: "First day" },
  { facts: "milestone3", label: "Milestone 3, defense scheduled" },
  { facts: "afterDefense", label: "After the defense" },
];

export default function Page() {
  return (
    <>
      <LabHeader
        title="Sidebar (R2.1)"
        round="R2 · UX-P-02"
        states={["4 roles", "first day, Milestone 3, after the defense", "locked items with reasons", "active item", "R2-a options"]}
      />
      <ThemePanels>
        {ROLES.map((role) => (
          <Demo key={role} title={ROLE_LABEL[role]}>
            {(role === "coordinator" ? MOMENTS.slice(0, 1) : MOMENTS).map((m) => (
              <figure key={m.facts} className="flex flex-col gap-2">
                <figcaption className="font-mono text-xs text-muted-foreground">{role === "coordinator" ? "No locked items" : m.label}</figcaption>
                <SidebarFrame role={role} facts={m.facts} />
              </figure>
            ))}
          </Demo>
        ))}
        <Demo title="R2-a: option A (brand, recommended) and option B (neutral, v0.2)">
          <figure className="flex flex-col gap-2">
            <figcaption className="font-mono text-xs text-muted-foreground">A: brand</figcaption>
            <SidebarFrame role="student" facts="milestone3" look="brand" />
          </figure>
          <figure className="flex flex-col gap-2">
            <figcaption className="font-mono text-xs text-muted-foreground">B: neutral</figcaption>
            <SidebarFrame role="student" facts="milestone3" look="neutral" />
          </figure>
        </Demo>
      </ThemePanels>
    </>
  );
}
