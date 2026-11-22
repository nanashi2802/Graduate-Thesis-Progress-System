#!/usr/bin/env bash
# Make the agent worktrees (agent-a, agent-b and the reviewer agent-r) for autonomous build mode (AGENTS.md §13).
# Usage: scripts/agents.sh [start|stop]. Run from the main checkout. Safe to run again.
#   (none)  make the worktrees only
#   start   make the worktrees, then start scripts/agents-run.sh in the background (log: .claude/agent-runs/runner.log)
#   stop    ask the runner to stop after its current run
set -euo pipefail
root="$(git rev-parse --show-toplevel)"
cd "$root"

if [ "${1:-}" = stop ]; then touch .claude/agents.stop; echo "Stop requested. The runner stops after its current run."; exit 0; fi

git fetch origin
git rev-parse --verify -q origin/dev >/dev/null || { echo "origin/dev does not exist. Push dev first." >&2; exit 1; }

# Install only when node_modules is missing or older than the lockfile.
install_if_needed() {
  local dir="$1"
  if [ ! -d "$dir/node_modules" ] || [ "$dir/pnpm-lock.yaml" -nt "$dir/node_modules" ]; then
    (cd "$dir" && pnpm install --frozen-lockfile)
  fi
}

for name in agent-a agent-b; do
  dir=".claude/worktrees/$name"
  if [ ! -d "$dir" ]; then
    if git rev-parse --verify -q "refs/heads/$name" >/dev/null; then
      git worktree add "$dir" "$name"
    elif git rev-parse --verify -q "refs/remotes/origin/$name" >/dev/null; then
      git worktree add --track -b "$name" "$dir" "origin/$name"
    else
      git worktree add -b "$name" "$dir" origin/dev
      git -C "$dir" push -u origin "$name"
    fi
  fi
  [ -f .env.local ] && cp -n .env.local "$dir/.env.local" || true
  install_if_needed "$dir"
  echo "Ready: $dir on branch $name"
done

# Reviewer: detached checkout, no branch. It never commits.
rdir=".claude/worktrees/agent-r"
[ -d "$rdir" ] || git worktree add --detach "$rdir" origin/dev
[ -f .env.local ] && cp -n .env.local "$rdir/.env.local" || true
install_if_needed "$rdir"
echo "Ready: $rdir (detached, reviewer)"

[ "${1:-}" = start ] || { echo "Worktrees ready. Start with: scripts/agents.sh start"; exit 0; }
mkdir -p .claude/agent-runs
nohup scripts/agents-run.sh >>.claude/agent-runs/runner.out 2>&1 &
disown
echo "Runner started (pid $!). Watch: tail -f .claude/agent-runs/runner.log. Stop: scripts/agents.sh stop"
