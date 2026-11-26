// Mock demos of the R4 patterns (Task R4.1 to R4.4): the task list as S1, S3, S6 and C7 will use it, and the
// step-by-step. Mock data only: fake names, no server import (eslint rule for src/app/lab). Server component:
// the actions are elements, so no function crosses into the client patterns.
import { Fragment, type ReactNode } from "react";
import { BlockedAction } from "@/components/patterns/blocked-action";
import { EmptyState } from "@/components/patterns/empty-state";
import type { Step } from "@/components/patterns/step-by-step";
import type { TaskGroup } from "@/components/patterns/task-list";
import { buttonVariants } from "@/components/ui/button";
import { blankFormHref } from "@/lib/forms";
import { cn } from "@/lib/utils";

const RETURN_REASON =
  "The Dean's signature is missing on page 2, and the scan cuts off the bottom of page 3. Scan the full form again after the Dean signs it.";

const download = (code: string) => (
  <a href={blankFormHref(code) ?? "/forms"} download className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
    Download form<span className="sr-only">, {code.replace("_", " ")}</span>
  </a>
);
const upload = (label = "Upload scan") => (
  <button type="button" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
    {label}
  </button>
);
const actions = (...parts: ReactNode[]) => (
  <>
    {parts.map((p, i) => (
      <Fragment key={i}>{p}</Fragment>
    ))}
  </>
);

/** S3 Documents, Proposal milestone, every document state (design/screens/S3.md). */
export function s3Groups(state: "working" | "first-day"): TaskGroup[] {
  const firstDay = state === "first-day";
  return [
    {
      label: "This milestone",
      items: firstDay
        ? [
            { id: "tdw07", stamp: { kind: "document", form: "TDW_07", state: "not_started" }, label: "Proposal Defense Endorsement Form", actions: actions(download("TDW_07"), upload()) },
            { id: "or", stamp: { kind: "document", form: "OR", state: "not_started" }, label: "Official Receipt", actions: actions(upload()) },
            { id: "tdw03", stamp: { kind: "document", form: "TDW_03", state: "not_started" }, label: "Consultation and Monitoring Form", actions: actions(download("TDW_03")), reason: { text: "Your Adviser uploads this form.", kind: "note" } },
            { id: "tdw06", stamp: { kind: "document", form: "TDW_06", state: "not_started" }, label: "Committee Appointment and Acceptance Form", actions: actions(download("TDW_06")), reason: { text: "The Coordinator uploads this form.", kind: "note" } },
          ]
        : [
            {
              id: "tdw07",
              stamp: { kind: "document", form: "TDW_07", state: "returned" },
              label: "Proposal Defense Endorsement Form",
              reason: { text: RETURN_REASON, kind: "returned" },
              actions: actions(download("TDW_07"), upload("Upload new scan")),
            },
            {
              id: "or",
              stamp: { kind: "document", form: "OR", state: "locked_as_submitted" },
              label: "Official Receipt",
              actions: actions(
                <BlockedAction key="u" variant="secondary" size="default" reason="Locked. A replacement needs a Return.">
                  Upload scan
                </BlockedAction>,
              ),
            },
            { id: "tdw03", stamp: { kind: "document", form: "TDW_03", state: "verified" }, label: "Consultation and Monitoring Form", reason: { text: "Your Adviser uploads this form.", kind: "note" } },
            { id: "tdw06", stamp: { kind: "document", form: "TDW_06", state: "scan_uploaded" }, label: "Committee Appointment and Acceptance Form", reason: { text: "The Coordinator uploads this form.", kind: "note" } },
            { id: "tdw08", stamp: { kind: "document", form: "TDW_08", state: "not_started" }, label: "Proposal Evaluation Sheet", reason: { text: "The Coordinator uploads one sheet for each member after the defense.", kind: "note" } },
          ],
    },
    {
      label: "Completed milestones",
      collapsed: true,
      items: [],
      empty: <EmptyState title="No completed milestones yet." body="Each milestone moves here, read only, after the Coordinator closes it." />,
    },
    {
      label: "Advising forms · optional",
      collapsed: true,
      hint: "Optional. Nobody reviews a copy, and a copy never blocks a step.",
      items: [
        { id: "tdw01", stamp: { kind: "document", form: "TDW_01", state: firstDay ? "not_started" : "locked_as_submitted" }, label: "Concept Paper Adviser Endorsement Form", actions: firstDay ? upload("Upload copy") : undefined },
        { id: "tdw04", stamp: { kind: "document", form: "TDW_04", state: "not_started" }, label: "Adviser Appointment and Acknowledgement Form", actions: upload("Upload copy") },
        { id: "tdw02", stamp: { kind: "document", form: "TDW_02", state: "not_started" }, label: "Advising Contract", actions: upload("Upload copy") },
      ],
    },
  ];
}

/** S1 "This milestone": each item with its state, and its reason if it blocks (design/screens/S1.md). */
export const S1_GROUPS: TaskGroup[] = [
  {
    label: "This milestone",
    items: [
      { id: "ms", stamp: { kind: "status", tone: "done", label: "Done" }, label: "Manuscript marked Ready" },
      { id: "g1a", stamp: { kind: "status", tone: "done", label: "Done" }, label: "Gate 1a: Adviser endorsement" },
      { id: "g1b", stamp: { kind: "status", tone: "pending", label: "Waiting" }, label: "Gate 1b: committee endorsement", reason: { text: "Each committee member must endorse.", kind: "note" } },
      { id: "ethics", stamp: { kind: "outside", outside: "ethics", value: "UNDER_REVIEW" }, label: "Ethics review", reason: { text: "Ethics approval is needed before the date confirmation.", kind: "blocks" } },
    ],
  },
];

/** S6 Clearance: outside chips and document stamps, evidence uploads (design/screens/S6.md). */
export const S6_GROUPS: TaskGroup[] = [
  {
    label: "Clearance items",
    items: [
      { id: "ipmo", stamp: { kind: "outside", outside: "ipmo", value: "PASSED" }, label: "IPMO similarity check" },
      { id: "rpo", stamp: { kind: "outside", outside: "rpo", value: "UNDER_EDITING" }, label: "RPO editing" },
      { id: "gate2", stamp: { kind: "status", tone: "pending", label: "Waiting" }, label: "Gate 2: final manuscript approval", reason: { text: "A clearance item is incomplete.", kind: "blocks" } },
      { id: "copyright", stamp: { kind: "outside", outside: "copyright", value: "APPLIED" }, label: "Copyright registration" },
      { id: "final", stamp: { kind: "document", form: "FINAL_COPY", state: "not_started" }, label: "Final copy receipt", reason: { text: "Give the final copy to the Coordinator.", kind: "note" } },
      {
        id: "conf",
        stamp: { kind: "document", form: "CONFERENCE_CERT", state: "returned" },
        label: "Conference presentation certification",
        reason: { text: "The certificate names a different paper title. Upload the certificate for this thesis.", kind: "returned" },
        actions: upload("Upload new evidence"),
      },
      { id: "journal", stamp: { kind: "document", form: "JOURNAL_PUB", state: "not_started" }, label: "Journal publication or acceptance", actions: upload("Upload evidence") },
    ],
  },
];

/** C7 items of one Student: the Coordinator's row actions. One maroon button in the region (G1): the Docket action. */
export const C7_GROUPS: TaskGroup[] = [
  {
    label: "Items · Bea Santos",
    items: [
      {
        id: "conf",
        stamp: { kind: "document", form: "CONFERENCE_CERT", state: "locked_as_submitted" },
        label: "Conference presentation certification",
        actions: actions(
          <button key="v" type="button" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-(--row-action-h) w-(--row-action-w)")}>
            Verify
          </button>,
          <button key="r" type="button" className={cn(buttonVariants({ variant: "return", size: "sm" }), "h-(--row-action-h) w-(--row-action-w)")}>
            Return
          </button>,
        ),
      },
      { id: "journal", stamp: { kind: "document", form: "JOURNAL_PUB", state: "verified" }, label: "Journal publication or acceptance" },
      { id: "ipmo", stamp: { kind: "outside", outside: "ipmo", value: "PASSED" }, label: "IPMO similarity check" },
    ],
  },
];

const body = (lines: string[]) => (
  <ul className="flex list-disc flex-col gap-1 pl-5 text-base text-foreground">
    {lines.map((l) => (
      <li key={l}>{l}</li>
    ))}
  </ul>
);

/** Plain step-by-step demos: step 1 current (first day), step 2 current, all done. */
export function demoSteps(current: 1 | 2 | 3 | 4 | null): Step[] {
  const titles = ["Proposal", "Pre-Final", "Final", "Clearance"];
  return titles.map((title, i) => ({
    id: title.toLowerCase(),
    title,
    meta: `Milestone ${Math.min(i + 1, 3)}`,
    current: current === i + 1,
    done: current === null || i + 1 < current,
    body: body([`What happens in ${title}, in order.`, "Then the forms of the step."]),
  }));
}
