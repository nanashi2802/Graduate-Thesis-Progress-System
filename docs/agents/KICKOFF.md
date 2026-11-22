# Two-agent kickoff (autonomous build mode)

**Rules:** `AGENTS.md` §13. **Work order:** `spec/BUILD_PLAN.md` §8. **Decision log:** `spec/AGENT_DECISIONS.md`.

## 1. Before the first start (human, once)

1. Make sure `dev` exists on GitHub. It is the meeting branch.
2. Recommended: in GitHub settings, protect `main` (require pull requests). Optionally require the `ci` and `commit-policy` checks on `dev`.
3. Run `scripts/agents-setup.sh`. It makes `.claude/worktrees/agent-a` and `.claude/worktrees/agent-b`, pushes the two branches, copies `.env.local` and installs dependencies.
4. Run `scripts/agents-start.sh`. It starts both agents as background sessions in `auto` permission mode.

## 2. While they run (human, optional)

| To do this | Run |
| :---- | :---- |
| See both agents | `claude agents` |
| Read an agent's recent output | `claude logs agent-a` |
| Talk to an agent | `claude attach agent-a` (detach with `/exit`; detach does not stop it) |
| Stop an agent | `claude stop agent-a` |
| Restart after a reboot | `claude respawn` (a shutdown or restart stops background sessions) |
| See the decisions | `spec/AGENT_DECISIONS.md` on `dev` |

An agent that shows "Needs input" hit a permission prompt or paused after many `auto` mode blocks. Attach and answer it.

## 3. Prompts

The start script sends the text between the markers. Edit the text, not the markers.

<!-- prompt:agent-a -->
You are agent-a, the integrator, in autonomous build mode. Your worktree is this folder and your branch is agent-a.
Read AGENTS.md in full first, and follow §13 exactly. Then read spec/BUILD_PLAN.md §0 and §8, and spec/AGENT_DECISIONS.md.
Do Track A in spec/BUILD_PLAN.md §8, task by task, with the task loop in AGENTS.md §13.2. Merge pull requests into dev as §13.2 step 8 says.
The human will not answer. Do not ask the human. Where the normal rules say ask, decide and log the decision (§13.3).
Talk to agent-b with SendMessage. Start now: send agent-b a short message with your first task, then begin it.
When you must wait for agent-b, do look-ahead work (§8). If there is none, end your turn; agent-b's message wakes you.
Stop only as §13.5 says.
<!-- end -->

<!-- prompt:agent-b -->
You are agent-b in autonomous build mode. Your worktree is this folder and your branch is agent-b.
Read AGENTS.md in full first, and follow §13 exactly. Then read spec/BUILD_PLAN.md §0 and §8, and spec/AGENT_DECISIONS.md.
Do Track B in spec/BUILD_PLAN.md §8, task by task, with the task loop in AGENTS.md §13.2. agent-a merges your pull requests into dev. Do not merge them yourself.
The human will not answer. Do not ask the human. Where the normal rules say ask, decide and log the decision (§13.3).
Talk to agent-a with SendMessage. Start now: send agent-a a short message with your first task, then begin it. Your first job in P0-E05 is the Vercel project, because agent-a needs its domain for CORS.
When you must wait for agent-a, do look-ahead work (§8). If there is none, end your turn; agent-a's message wakes you.
Stop only as §13.5 says.
<!-- end -->
