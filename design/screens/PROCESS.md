# PROCESS · Thesis process

**Route:** `/student/process` (new route) · **Role:** Student only · **Density:** comfortable · **FRs:** FR-TRK-01, FR-DOC-01

## Job
Show the whole thesis process, so the Student knows what comes later and which forms each step needs.

## Regions
| # | Region | Pattern | Content |
| :---- | :---- | :---- | :---- |
| 1 | Page title | Title | "Thesis process" and the degree level |
| 2 | Steps | Step-by-step (GOV.UK) | Four steps: Proposal, Pre-Final, Final, Clearance. Each step expands. "You are here" marks the current step. |
| 3 | Inside a step | List | What happens, in order: the gates, who acts, the defense. Then the forms of the step, each with its form number (mono), name and "Download form". |

## States
| State | What shows |
| :---- | :---- |
| Default | The current step is expanded. Other steps are collapsed. |
| Completed steps | A `done` glyph on the step heading |

## Rules
- Stage 0 (the advising forms TDW 01, 04, 02) is not a step. Those forms are on S3 under "Advising forms · optional".
- Show the forms and counts of the Student's degree level only (G2). Example: 2 Panel Members for Master's, 3 for Doctoral.
- "Download form" gives the blank form now and the prefilled form after Phase 4. The control does not change (`DESIGN.md` §8.12).
- Second item in the Student sidebar.
- No action on this page except form downloads.
