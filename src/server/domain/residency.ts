// Residency end date and warning (FR-WFL-12, BR-17, ERD §4.2, R7). Pure code.
// The 5 and 7 year values are unverified (R7). The warning never blocks an action (BR-17).
import type { PstDate } from "./milestone";

export const RESIDENCY_YEARS = { masters: 5, doctoral: 7 } as const;
export const RESIDENCY_WARNING_DAYS = 90;

export type Residency = { endDate: PstDate; daysLeft: number; warning: boolean };

/** The term reads like "2025-1". The end date is 31 December of the start year plus the limit (AD-B-027). */
export function residency(degreeLevel: keyof typeof RESIDENCY_YEARS, programStartTerm: string, today: PstDate): Residency | null {
  const year = /^(\d{4})(?:\D|$)/.exec(programStartTerm.trim())?.[1];
  if (!year) return null; // A bad start term: no date, no warning.
  const endDate = `${Number(year) + RESIDENCY_YEARS[degreeLevel]}-12-31`;
  const daysLeft = Math.round((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
  return { endDate, daysLeft, warning: daysLeft <= RESIDENCY_WARNING_DAYS };
}
