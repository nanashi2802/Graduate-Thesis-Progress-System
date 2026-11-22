#!/usr/bin/env bash
# Start the three agents as background sessions (AGENTS.md §13).
# Watch them with `claude agents`. Read one with `claude logs agent-a`. Stop one with `claude stop agent-a`.
set -euo pipefail
root="$(git rev-parse --show-toplevel)"
for name in agent-r agent-a agent-b; do
  dir="$root/.claude/worktrees/$name"
  settings="$root/.claude/agent-session.json"
  [ "$name" = agent-r ] && settings="$root/.claude/agent-review-session.json"
  prompt="$(sed -n "/^<!-- prompt:$name -->/,/^<!-- end -->/p" "$root/docs/agents/KICKOFF.md" | sed '1d;$d')"
  [ -n "$prompt" ] || { echo "No prompt for $name in docs/agents/KICKOFF.md" >&2; exit 1; }
  (cd "$dir" && claude --bg --name "$name" --settings "$settings" "$prompt")
done
echo "All three agents started. Watch them with: claude agents"
