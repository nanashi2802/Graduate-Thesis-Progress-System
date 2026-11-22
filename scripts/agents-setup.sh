#!/usr/bin/env bash
# Make the agent worktrees (agent-a, agent-b and the reviewer agent-r) for autonomous build mode (AGENTS.md §13).
# Run from the main checkout, once, after `dev` exists on origin. Safe to run again.
set -euo pipefail
root="$(git rev-parse --show-toplevel)"
cd "$root"
git fetch origin
git rev-parse --verify -q origin/dev >/dev/null || { echo "origin/dev does not exist. Push dev first." >&2; exit 1; }

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
  (cd "$dir" && pnpm install --frozen-lockfile)
  echo "Ready: $dir on branch $name"
done

# Reviewer: detached checkout, no branch. It never commits.
rdir=".claude/worktrees/agent-r"
[ -d "$rdir" ] || git worktree add --detach "$rdir" origin/dev
[ -f .env.local ] && cp -n .env.local "$rdir/.env.local" || true
(cd "$rdir" && pnpm install --frozen-lockfile)
echo "Ready: $rdir (detached, reviewer)"

echo
echo "Start the agents (see docs/agents/KICKOFF.md):"
echo "  scripts/agents-start.sh"
