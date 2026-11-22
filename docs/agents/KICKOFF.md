# Agent kickoff (autonomous build mode)

**Rules:** `AGENTS.md` §13. **Work order:** `spec/BUILD_PLAN.md` §8. **Decision log:** `spec/AGENT_DECISIONS.md`. **Prompts:** `docs/agents/agent-a.md`, `agent-b.md`, `agent-r.md`. **Runner:** `scripts/agents-run.sh`.

## How it works

The runner is a shell loop. It checks GitHub with `gh`, which costs no usage. In each pass it does the first step that has work:

1. Merge one pull request that has `ci`, `commit-policy` and `agent-review` all green. No Claude run.
2. Start one `agent-r` run for a ready pull request whose head commit has no `agent-review` status.
3. Start one builder run: a new task, a draft to finish, or a fix (findings, failed check, merge conflict). The two tracks take turns.

Each Claude run does one unit of work in a fresh context, then ends. When there is no work, the runner waits 5 minutes and starts no Claude run.

## Start and stop

1. Keep the computer on and plugged in. A shutdown or restart stops the runner.
2. From the main checkout, run `scripts/agents.sh start`. It makes the worktrees if they are missing, then starts the runner in the background.
3. To stop, run `scripts/agents.sh stop`. The runner stops after its current run.
4. After a reboot, run `scripts/agents.sh start` again. Each run continues from the worktree and the open pull requests.

## While it runs

| To do this | Run |
| :---- | :---- |
| See what the runner does | `tail -f .claude/agent-runs/runner.log` |
| Read the output of one run | `.claude/agent-runs/<time>-<agent>.log` |
| See what each builder works on | `gh pr list --base dev` |
| Run both tracks at once (uses more of the limit) | `AGENT_BUILDERS=2 scripts/agents.sh start` |
| Change a model or effort | `AGENT_BUILDER_MODEL`, `AGENT_BUILDER_EFFORT`, `AGENT_REVIEW_MODEL`, `AGENT_REVIEW_EFFORT` (defaults: `sonnet`, `medium`) |

**Usage limit:** when a run hits the limit, the runner waits 30 minutes and tries again. It needs no restart after the reset.
**Retry cap:** one job on one commit gets at most 3 runs (`AGENT_MAX_TRIES`). Then the runner skips it and writes "capped" in `runner.log`. Fix it by hand. A new commit resets the count.
**Phase end:** a builder with no task left before the end of Phase 3 reports `RESULT: phase-complete`. The runner stops when both tracks report it.

## Release to `main`

Turn off the `lock-main` ruleset in GitHub. Merge `dev` into `main` with a pull request. Turn the ruleset on again.
