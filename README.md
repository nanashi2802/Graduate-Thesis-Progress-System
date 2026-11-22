<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->
[![CI][ci-shield]][ci-url]
[![Issues][issues-shield]][issues-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">

<h3 align="center">ThesIsko</h3>

  <p align="center">
    PUP CpE Thesis Progress System. A role-separated system that monitors thesis progress for the PUP Graduate School, Department of Computer Engineering (MSCpE and D.Eng with CpE Specialization).
    <br />
    <a href="spec/PRD.md"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="design/stitch/document-ingestion-processor/code.html">View Prototype</a>
    &middot;
    <a href="https://github.com/nanashi2802/Graduate-Thesis-Progress-System/issues/new?labels=bug">Report Bug</a>
    &middot;
    <a href="https://github.com/nanashi2802/Graduate-Thesis-Progress-System/issues/new?labels=enhancement">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#core-architecture">Core Architecture</a></li>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li>
      <a href="#usage">Usage</a>
      <ul>
        <li><a href="#prototype">Prototype</a></li>
        <li><a href="#demo-personas">Demo Personas</a></li>
        <li><a href="#documentation">Documentation</a></li>
      </ul>
    </li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->
## About The Project

ThesIsko tracks the thesis progress of PUP CpE Master's and Doctoral Students through 3 milestones and post-defense clearance.

The Student submits a versioned manuscript. The Adviser and the Evaluation Committee review specific revisions through commit-anchored Critique Threads. Strict gates control progression from one milestone to the next.

### Core Architecture

**The 3-milestone and clearance model.** Stage 0 (concept paper, enrollment, units) occurs outside the system.

| Milestone | Scope | Forms | Ends when |
| :---- | :---- | :---- | :---- |
| 1. Proposal Defense | Writing 1 (RSH 641/741) | TDW 03, 05, 06, 07, 08 | `CERTIFIED` and the Adviser approves data gathering |
| 2. Pre-Final Defense | Writing 2, first defense. Needs IPMO similarity check `PASSED`. | TDW 03, 09, 10 | `CLOSED` |
| 3. Final Defense and Clearance | Writing 2, second defense and clearance | TDW 03, 11, 12, 13 | `CLEARED` |

**One role per account (`BR-03`).** Each account has exactly one role:

- **Student:** The candidate. Owns one Thesis Instance.
- **Adviser:** The faculty member who directs the Student. Never a Panel Member.
- **Panel Member:** A member of the Evaluation Committee (2 for Master's, 3 for Doctoral). The Final Panel has 3 for Master's and 4 for Doctoral, plus the Panel Chair. Never an Adviser.
- **Coordinator:** The Program Chair and Graduate School Secretary. The only role that closes a stage and verifies official records.
- **Designations** (set per thesis, not roles):
  - *Lead Panel Member:* records the collective verdict at the Proposal and Pre-Final Defenses.
  - *Panel Chair:* completes TDW 13 and records the collective verdict at the Final Defense.

**Gates and document lifecycle.**

- **Two-layer approval (`BR-01`):** A system action shows intent. The wet-signed paper is the legal record.
- **Gate 1a:** The Adviser endorses a Ready commit for committee review. Open Adviser threads block it. In Milestone 2, it stays blocked until IPMO is `PASSED`.
- **Gate 1b:** The Adviser and all Panel Members endorse it unanimously. The manuscript then locks (`BR-07`).
- **Defense scheduling:** The Student proposes a date from the common free dates. The date is at least 7 days after Gate 1b (`BR-09`). The Coordinator confirms the room or link.
- **Defense day:** The defense opens at the scheduled start (`BR-10`). Each member encodes an evaluation. The collective verdict is recorded on or after the defense date.
- **Gate 2 (Milestone 3 only):** The committee and the Final Panel sign the approval sheet. This needs IPMO `PASSED`, RPO `DONE` and all threads resolved.
- **Clearance:** The Coordinator verifies 7 items before granting `CLEARED`: IPMO, RPO, Gate 2, copyright, hardbound copies, conference presentation certificate and journal publication.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

All services use free tiers only. Full stack and limits: [`spec/PRD.md`](spec/PRD.md) §11.2.

| Layer | Choice |
| :---- | :---- |
| Framework | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) (strict) |
| Hosting and daily job | [Vercel](https://vercel.com/) Hobby, Vercel Cron |
| Database, sign-in, files | [Neon](https://neon.com/) Postgres, Neon Auth, Neon Object Storage |
| Email | [Resend](https://resend.com/), React Email |
| UI | [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Lucide](https://lucide.dev/) |
| Tests and CI | [Vitest](https://vitest.dev/), [Playwright](https://playwright.dev/), GitHub Actions |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

**Status:** Phase 0 technical spike. The app is a scaffold only.

### Prerequisites

- Node.js 22 or newer
- pnpm (version in `package.json` `packageManager`). Do not use npm or yarn.

### Installation

1. Clone the repository.
   ```sh
   git clone https://github.com/nanashi2802/Graduate-Thesis-Progress-System.git
   ```
2. Turn on the commit hook (once per clone).
   ```sh
   git config core.hooksPath .githooks
   ```
3. Install the dependencies.
   ```sh
   pnpm install
   ```
4. Install the Playwright browser (once per machine).
   ```sh
   pnpm exec playwright install chromium
   ```
5. Copy the environment file, then fill in the values.
   > **Warning:** Never commit `.env.local`.
   ```sh
   cp .env.example .env.local
   ```
6. Start the app at http://localhost:3000.
   ```sh
   pnpm dev
   ```

All commands (lint, type check, tests, build): [`AGENTS.md`](AGENTS.md) §12.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE -->
## Usage

### Prototype

> **Prototype only. Not a reference.** The screens are the initial design from Google Stitch. They are not a source for the design, the process or the system behavior. Use [`DESIGN.md`](DESIGN.md), the `spec/` files and the `docs/` files instead. See [`design/stitch/README.md`](design/stitch/README.md).

Open [`design/stitch/document-ingestion-processor/code.html`](design/stitch/document-ingestion-processor/code.html) in a modern browser. It needs no build or install step.

- **Persona switcher** (bottom right): switch between the 6 demo accounts. Each account has one role (`BR-03`).
- **Features:** 30 routes, Gate 1a and 1b endorsements, the locked manuscript (`BR-07`), defense date proposal, TDW 08, 10 and 13 rubrics, collective verdicts, stage close, clearance checklists, notifications, preferences and global search (<kbd>Ctrl</kbd>+<kbd>K</kbd>).

The 30 routes are also in 28 standalone files. Start at the [screen directory](design/stitch/document-ingestion-processor/screens/index.html).

| Portal | Screens |
| :---- | :---- |
| Student | [S1 Dashboard](design/stitch/document-ingestion-processor/screens/student/s1_dashboard.html) · [S2 Manuscript](design/stitch/document-ingestion-processor/screens/student/s2_manuscript.html) · [S3 Documents](design/stitch/document-ingestion-processor/screens/student/s3_documents.html) · [S4 Schedule](design/stitch/document-ingestion-processor/screens/student/s4_schedule.html) · [S5 Defense Results](design/stitch/document-ingestion-processor/screens/student/s5_defense_results.html) · [S6 Clearance](design/stitch/document-ingestion-processor/screens/student/s6_clearance.html) |
| Adviser | [A1 Dashboard](design/stitch/document-ingestion-processor/screens/adviser/a1_dashboard.html) · [A2 Review and Gate 1a](design/stitch/document-ingestion-processor/screens/adviser/a2_review.html) · [A3 Consultations (TDW 03)](design/stitch/document-ingestion-processor/screens/adviser/a3_consultations.html) · [A4 Availability](design/stitch/document-ingestion-processor/screens/adviser/a4_availability.html) · [A5 Defense](design/stitch/document-ingestion-processor/screens/adviser/a5_defense.html) |
| Panel Member | [P1 Dashboard](design/stitch/document-ingestion-processor/screens/panel/p1_dashboard.html) · [P2 Manuscript and Gate 1b](design/stitch/document-ingestion-processor/screens/panel/p2_manuscript.html) · [P3 Availability](design/stitch/document-ingestion-processor/screens/panel/p3_availability.html) · [P4 Defense and Verdict](design/stitch/document-ingestion-processor/screens/panel/p4_defense.html) |
| Coordinator | [C1 Dashboard](design/stitch/document-ingestion-processor/screens/coordinator/c1_dashboard.html) · [C2 Students](design/stitch/document-ingestion-processor/screens/coordinator/c2_students.html) · [C3 Committees](design/stitch/document-ingestion-processor/screens/coordinator/c3_committees.html) · [C4 Compliance](design/stitch/document-ingestion-processor/screens/coordinator/c4_compliance.html) · [C5 Schedule](design/stitch/document-ingestion-processor/screens/coordinator/c5_schedule.html) · [C6 Defense and Stage Close](design/stitch/document-ingestion-processor/screens/coordinator/c6_defense.html) · [C7 Clearance](design/stitch/document-ingestion-processor/screens/coordinator/c7_clearance.html) · [C8 Templates](design/stitch/document-ingestion-processor/screens/coordinator/c8_templates.html) · [C9 Users](design/stitch/document-ingestion-processor/screens/coordinator/c9_users.html) · [C10 Audit Trail](design/stitch/document-ingestion-processor/screens/coordinator/c10_audit.html) |
| Shared | [SV Submission View](design/stitch/document-ingestion-processor/screens/shared/submission_view.html) · [Sign-In](design/stitch/document-ingestion-processor/screens/auth/login.html) |

### Demo Personas

All personas are fake data.

| Account | Role | Degree or rank | Default view | Sample context |
| :---- | :---- | :---- | :---- | :---- |
| **Juan Dela Cruz** | Student | Master's (MSCpE) | `/student/dashboard` | *EchoWood*. Milestone 1, Gate 1b done, proposing a defense date. |
| **Engr. Liza Navarro, PECE** | Student | Doctoral (D.Eng - CpE) | `/student/dashboard` | *Urban Estero Telemetry*. Milestone 3, defense held, in clearance. |
| **Dr. Elena C. Reyes, PECE** | Adviser | Professor VI | `/adviser/dashboard` | Advisee roster, Gate 1a queue, consultation log |
| **Engr. Marco V. Santos, PECE, Ph.D.** | Panel Member | Associate Professor IV | `/panel/dashboard` | Lead Panel Member (M1) and Panel Chair (M3). Encodes rubrics and verdicts. |
| **Dr. Clara M. Mendoza** | Panel Member | Professor III | `/panel/dashboard` | Cognate specialist. Reads manuscripts and evaluates. |
| **Dr. Arturo S. Cruz** | Coordinator | Program Chair and GS Secretary | `/coordinator/dashboard` | Program overview, accounts, compliance, defense verification, clearance |

### Documentation

The governing documents are in [`docs/`](docs/) and [`spec/`](spec/). The agent rules are in [`AGENTS.md`](AGENTS.md). `CLAUDE.md` points to it.

| Document | Role |
| :---- | :---- |
| [`spec/PRD.md`](spec/PRD.md) | Goals, scope, stack, risks, decision log |
| [`spec/USERFLOW.md`](spec/USERFLOW.md) | Journey, 14-step defense cycle, role flows, exceptions |
| [`spec/SITEMAP.md`](spec/SITEMAP.md) | 30 routes, navigation, screens, access rules |
| [`spec/DFD.md`](spec/DFD.md) | Data flow diagram: elements, flows, trust boundaries |
| [`spec/ERD.md`](spec/ERD.md) | Data model: tables, enums, invariants, state machines |
| [`spec/BUILD_PLAN.md`](spec/BUILD_PLAN.md) | Build phases, epics and tasks |
| [`DESIGN.md`](DESIGN.md) | Design system: colors, type, layout, components, tokens |
| [Functional Requirements v1.1](docs/PUP_CpE_Thesis_Progress_System_Functional_Requirements_v1.1.md) | FR, BR, NFR and AS IDs. The spec. |
| [Operational Flow, DFD and Sitemap v3.1](docs/PUP_CpE_Thesis_Progress_System_Operational_Flow_DFD_Sitemap_v3.1.md) | Process, data flows, 30 routes |
| [Unified Thesis Process v1.1](docs/PUP_CpE_Thesis_Progress_System_Unified_Thesis_Process_v1.1.md) | Source of truth for the thesis process |

If two documents disagree, the Unified Thesis Process wins for process rules. The Functional Requirements win for system behavior. The old documents in [`docs/stale/`](docs/stale/) are history only. Do not use them as a source.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ROADMAP -->
## Roadmap

Full plan and progress: [`spec/BUILD_PLAN.md`](spec/BUILD_PLAN.md).

- [ ] **Phase 0: Technical spike.** Prove that the free-tier stack works for the hard parts.
    - [x] P0-E01 Scaffold and tooling
    - [ ] P0-E02 Database and data layer
    - [ ] P0-E03 Sign-in
    - [ ] P0-E04 Files: signed upload, hash check, PDF view
    - [ ] P0-E05 Deploy, daily job and email
    - [ ] P0-E06 Measure and report
- [ ] **Phase 1: Foundation and Milestone 1.** One Student completes the Proposal Defense and reaches `CERTIFIED`.
- [ ] **Phase 2: Milestone 2 and email.** One Student completes the Pre-Final Defense.
- [ ] **Phase 3: Milestone 3 and clearance.** One Student reaches `CLEARED`.
- [ ] **Phase 4: Enhancements.** The owner picks items by value.

See the [open issues](https://github.com/nanashi2802/Graduate-Thesis-Progress-System/issues) for proposed features and known issues.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->
## Contributing

Read [`AGENTS.md`](AGENTS.md) before you contribute. It holds all the rules for people and agents.

1. Turn on the commit hook: `git config core.hooksPath .githooks`.
2. Make a branch from `dev`. Do not push to `main` or `master`.
3. Name the FR, BR and AS IDs that your change touches.
4. Run `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm test:e2e`.
5. Write a short commit message that names the IDs. Add no AI author or co-author lines (`AGENTS.md` §2).
6. Open a pull request.

> **Warning:** Use fake data only. Never commit secrets, real student data, manuscripts or signed forms (`AGENTS.md` §11).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->
## License

`[CONFIRM]` No license is chosen yet. Until the owner adds a `LICENSE` file, all rights are reserved.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->
## Contact

Project owner: [@nanashi2802](https://github.com/nanashi2802)

Project link: [https://github.com/nanashi2802/Graduate-Thesis-Progress-System](https://github.com/nanashi2802/Graduate-Thesis-Progress-System)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

- [PUP Graduate School](https://www.pup.edu.ph/gs/): the TDW forms and the Guidelines on Thesis and Dissertation Writing ([`docs/reference/`](docs/reference/))
- [Google Stitch](https://stitch.withgoogle.com/): the initial prototype screens
- [Best-README-Template](https://github.com/othneildrew/Best-README-Template): the structure of this file
- [Shields.io](https://shields.io/): the badges

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
[ci-shield]: https://img.shields.io/github/actions/workflow/status/nanashi2802/Graduate-Thesis-Progress-System/ci.yml?style=for-the-badge&label=CI
[ci-url]: https://github.com/nanashi2802/Graduate-Thesis-Progress-System/actions/workflows/ci.yml
[issues-shield]: https://img.shields.io/github/issues/nanashi2802/Graduate-Thesis-Progress-System.svg?style=for-the-badge
[issues-url]: https://github.com/nanashi2802/Graduate-Thesis-Progress-System/issues
