# Glossary — PUP CpE Thesis Progress Monitoring System

The domain terms and the design terms of this project. One word for one meaning. The rules for using the terms are in `AGENTS.md` §8. The process facts come from the Unified Thesis Process v1.1.

## People and groups

**Panel Member**
A faculty member who reviews and evaluates a thesis. A role. Never "Evaluator". The Adviser is never a Panel Member.

**Evaluation Committee**
The Adviser and the Panel Members who review the manuscript and evaluate the Proposal and Pre-Final defenses. 2 Panel Members for Master's, 3 for Doctoral.

**Final Panel**
The Panel Members named on TDW 11 for the Final Defense. 3 for Master's, 4 for Doctoral, plus the Panel Chair. They are usually the same people as the Evaluation Committee Panel Members. The Adviser is not on the Final Panel.

**Lead Panel Member**
A designation, not a role. The Evaluation Committee Panel Member who records the collective verdict at Proposal and Pre-Final.

**Panel Chair**
A designation, not a role. The chair of the Final Panel.

## Design

**Guided Ledger**
The name of the project's design principle set (DESIGN.md §2). "Ledger": the screen is an index of the paper record. "Guided": the system shows each user the next step.

**Teach at the edges**
The Guided Ledger rule for help text (DESIGN.md §2.1). Teaching text appears only in empty and first-day states, in the reason next to a disabled action, and in dialogs. Working surfaces carry labels, not sentences.

**Domain glyph**
A custom icon for a thesis concept, such as scan, verify, Return, committee seat or defense (DESIGN.md §6.2). Stock icons (Lucide) are only for generic UI. No glyph uses a shape from the PUP logo.

**Pattern**
A reusable screen part with a fixed props contract, in `src/components/patterns/<name>/` (DESIGN.md §7). A page uses patterns only. To change the look of many screens, change one pattern.

## Screen regions

**Card**
A bordered region of a screen. A screen has at most 3 cards. Never call a card a "panel", because "panel" means the Final Panel or a Panel Member.

**Identity line**
The first line of a record screen. It names whose thesis the screen shows: the thesis title, the degree level, the Adviser and the committee.

**Docket**
The card that answers three questions: where am I, what blocks me, and what can I do now.

## Screens and documents

**Thesis process**
The Student's screen that shows the whole thesis process: Proposal, Pre-Final, Final and Clearance. Each step lists its gates and its forms. Only the Student sees it.

**Blank form**
The empty official TDW form that a person downloads, fills in and signs on paper. Different from a scan, which is the signed form uploaded back into the system.

**Advising forms**
TDW 01, TDW 04 and TDW 02: the forms done before Milestone 1, when the Adviser is appointed. The Student may upload a copy for the record. Uploading is optional, and the Coordinator does not verify it. Never call them "Preliminaries", because that word means the front matter of the manuscript (TDW 10).

**Return reason**
The free-text message that a person writes when they Return a document or a manuscript. The receiver sees it word for word. A Coordinator's Return reason concerns compliance or eligibility only (BR-13). No preset reasons.

**Verify**
The Coordinator's decision that a scanned document is final and matches the signed paper. Verify locks the document (BR-19). The other decision is Return.

**Relevant**
What a user sees: only the forms, steps and records of their own degree level, their current milestone and their own role. Earlier milestones show as a completed history. Later milestones show only on the Thesis process screen.
