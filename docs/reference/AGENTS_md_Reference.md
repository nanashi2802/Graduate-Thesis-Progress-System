# AGENTS.md Reference — Templates and Community Practice

**Compliance standard:** Simplified Technical English (ASD-STE100) at about 80%
**Date:** 22 Nov 2026
**Purpose:** A clear reference for how to write and grow `AGENTS.md` in this repository.
**Status:** Reference only. It holds no rules. The rules live in `AGENTS.md`.

---

## 1. Sources

| # | Source | Type | Why it matters |
| :---- | :---- | :---- | :---- |
| S1 | [agents.md](https://agents.md/) | Official format site | The open format. Stewarded by the Agentic AI Foundation (Linux Foundation). Read by Codex, Copilot, Cursor, Gemini CLI, Aider, Zed, Windsurf and others. |
| S2 | [GitHub Blog: How to write a great agents.md (2,500+ repositories)](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/) | Large practice survey | Gives the six core areas and the three-tier boundaries. |
| S3 | [Chatlatanagulchai et al., *Agent READMEs: An Empirical Study of Context Files for Agentic Coding*, arXiv:2511.12884](https://arxiv.org/abs/2511.12884) | Peer research (2,303 files, 1,925 repositories) | Shows what real files hold and what they leave out. |
| S4 | [Taiizor/agents-md-cookbook](https://github.com/Taiizor/agents-md-cookbook) | Community template repo | Gives a section order and a `templates/` folder. Templates are 60 to 150 lines. |
| S5 | [coder/agents.md](https://github.com/coder/agents.md) | Community repo | A second statement of the format. |
| S6 | [Addy Osmani, Lesson 15: AGENTS.md](https://addyosmani.com/agents/15-agents-md/) | Practitioner guide | Keep the file short. Link to deeper docs. |
| S7 | [ASD-STE100 (ASD)](https://asd-europe.org/standards-specifications/simplified-technical-english) | Official standard | The writing rules for Section 5 of `AGENTS.md`. Request the free copy from ASD. |

**Caution:** Some community sites quote success rates (for example "40% vs 85%"). We could not trace these numbers to a primary source. Do not use them as evidence.

---

## 2. What the sources agree on

### 2.1 Sections (in this order)

| Order | Section | Content | Source |
| :---- | :---- | :---- | :---- |
| 1 | Project overview | One or two lines. Stack with versions. | S1, S4 |
| 2 | Commands | Setup, build, test, lint. Exact commands with flags. A fast check for one file. | S1, S2, S4 |
| 3 | Project structure | Main folders and what each holds | S2 |
| 4 | Code style | Point to the linter config. Add only the rules the config cannot show. One real good and bad example. | S2, S4 |
| 5 | Testing | Where tests live. How to run one test. What must pass before work is done. | S1, S2, S3 |
| 6 | Security | Secrets, data handling, input checks | S1, S3, S4 |
| 7 | Git and PR workflow | Branch names, commit format, checks before push | S1, S2, S4 |
| 8 | Boundaries | Always do / Ask first / Never do | S2, S4 |
| 9 | References | 10 to 15 explicit links to deeper docs | S4, S6 |

### 2.2 Boundaries format (three tiers)

| Tier | Meaning | Example for this repo |
| :---- | :---- | :---- |
| Always do | The agent does it with no question | Write in ASD-STE100 at about 80%. Cite FR and BR IDs. |
| Ask first | The agent stops and asks the human | A large change. A change to an approved document. A new dependency. |
| Never do | A hard limit | Run `git commit`. Commit secrets. Build a deferred item. |

Pair each "Never do" with the correct action. Then the agent knows what to do next (S4).

### 2.3 Writing rules for the file itself

| Rule | Detail | Source |
| :---- | :---- | :---- |
| Be concrete | Give exact commands, paths and names. Vague advice ("write clean code") adds length and no control. | S2, S4 |
| Keep it short | Link to architecture docs and runbooks. Do not copy them in. | S4, S6 |
| Point, do not copy | Reference a file or a config. A copy goes stale. | S4 |
| Grow it from mistakes | Start small. Add a rule each time an agent repeats a mistake. | S2 |
| A human writes it | A bad line affects every session. The human owns each line. | S2 |
| Nest in large repos | Put an `AGENTS.md` in a sub-folder for local rules. The nearest file wins. A direct chat instruction wins over all files. | S1 |
| Cover quality needs | Few files state security (14.8%) or performance (14.5%). State them. | S3 |

---

## 3. Gap check: our `AGENTS.md` (draft v0.6)

| Area | Our status | Action |
| :---- | :---- | :---- |
| Overview and stack | Present (Sections 1, 10). | **Done (v0.4):** one-line stack summary in Section 1. |
| Commands | Not defined. No scaffold exists yet. | Add when the scaffold exists. Put commands near the top. |
| Project structure | Not defined (Section 13). | Add with the scaffold. |
| Code style | Not defined. | Add with the scaffold. Point to the lint and format configs. Add one good and one bad example. |
| Testing | Stack named (Vitest, Playwright). No commands. | Add the commands with the scaffold. |
| Security | Present (Section 11, stack rules in Section 10). | Keep. This is a strength (see S3). |
| Performance | NFRs exist in the Functional Requirements. | **Done (v0.4):** pointer in Section 1a. |
| Git workflow | Present and strict (Sections 2, 3). | Keep. |
| Boundaries | Spread over Sections 2, 4, 9, 10 and 11. | **Done (v0.4):** three-tier table in Section 1a. It points to those sections. |
| References | Present (Section 6). | Keep. Add each new governing document there. |
| Writing standard | Present (Section 5, ASD-STE100 at about 80%). | Keep. |
| Length | About 140 lines. | **Done (v0.6):** stack table moved to `spec/PRD.md` §11.2 behind a pointer. Duplicate lines cut. Keep it under about 150 lines when the scaffold sections are added. |
| Nested files | Not needed yet. | Add `AGENTS.md` in app sub-folders if the repo becomes a monorepo. |

---

## 4. Starter skeleton (for the scaffold phase)

Use this order when Section 12 of `AGENTS.md` is filled in.

```markdown
# AGENTS.md — <project>

**Status:** <version, date>. One line on the project and its stack.

## 1. Commands
| Task | Command |
| :---- | :---- |
| Install | `<exact command>` |
| Dev server | `<exact command>` |
| Test (all) | `<exact command>` |
| Test (one file) | `<exact command> <path>` |
| Lint and types | `<exact command>` |

## 2. Project structure
| Folder | Holds |

## 3. Code style
Point to the config. One good and one bad example.

## 4. Testing
Where tests live. What must pass before work is done.

## 5. Security and data

## 6. Git and PR workflow

## 7. Boundaries
| Always do | Ask first | Never do |

## 8. Writing standard (ASD-STE100, about 80%)

## 9. References
```
