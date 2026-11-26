// Mock data of the R5 patterns (Task R5.1 to R5.8): commits, threads and gate checks of one fake Proposal manuscript.
// Mock data only: fake text, no server import (eslint rule for src/app/lab). Authors are role words, the same as the
// data today (ThreadView has the role, not the name).
import type { CommitEntry } from "@/components/patterns/commit-selector";
import type { GateCheck } from "@/components/patterns/gate-box";
import type { FeedThread } from "@/components/patterns/thread-feed";

export type LabRole = "student" | "adviser" | "panel";
export type LabState = "first-day" | "working" | "ready" | "locked";

export const LAB_ROLES: LabRole[] = ["student", "adviser", "panel"];
export const LAB_STATES: LabState[] = ["first-day", "working", "ready", "locked"];

const sha = (seed: string) => (seed.repeat(64) + "0".repeat(64)).slice(0, 64);

export const COMMITS: CommitEntry[] = [
  { id: "c1", ordinal: 1, sha256: sha("9f2c41"), uploadedAt: new Date("2027-01-04T02:10:00Z"), uploader: "Student", changeNote: "First full draft" },
  { id: "c2", ordinal: 2, sha256: sha("4be07a"), uploadedAt: new Date("2027-01-08T06:30:00Z"), uploader: "Student", changeNote: "Chapter 3 rewritten after the Adviser review" },
  { id: "c3", ordinal: 3, sha256: sha("d81f5c"), uploadedAt: new Date("2027-01-12T09:15:00Z"), uploader: "Student", changeNote: "Table 4 units, reference list order" },
  { id: "c4", ordinal: 4, sha256: sha("17aa93"), uploadedAt: new Date("2027-01-15T01:45:00Z"), uploader: "Student", changeNote: "Figure 2 redrawn" },
];

/** The commits as each role sees them: "You" on the Student's own screen. */
export const commitsFor = (role: LabRole, n = COMMITS.length): CommitEntry[] =>
  COMMITS.slice(0, n).map((c) => ({ ...c, uploader: role === "student" ? "You" : "Student" }));

const LONG_BODY =
  "The research questions in Chapter 1 and the methods in Chapter 3 do not line up. Question 2 asks about latency under load, but the test plan measures throughput only. Add a latency test, or narrow the question.";

/** The threads of the working state. `own` and `canResolve` depend on the viewer (BR-05). */
export function threadsFor(role: LabRole): FeedThread[] {
  const adviserOwn = role === "adviser";
  const panelOwn = role === "panel";
  return [
    {
      id: "t1",
      commitOrdinal: 4,
      author: "Adviser",
      context: "iteration",
      state: "OPEN",
      page: 14,
      body: "Table 4 has no units on the second column. Add ms or s.",
      outdated: false,
      addressedBy: [],
      replies: [{ id: "r1", author: "Student", body: "The values are in ms. I add the unit in the next commit." }],
      own: adviserOwn,
      canResolve: adviserOwn,
    },
    {
      id: "t2",
      commitOrdinal: 3,
      author: "Adviser",
      context: "iteration",
      state: "OPEN",
      page: null,
      body: LONG_BODY,
      outdated: true,
      addressedBy: [4],
      replies: [],
      own: adviserOwn,
      canResolve: adviserOwn,
    },
    {
      id: "t3",
      commitOrdinal: 4,
      author: "Panel Member · Lead Panel Member",
      context: "committee_review",
      state: "OPEN",
      page: 3,
      body: "The scope section names two campuses, but the data comes from one. Say which campus.",
      outdated: false,
      addressedBy: [],
      replies: [],
      own: panelOwn,
      canResolve: panelOwn,
    },
    {
      id: "t4",
      commitOrdinal: 2,
      author: "Adviser",
      context: "iteration",
      state: "RESOLVED",
      page: 27,
      body: "Fix the order of the reference list. Use the order of first citation.",
      outdated: false,
      addressedBy: [3],
      replies: [{ id: "r2", author: "Student", body: "Done in v3." }],
      own: adviserOwn,
      canResolve: false,
    },
    {
      id: "t5",
      commitOrdinal: 1,
      author: "Adviser",
      context: "iteration",
      state: "RESOLVED",
      page: null,
      body: "The abstract is over the word limit.",
      outdated: false,
      addressedBy: [2],
      replies: [],
      own: adviserOwn,
      canResolve: false,
    },
  ];
}

/** The gate checks that the data layer can name today (`checkTransition`, `gate1bBlock`), one row for each. */
export const GATE1A_CHECKS = (pass: boolean): GateCheck[] => [
  { id: "ready", label: "The Student marked v4 Ready", ok: true },
  pass
    ? { id: "threads", label: "Your threads are resolved", ok: true }
    : { id: "threads", label: "Your threads are resolved", ok: false, reason: "You have open threads. Resolve them first." },
];

export const GATE1B_CHECKS = (pass: boolean): GateCheck[] => [
  { id: "gate1a", label: "The Adviser endorsed v4 (Gate 1a)", ok: true },
  pass
    ? { id: "threads", label: "Your threads are resolved", ok: true }
    : { id: "threads", label: "Your threads are resolved", ok: false, reason: "You have open threads. Resolve them first." },
];

export const LOCKED_TEXT = "Locked at Gate 1b on Mon 18 Jan 2027. Unlocks when the defense closes.";
