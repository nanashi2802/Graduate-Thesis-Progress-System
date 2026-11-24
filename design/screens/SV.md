# SV · Shared submission view

**Routes:** `/student/submission/[id]`, `/adviser/submission/[id]`, `/panel/submission/[id]`, `/coordinator/submission/[id]` · **Roles:** all four · **Density:** comfortable (compact for the Coordinator) · **FRs:** FR-SUB-01 to FR-SUB-05, FR-DOC-10

## Job
Show one read-only record of one Milestone Instance.

## Regions
| # | Region | Pattern | Content |
| :---- | :---- | :---- | :---- |
| 1 | Identity line | Identity line | Thesis title, Student, degree level, milestone, committee |
| 2 | Manuscript | PDF viewer, commit selector | The locked manuscript |
| 3 | Gate record | Ruled list | Each gate: who, when |
| 4 | Documents | Task list, read only | The milestone's documents with their stamps |
| 5 | Defense | Ruled section | Date, room or link, thread counts, Minutes after close |
| 6 | Dossier export | Secondary button | Coordinator only (FR-DOC-10) |

## Rules
- Opens at Gate 1b (FR-SUB-01). Panel Members also need the form and the NDA (BR-08).
- No gate or edit action. A link goes to the user's own workspace.
- Show only documents of the current milestone (G2).
