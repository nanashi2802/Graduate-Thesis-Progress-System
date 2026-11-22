#!/usr/bin/env bash
# Make the agent worktrees (agent-a, agent-b and the reviewer agent-r) for autonomous build mode (AGENTS.md §13).
# Usage: scripts/agents.sh [start]. Run from the main checkout. Safe to run again.
# Without "start" it only makes the worktrees. With "start" it also starts the three agents.
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

[ "${1:-}" = start ] || { echo "Worktrees ready. Start with: scripts/agents.sh start"; exit 0; }
for name in agent-r agent-a agent-b; do
  settings="$root/.claude/agent-session.json"
  [ "$name" = agent-r ] && settings="$root/.claude/agent-review-session.json"
  (cd "$root/.claude/worktrees/$name" && claude --bg --name "$name" --settings "$settings" "$(cat "$root/docs/agents/$name.md")")
done
echo "Started. Watch with: claude agents"
