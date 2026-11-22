# Agent kickoff (autonomous build mode)

**Rules:** `AGENTS.md` §13. **Work order:** `spec/BUILD_PLAN.md` §8. **Decision log:** `spec/AGENT_DECISIONS.md`. **Prompts:** `docs/agents/agent-a.md`, `agent-b.md`, `agent-r.md`.

## Start

1. Keep the computer on and plugged in. A shutdown or restart stops the agents.
2. From the main checkout, run `scripts/agents.sh start`. It makes the worktrees if they are missing, then starts the three agents in bypass permission mode. Each agent runs in a self-paced `/loop`: it wakes itself every 5 minutes while it waits, so it does not stop. The first start asks you once to accept the bypass notice.

## While they run

| To do this | Run |
| :---- | :---- |
| See the agents | `claude agents` |
| See what each builder works on | `gh pr list --base dev` (each task has a draft pull request) |
| Read an agent's output | `claude logs agent-a` |
| Talk to an agent | `claude attach agent-a` (`/exit` detaches and does not stop it) |
| Stop an agent | `claude stop agent-a` |
| Restart after a reboot | `claude respawn` |
| Restart one agent that stopped | `scripts/agents.sh start agent-b` |

## Release to `main`

Turn off the `lock-main` ruleset in GitHub. Merge `dev` into `main` with a pull request. Turn the ruleset on again.
