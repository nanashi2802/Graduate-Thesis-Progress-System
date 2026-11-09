# SPPQ — PUP CpE Thesis Progress System

A role-separated workspace for one graduate thesis at a time. A student submits a versioned manuscript, the adviser and later the panel leave comments on a specific revision, and a gate has to pass before the next stage opens.

This repository is the frontend prototype and the documents that govern it. Application code has not started.

## Open the prototype

Open [`design/stitch/document-ingestion-processor/code.html`](design/stitch/document-ingestion-processor/code.html) in a browser. It needs a network connection for Tailwind, Inter, JetBrains Mono, and Lucide. There is no install step and no server.

The account switcher sits at the bottom right. Drag it if it covers a control. Click it to change accounts. Each account has one role.

| Account | Role | What you land on |
| --- | --- | --- |
| Juan Dela Cruz | Student | EchoWood, Stage 2, proposal manuscript in review |
| Liza Navarro | Student | Estero flood-sensor thesis, Stage 4, oral defense approved |
| Dr. Elena Reyes | Thesis Adviser | Both advisees, then the manuscript and comment thread |
| Engr. Marco Santos | Panel Member | Lead panelist. Juan’s manuscript stays locked until the adviser endorses it |
| Dr. Clara Mendoza | Panel Member | Same panel pages, without the lead label |
| Prof. Arturo Cruz | Program Coordinator | Program counts, templates, and accounts |

`Graduate Thesis Progress System V1.0.html` in the same folder is an earlier snapshot. `code.html` is the file to open and edit.

## What the prototype already does

- Student pages for the thesis home, deliverables, templates, schedule, and submission.
- Submission opens as a document list. The manuscript row opens the paper and the comment thread. Comments belong to a manuscript revision.
- Adviser review, Gate 1 endorsement when every comment is resolved, and panel reading after that endorsement.
- Panel comments and Gate 2 after a defense result is recorded.
- Consultation booking with the adviser, separate from defense booking. Defense booking stays closed until Gate 1.
- Coordinator views for program counts, the stand-in template library, and committee assignment. One person cannot hold two committee seats.

Account creation, template replacement, sign-in, stored files, and email are shown only where the screen needs the control, and they do not run. The embedded AI checks described in the product note are not on these screens.

The file names follow the PUP Graduate School TDW forms and the 2017 University Thesis and Dissertation Manual. They are a stand-in. CpE has not issued its own packet, and these screens are not copies of the official forms.

## Read before changing the product

1. [`docs/Graduate Thesis Progress System.md`](docs/Graduate%20Thesis%20Progress%20System.md) — what the system is, who it is for, and the open process questions.
2. [`docs/governing/PUP CpE Thesis Progress System - Architectural Scratchpad.md`](docs/governing/PUP%20CpE%20Thesis%20Progress%20System%20-%20Architectural%20Scratchpad.md) — glossary, ADR-001 through ADR-010, and functional requirements.
3. [`docs/governing/PUP CpE Thesis Progress System - Operational Flow & Tech Stack Specification.md`](docs/governing/PUP%20CpE%20Thesis%20Progress%20System%20-%20Operational%20Flow%20%26%20Tech%20Stack%20Specification.md) — stages 0–6 and the technology mapping.
4. [`docs/governing/PUP CpE Thesis Progress System - SITEMAP & Frontend Specification.md`](docs/governing/PUP%20CpE%20Thesis%20Progress%20System%20-%20SITEMAP%20%26%20Frontend%20Specification.md) — routes, accounts, and screen contracts.

When those sources overlap, the sitemap screen contracts and the later architectural decisions govern the prototype. The product note governs what the system is for and which questions are still open.

## Still unresolved

The mentorship loop can be demonstrated. The institutional loop cannot be locked until the program answers the five gaps in the product note:

- Whether the lead panelist can approve anything the other panelists cannot.
- Who confirms a defense date and room, and whether a payment receipt is required first.
- Who collects the paper evaluation sheet and who encodes the verdict.
- Whether Gate 2 needs every panelist, or the chair or the adviser alone.
- Which hardbound copy or clearance receipt closes the thesis.

The later application stack named in the specifications is Next.js, React, TypeScript, Tailwind CSS, Supabase, an event worker, Resend, and the Vercel AI SDK. That stack is a plan, not a build in this repository.
