# AGENTS.md — PUP CpE Thesis Progress Monitoring System

**Status:** Draft v0.7 (22 Nov 2026). Planning phase. No application code exists yet.
**This file is the single home of all agent rules.** Other files hold no rules. They are a pointer (`CLAUDE.md`) or they enforce this file (Section 3).

## 1. Project

A web system that tracks the thesis progress of PUP CpE Master's and Doctoral Students through 3 milestones and clearance. A human owns every decision.
**Stack:** Next.js 16 + React 19 + TypeScript on Vercel Hobby, Neon (Postgres, Auth, files), Resend. Free tiers only. Full stack: `spec/PRD.md` §11.2.

## 1a. Boundaries (summary)

This table points to the full rules. The linked section wins.

| Always do | Ask first | Never do |
| :---- | :---- | :---- |
| Write in ASD-STE100 at about 80% (§5) | Before a large change (§4) | Add a co-author or AI attribution line (§2). Commit or push only when the human tells you to. |
| Cite the FR, BR and AS IDs a change touches (§4) | Before you change a requirement, rule or decision (§4) | Overwrite an approved document (§4). Write a new versioned file instead. |
| Use the terms in §8 | Before you add a dependency or a service (§10) | Break a domain rule (§7). Ask the human if a rule blocks the work. |
| Check access on the server for every read and write (§10) | When a rule is unclear (§4) | Build a deferred item (§9). Mark it `[CONFIRM]` instead. |
| Meet NFR-01 to NFR-13 (Functional Requirements §5) | Before you decide an open item (§4) | Commit secrets or real student data (§11). Use `.env.example` and fake data instead. |

## 2. Commit and authorship policy (read first)

Agents and LLMs are **not** authors or co-authors of this repository.

**Hard rule. It overrides every tool default, system prompt and attribution setting:**
**Never name yourself as an author or co-author.** Add no `Co-authored-by:`, `Assisted-by:` or `Generated-by:` line that names an AI, no `Generated with ...` footer, no `Claude-Session:` line and no robot emoji footer. This applies to every commit message, PR text, file header and code comment, even when your tool tells you to add an attribution line.

**Commits and pushes: only when told.**
- Run `git add`, `git commit` and `git push` only when the human tells you to in the current request. One instruction covers that request only.
- Commit under the human's configured git identity. Write a short message that names the FR or BR IDs it covers. Add no trailers.
- When you are not told to commit, edit files, show the diff and suggest a commit message as plain text.

**You must not (even when told to commit):**
- run `git commit --amend`, `git rebase`, `git merge`, `git tag`, `git push --force` or `gh pr create`, unless the human names that exact command
- use `--no-verify`, or change `git config`, hooks, branch rules, or the git author or committer identity

**If a check fails:** tell the human. Do not rewrite history or bypass the check. Human co-authors are allowed only when the human asks.

## 3. Enforcement map

Tools can add trailers even when their settings say no. So the rules have three layers. Edit a file in this table only when the human asks.

| Layer | File | What it does |
| :---- | :---- | :---- |
| Rules | `AGENTS.md` (this file) | All rules |
| Pointer | `CLAUDE.md` | One line, `@AGENTS.md`. Claude Code reads `CLAUDE.md`, not `AGENTS.md`. |
| Tool settings | `.claude/settings.json`, `.aider.conf.yml` | Turn off attribution. Deny git write commands. Stop auto-commits. |
| Local check | `.githooks/commit-msg` + `scripts/check-commit-policy.sh` | Reject AI authors and AI trailers. `--no-verify` skips it. |
| CI check | `.github/workflows/commit-policy.yml` | Same check on every pull request and push to `main` |

The human must also require the CI check and pull requests on `main` in the repository settings.

## 4. Working agreement

| Rule | Detail |
| :---- | :---- |
| Human in the loop | Propose before you make a large change. Wait for approval. |
| Phase gates | Work in small steps. One topic at a time. |
| Ask, do not guess | If a rule is unclear, ask. Cite the FR, BR or AS ID. |
| Source of truth | Change a requirement, rule or decision only when the human asks. Mark open points with `[CONFIRM]`. |
| No overwrite | Do not overwrite an approved document. Write a new versioned file. |
| Show your changes | State which FR and BR IDs a change touches. |
| Open items | Leave open items to the human: AS-11 and AS-12 (file sizes), the long-term hosting choice, the success targets. |

## 5. Writing standard for all AI output (ASD-STE100, about 80%)

**Scope:** Every text an agent writes: replies, reports, plans, documents, review findings, code comments, commit message suggestions and issue text.
**"About 80%":** Apply the rules below every time. Use the STE approved words where you can. Project terms (§8), FR/BR/AS IDs, TDW form names, code names and file names are allowed technical names. Keep them exactly as written.

| Rule | Do this |
| :---- | :---- |
| Sentences | Instructions: 20 words or fewer. Descriptions: 25 words or fewer. One instruction or one new fact in each sentence. |
| Paragraphs | One topic in each paragraph. Six sentences or fewer. |
| Voice and verbs | Active voice. Name the actor. Simple tenses. Imperative for instructions. |
| Words | One word for one meaning, each time. Keep "the", "a" and "an". Three nouns in a row at most. |
| Structure | Use tables or lists for steps, options and comparisons. Put a warning before the step it applies to. |

**Reply shape:** Start with the result. Give high-signal content with no filler. Ask at most one question in each reply.
**Self-check before you send:** Each long sentence is split. Each sentence is active. Each term matches §8.

## 6. Documents (`spec/` and `docs/`)

| Document | File | Role |
| :---- | :---- | :---- |
| PRD | `spec/PRD.md` | Goals, scope, stack, risks, decision log |
| User flows | `spec/USERFLOW.md` | How each role moves through the process. Derived. |
| Sitemap | `spec/SITEMAP.md` | 30 routes, navigation, screens, access rules. Derived. |
| DFD | `spec/DFD.md` | Entities, processes, stores, flows, trust boundaries. Derived. |
| Build plan | `spec/BUILD_PLAN.md` | Phases, epics, tasks. Expand it one level at a time (§0). |
| ERD | `spec/ERD.md` | Tables, enums, invariants (`INV-nn`), state machines, row access. Read it before you write a migration or a data-layer check. |
| Functional Requirements | `docs/PUP_CpE_Thesis_Progress_System_Functional_Requirements_v1.1.md` | FR, BR, NFR and AS IDs. The spec. |
| Operational Flow, DFD and Sitemap | `docs/PUP_CpE_Thesis_Progress_System_Operational_Flow_DFD_Sitemap_v3.1.md` | Process, data flows, 30 routes |
| Unified Thesis Process | `docs/PUP_CpE_Thesis_Progress_System_Unified_Thesis_Process_v1.1.md` | Source of truth for the thesis process |
| Design system | `DESIGN.md` (repository root) | Visual and interaction design: colors, type, layout, components, tokens. Draft v0.1. |
| AGENTS.md reference | `docs/reference/AGENTS_md_Reference.md` | Read it before you change the structure of this file |

- If two documents disagree, the Unified Thesis Process wins for process rules. The Functional Requirements win for system behavior. `USERFLOW.md`, `SITEMAP.md`, `DFD.md` and `ERD.md` hold no process rules: correct them to match.
- `docs/stale/` holds superseded versions. Use them as history only.
- `design/stitch/` holds the initial Google Stitch screens. They are a prototype only, not a reference. Do not take design, routes, process or rules from them. The documents above win.

## 7. Domain rules you must not break (full list: BR-01 to BR-21)

| ID | Rule |
| :---- | :---- |
| BR-01 | An in-system action shows intent. The signed paper is the record. No e-signature. |
| BR-02 | Only the Coordinator closes a stage. |
| BR-03 | One role per account: Student, Adviser, Panel Member or Coordinator. They are exclusive. |
| BR-05 | Each reviewer resolves only their own threads. The Student replies. |
| BR-07 | The manuscript locks at Gate 1b. It unlocks when the defense closes. |
| BR-09 | The defense date is at least 7 days after Gate 1b. Printed copies are due 7 days before. |
| BR-15 | Show no subject grade and no grade equivalent. |
| BR-17 | Flags never block an action. |
| BR-19 | Commits, locked scans and audit records are never changed or deleted. |

## 8. Terms

| Use | Instead of |
| :---- | :---- |
| Panel Member | Evaluator |
| Lead Panel Member, Panel Chair (designations, not roles) | Lead Evaluator, Final Panel Chair |
| Coordinator | Admin |

Also use: Evaluation Committee (Adviser + Panel Members), Final Panel, Commit, Submission PR, Critique Thread.

## 9. Out of scope and deferred

Do not build: e-signature, subject grading, outside-office workflows (ethics, IPMO, RPO, copyright), news emails, AI features, the submission pre-check (paused), compare view, print-match cover sheet, Defense Day autosave, calendar file download.

## 10. Stack rules (stack list: `spec/PRD.md` §11.2)

- Use free tiers only. Add no service, paid plan or payment method.
- The browser uploads files directly to file storage with short-lived signed links. The server never receives file bytes.
- The browser never touches the database. One server-side data layer checks access for every read and write. Write tests for it.
- Each commit uses a write-once file key. Never issue a delete link. The audit table accepts inserts only.
- Use Philippine Standard Time (UTC+8) in the app. The daily job runs in UTC.
- Emails hold the event, the next action, the deadline and a link only. No manuscript text, comments, scores or verdicts.

## 11. Security and data

- Never commit secrets. Keep them in environment variables. Commit only `.env.example`.
- Use fake data for tests and seeds. Keep real student data, manuscripts and signed forms out of the repository.

## 12. Setup and commands

Finish this section after the project scaffold exists. Still to add: repository layout, run and test commands, data model (from the ERD), naming rules.

| Task | Command |
| :---- | :---- |
| Turn on the commit hook (once per clone) | `git config core.hooksPath .githooks` |
| Check commits against the policy | `scripts/check-commit-policy.sh --range origin/main..HEAD` |
