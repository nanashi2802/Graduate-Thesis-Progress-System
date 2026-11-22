#!/usr/bin/env bash
# Make the agent worktrees (agent-a, agent-b and the reviewer agent-r) for autonomous build mode (AGENTS.md §13).
# Usage: scripts/agents.sh [start [agent-a|agent-b|agent-r ...]]. Run from the main checkout. Safe to run again.
# Without "start" it only makes the worktrees. With "start" it also starts the named agents (all three if none). Do not start an agent that already runs.
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
shift
names=("$@"); [ ${#names[@]} -gt 0 ] || names=(agent-r agent-a agent-b)
# "/loop" with no interval is the self-paced loop: the agent wakes itself with ScheduleWakeup and does not stop while it waits.
for name in "${names[@]}"; do
  case "$name" in agent-a|agent-b|agent-r) ;; *) echo "Unknown agent: $name" >&2; exit 1;; esac
  # Builders: Sonnet 5.5 at high effort. Reviewer: Opus 5.5 at medium effort.
  settings="$root/.claude/agent-session.json"; model=claude-sonnet-5-5; effort=high
  if [ "$name" = agent-r ]; then settings="$root/.claude/agent-review-session.json"; model=claude-opus-5-5; effort=medium; fi
  (cd "$root/.claude/worktrees/$name" && claude --bg --name "$name" --settings "$settings" --model "$model" --effort "$effort" "/loop $(cat "$root/docs/agents/$name.md")")
done
echo "Started. Watch with: claude agents"
