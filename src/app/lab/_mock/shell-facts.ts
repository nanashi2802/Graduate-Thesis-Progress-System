// Lab only (Task R2.1): mock sidebar facts and role labels. Plain data, so server pages and the client demo share it.
import { NO_FACTS, type NavFacts, type NavRole } from "@/components/patterns/sidebar/nav";

export const ROLE_LABEL: Record<NavRole, string> = { student: "Student", adviser: "Adviser", panel_member: "Panel Member", coordinator: "Coordinator" };
export const ROLES = Object.keys(ROLE_LABEL) as NavRole[];

export const FACTS = {
  firstDay: { ...NO_FACTS, milestone: 1, milestoneId: "m-1", prId: "pr-1" },
  milestone3: { ...NO_FACTS, milestone: 3, milestoneId: "m-3", prId: "pr-3", gate1bDone: true, defenseId: "d-3", panelAccess: true, defenseStarted: false },
  afterDefense: { ...NO_FACTS, milestone: 3, milestoneId: "m-3", prId: "pr-3", gate1bDone: true, defenseId: "d-3", sheetsVerified: true, panelAccess: true, defenseStarted: true },
} satisfies Record<string, NavFacts>;
export type FactsName = keyof typeof FACTS;
