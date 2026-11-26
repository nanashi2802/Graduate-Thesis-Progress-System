// The content of the Thesis process screen (PROCESS, design/screens/PROCESS.md, FR-TRK-01, FR-DOC-01, Task R4.3).
// Plain data, no React and no server import: the live page (R4.6) and /lab use the same text.
// Source of the process: the Unified Thesis Process §2.4, §2.5, §2.9 and §2.10. Forms: the default Milestone
// Templates (db/migrations/0003_default_templates.sql). Stage 0 (TDW 01, 04, 02) is not a step: those forms are on S3.
// G2: only the counts of the Student's degree level. The counts are the template v1 defaults.
import type { MilestoneCode, MilestoneStatus } from "@/server/domain/milestone";

export type DegreeLevel = "masters" | "doctoral";

export type ProcessActivity = {
  /** Who acts. "You" is the Student. */
  who: string;
  /** One or two short sentences. A gate or a defense starts with its name. */
  text: string;
  kind?: "gate" | "defense" | "outside";
};

export type ProcessForm = { code: string; name: string };

export type ProcessStep = {
  id: "proposal" | "pre-final" | "final" | "clearance";
  title: "Proposal" | "Pre-Final" | "Final" | "Clearance";
  meta: string;
  activities: ProcessActivity[];
  forms: ProcessForm[];
};

/** Template v1 defaults (migration 0003): Panel Members of the Evaluation Committee, Final Panel members, printed copies. */
export const PROCESS_COUNTS: Record<DegreeLevel, { panelMembers: number; finalPanel: number; printedCopies: number }> = {
  masters: { panelMembers: 2, finalPanel: 3, printedCopies: 5 },
  doctoral: { panelMembers: 3, finalPanel: 4, printedCopies: 6 },
};

/** The names of the blank TDW forms (the default template labels). */
export const FORM_NAMES: Record<string, string> = {
  TDW_03: "Consultation and Monitoring Form",
  TDW_05: "Confidentiality and Non-Disclosure Agreement",
  TDW_06: "Committee Appointment and Acceptance Form",
  TDW_07: "Proposal Defense Endorsement Form",
  TDW_08: "Proposal Evaluation Sheet",
  TDW_09: "Pre-Final Defense Endorsement Form",
  TDW_10: "Pre-Final Defense Evaluation Sheet",
  TDW_11: "Panel on Oral Defense Appointment and Acceptance Form",
  TDW_12: "Final Defense Endorsement Form",
  TDW_13: "Final Defense Evaluation Sheet",
};

const forms = (...codes: string[]): ProcessForm[] => codes.map((code) => ({ code, name: FORM_NAMES[code]! }));

export function processSteps(degree: DegreeLevel): ProcessStep[] {
  const n = PROCESS_COUNTS[degree];
  return [
    {
      id: "proposal",
      title: "Proposal",
      meta: "Milestone 1 · Chapters 1 to 3",
      activities: [
        { who: "You", text: "Upload Chapters 1 to 3 and consult your Adviser. Mark one version Ready." },
        { who: "Adviser", text: "Gate 1a. Your Adviser endorses the manuscript for committee review.", kind: "gate" },
        { who: "Coordinator", text: `Appoints the Evaluation Committee: your Adviser and ${n.panelMembers} Panel Members.` },
        { who: "Committee", text: "Reviews the manuscript. You reply to each comment and upload new versions." },
        { who: "Committee", text: "Gate 1b. Each member endorses. The manuscript locks.", kind: "gate" },
        { who: "You", text: "Choose a date at least 7 days after Gate 1b. Upload the scan of TDW 07 and the Official Receipt." },
        { who: "Coordinator", text: "Checks the documents and the ethics approval. Confirms the date and the room." },
        { who: "You", text: `Hand in ${n.printedCopies} printed copies 7 days before the defense.` },
        { who: "Committee", text: "Proposal Defense. Each member completes TDW 08. The Lead Panel Member records the verdict.", kind: "defense" },
        { who: "Coordinator", text: "Closes the stage. After your revisions, the committee accepts them and the Coordinator records the Certification." },
      ],
      forms: forms("TDW_03", "TDW_05", "TDW_06", "TDW_07", "TDW_08"),
    },
    {
      id: "pre-final",
      title: "Pre-Final",
      meta: "Milestone 2 · Chapters 1 to 5",
      activities: [
        { who: "You", text: "Gather data. Upload Chapters 1 to 5 and consult your Adviser." },
        { who: "You", text: "Run the similarity check and send the manuscript to the IPMO.", kind: "outside" },
        { who: "Adviser", text: "Gate 1a. Your Adviser endorses the manuscript. The IPMO check must pass first.", kind: "gate" },
        { who: "Committee", text: "The same committee reviews the manuscript. There is no new appointment." },
        { who: "Committee", text: "Gate 1b. Each member endorses. The manuscript locks.", kind: "gate" },
        { who: "You", text: "Choose a date. Upload the scan of TDW 09 and the Official Receipt." },
        { who: "Coordinator", text: "Checks the documents. Confirms the date and the room." },
        { who: "You", text: "Hand in the printed copies 7 days before the defense." },
        { who: "Committee", text: "Pre-Final Defense. Each member completes TDW 10. The Lead Panel Member records the verdict.", kind: "defense" },
        { who: "Coordinator", text: "Closes the stage and lists the revision items." },
      ],
      forms: forms("TDW_03", "TDW_09", "TDW_10"),
    },
    {
      id: "final",
      title: "Final",
      meta: "Milestone 3 · Revised full manuscript",
      activities: [
        { who: "You", text: "Revise the full manuscript and consult your Adviser. Mark one version Ready." },
        { who: "Adviser", text: "Gate 1a. Your Adviser endorses the manuscript.", kind: "gate" },
        { who: "Coordinator", text: `Appoints the Final Panel of ${n.finalPanel} members, with the Panel Chair.` },
        { who: "Committee", text: "Gate 1b. Each member accepts the Pre-Final revisions and endorses. The manuscript locks.", kind: "gate" },
        { who: "You", text: "Choose a date. Upload the scan of TDW 12 and the Official Receipt." },
        { who: "Coordinator", text: "Checks the documents. Confirms the date and the room." },
        { who: "You", text: "Hand in the printed copies 7 days before the defense." },
        { who: "Final Panel", text: "Final Defense. Each member completes TDW 13. The Panel Chair records the verdict.", kind: "defense" },
        { who: "Coordinator", text: "Closes the defense. The manuscript unlocks." },
      ],
      forms: forms("TDW_03", "TDW_05", "TDW_11", "TDW_12", "TDW_13"),
    },
    {
      id: "clearance",
      title: "Clearance",
      meta: "Milestone 3 · After the Final Defense",
      activities: [
        { who: "You", text: "Revise with the Defense Day comments. Each Panel Member resolves their own threads." },
        { who: "You", text: "Send the manuscript to the IPMO for the similarity check.", kind: "outside" },
        { who: "Coordinator", text: "Endorses the manuscript to the RPO for editing. You revise after the editing.", kind: "outside" },
        { who: "Committee", text: "Gate 2. Each member approves the final manuscript. The IPMO and RPO steps must be complete.", kind: "gate" },
        { who: "You", text: "Apply for copyright registration.", kind: "outside" },
        { who: "You", text: "Give the final copy to the Coordinator. Upload the conference certification and the journal publication." },
        { who: "Coordinator", text: "Verifies each item and records Cleared." },
      ],
      forms: [],
    },
  ];
}

export type ProcessPosition = { current: 1 | 2 | 3 | 4 | null; completed: number[] };

const STEP: Record<MilestoneCode, 1 | 2 | 3> = { proposal: 1, pre_final: 2, final: 3 };

/** The current step and the done steps. The same rule as the S1 stepper: Clearance is current at FINAL_APPROVED. */
export function processPosition(code: MilestoneCode, status: MilestoneStatus): ProcessPosition {
  if (code === "final" && status === "CLEARED") return { current: null, completed: [1, 2, 3, 4] };
  const current = code === "final" && status === "FINAL_APPROVED" ? 4 : STEP[code];
  return { current, completed: Array.from({ length: current - 1 }, (_, i) => i + 1) };
}
