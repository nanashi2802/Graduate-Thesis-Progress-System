// The demos of /lab/patterns/<name>: every variant and state of one pattern (Task R1.4).
// Static routes, one folder for each pattern: the dev server failed on a dynamic route (UX-037).
// Mock data only: fake names, no server import (eslint rule for src/app/lab).
import type { ReactNode } from "react";
import { BlockedAction } from "@/components/patterns/blocked-action";
import { Docket } from "@/components/patterns/docket";
import { EmptyState } from "@/components/patterns/empty-state";
import { Flag } from "@/components/patterns/flag";
import { IdentityLine } from "@/components/patterns/identity-line";
import { DocumentStamp, MilestoneStatusPill, OutsideChip, formLabel, gateLabel } from "@/components/patterns/status";
import { Stepper } from "@/components/patterns/stepper";
import { ThemeToggle } from "@/components/patterns/theme-toggle";
import { formatPht, formatPhtRange } from "@/lib/date";
import { Demo, LabHeader, ThemePanels } from "./panels";

const SAMPLE = new Date("2027-01-12T01:00:00Z");

export const PATTERNS: Record<string, { title: string; states: string[]; body: ReactNode }> = {
  status: {
    title: "Status: pill, document stamp, outside chip",
    states: ["13 milestone statuses", "6 document states", "outside chips", "labels for codes (UX-016)", "PHT dates (UX-021)"],
    body: (
      <>
        <Demo title="Milestone status pill">
          {(["DRAFT", "READY", "ADVISER_ENDORSED", "COMMITTEE_APPOINTED", "COMMITTEE_ENDORSED", "DATE_PROPOSED", "DEFENSE_SCHEDULED", "DEFENSE_HELD", "CLOSED", "CERTIFIED", "FINAL_APPROVED", "CLEARED", "RETURNED"] as const).map((s) => (
            <MilestoneStatusPill key={s} status={s} />
          ))}
        </Demo>
        <Demo title="Document stamp (hugs its content, UX-015)">
          <DocumentStamp form="TDW_03" state="not_started" />
          <DocumentStamp form="TDW_07" state="prepared" />
          <DocumentStamp form="TDW_11" state="scan_uploaded" />
          <DocumentStamp form="TDW_12" state="locked_as_submitted" />
          <DocumentStamp form="OR" state="verified" />
          <DocumentStamp form="SIGNED_FINAL_MANUSCRIPT" state="returned" />
          <DocumentStamp form="CONFERENCE_CERT" state="not_started" />
        </Demo>
        <Demo title="Outside chip (dashed: set by the Coordinator)">
          <OutsideChip kind="ethics" value="NOT_SUBMITTED" />
          <OutsideChip kind="ipmo" value="UNDER_CHECK" />
          <OutsideChip kind="rpo" value="DONE" />
          <OutsideChip kind="copyright" value="CHANGES_REQUIRED" />
        </Demo>
        <Demo title="Labels for codes and dates">
          <ul className="flex flex-col gap-1 text-sm">
            <li>{gateLabel("gate_1b")}: Endorsed, {formatPht(SAMPLE)}</li>
            <li>{gateLabel("date_confirmation")}: Recorded</li>
            <li>{gateLabel("stage_close")}: Recorded</li>
            <li>{formLabel("JOURNAL_PUB")} · {formLabel("TDW_10")}</li>
            <li className="font-mono text-[13px]">{formatPhtRange(SAMPLE, new Date("2027-01-12T02:00:00Z"))}</li>
          </ul>
        </Demo>
      </>
    ),
  },
  "blocked-action": {
    title: "Blocked action (BR-18)",
    states: ["open", "blocked with a reason", "primary, secondary, return, text", "default, compact, defense sizes"],
    body: (
      <>
        <Demo title="Open">
          <BlockedAction>Endorse (Gate 1b)</BlockedAction>
          <BlockedAction variant="secondary">Download form</BlockedAction>
          <BlockedAction variant="return">Return</BlockedAction>
          <BlockedAction variant="text">See the whole process</BlockedAction>
        </Demo>
        <Demo title="Blocked: neutral look, reason under it (UX-008)">
          <BlockedAction reason="Upload a commit first.">Mark Ready</BlockedAction>
          <BlockedAction variant="secondary" reason="Locked until Gate 1b.">Propose this date</BlockedAction>
          <BlockedAction variant="return" reason="The stage is closed.">Return</BlockedAction>
        </Demo>
        <Demo title="Compact row actions: one width (132 × 32)">
          <BlockedAction size="compact" variant="secondary">Check scan</BlockedAction>
          <BlockedAction size="compact" variant="secondary">Confirm date</BlockedAction>
          <BlockedAction size="compact" variant="secondary" reason="Verified.">Verify</BlockedAction>
        </Demo>
        <Demo title="Defense Day: 48 px">
          <BlockedAction size="defense">Save my evaluation</BlockedAction>
        </Demo>
      </>
    ),
  },
  flag: {
    title: "Flag (BR-17)",
    states: ["line", "compact glyph with the text on hover and focus", "next to an enabled action"],
    body: (
      <>
        <Demo title="Line">
          <Flag>The residency period ends before the target date.</Flag>
        </Demo>
        <Demo title="Compact (Tab to the glyph)">
          <span className="flex items-center gap-2 text-sm">
            Dino Aquino <Flag compact>The printed copies came 2 days late.</Flag>
          </span>
        </Demo>
        <Demo title="The action stays enabled">
          <div className="flex flex-col gap-2">
            <Flag>1 sheet is not saved yet.</Flag>
            <BlockedAction>Record verdict</BlockedAction>
          </div>
        </Demo>
      </>
    ),
  },
  "empty-state": {
    title: "Empty state",
    states: ["title only", "title and body", "with the one action"],
    body: (
      <>
        <EmptyState title="No threads yet." />
        <EmptyState title="No scans are waiting." body="New scans appear here when a Student uploads one." />
        <EmptyState title="No faculty yet." body="Add the Advisers and Panel Members first." action={<BlockedAction>Add faculty</BlockedAction>} />
      </>
    ),
  },
  "identity-line": {
    title: "Identity line (UX-030)",
    states: ["Student's own view", "Adviser and Panel Member view", "Doctoral"],
    body: (
      <>
        <Demo title="Student's own screen">
          <IdentityLine title="A fake study of thesis tracking for graduate programs" degreeLevel="masters" ownView />
        </Demo>
        <Demo title="Record screen of another role (A2, P2, SV)">
          <IdentityLine
            title="A fake study of thesis tracking for graduate programs"
            degreeLevel="masters"
            student="Fake Student"
            adviser="Fake Adviser"
            committee={["Fake Panel Member 1", "Fake Panel Member 2"]}
          />
        </Demo>
        <Demo title="Doctoral">
          <IdentityLine title="Fake doctoral thesis title" degreeLevel="doctoral" student="Fake Student" adviser="Fake Adviser" />
        </Demo>
      </>
    ),
  },
  docket: {
    title: "Docket",
    states: ["first day with the process link", "blocked", "with a form link"],
    body: (
      <div className="flex flex-col gap-6">
        <Docket step={1} milestone="Proposal" status="DRAFT" blocker={null} processLink action={<BlockedAction>Upload the first version</BlockedAction>} />
        <Docket step={2} milestone="Pre-Final" status="READY" blocker="Your Adviser has open comments." action={<BlockedAction reason="Waiting for your Adviser.">Open the manuscript</BlockedAction>} />
        <Docket step={3} milestone="Final" status="DEFENSE_SCHEDULED" blocker={null} action={<BlockedAction>Open the schedule</BlockedAction>} formLink={{ href: "#form", label: "Download TDW 12" }} />
      </div>
    ),
  },
  stepper: {
    title: "Milestone stepper",
    states: ["first day", "Final current", "all done", "compact"],
    body: (
      <>
        <Demo title="First day">
          <Stepper current={1} completed={[]} />
        </Demo>
        <Demo title="Final is the current step">
          <Stepper current={3} completed={[1, 2]} />
        </Demo>
        <Demo title="Cleared">
          <Stepper current={4} completed={[1, 2, 3, 4]} />
        </Demo>
        <Demo title="Compact (queue rows)">
          <Stepper current={2} completed={[1]} compact />
        </Demo>
      </>
    ),
  },
  "theme-toggle": {
    title: "Theme toggle: pill switch (UX-D-01, owner request)",
    states: ["sun when light, moon when dark", "follows the OS until clicked", "Use system after a click", "default and compact sizes"],
    body: (
      <>
        <Demo title="Default">
          <ThemeToggle />
        </Demo>
        <Demo title="Compact (top bar)">
          <ThemeToggle compact />
        </Demo>
      </>
    ),
  },
};

export function PatternLab({ name }: { name: keyof typeof PATTERNS & string }) {
  const p = PATTERNS[name]!;
  return (
    <>
      <LabHeader title={p.title} round="R1 · UX-P-01" states={p.states} />
      <ThemePanels>
        <div className="flex flex-col gap-6">{p.body}</div>
      </ThemePanels>
    </>
  );
}
