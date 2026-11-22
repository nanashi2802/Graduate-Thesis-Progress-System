#!/usr/bin/env bash
# Runner for autonomous build mode (AGENTS.md §13.2).
# Plain shell checks GitHub. Claude runs only when there is work: one run does one unit of work, then exits.
# The shell merges green pull requests itself, so no model turn is spent on a merge or on a wait.
# Usage: scripts/agents-run.sh   (scripts/agents.sh start runs it in the background)
# Stop: touch .claude/agents.stop (scripts/agents.sh stop). The current run finishes first.
#
# Settings (environment variables):
#   AGENT_BUILDERS        1 = one builder at a time, the tracks take turns (default). 2 = both tracks at once.
#   AGENT_INTERVAL        seconds between GitHub checks when there is no work (default 300)
#   AGENT_TIMEOUT         longest time for one Claude run (default 90m)
#   AGENT_LIMIT_WAIT      seconds to wait after a usage-limit error before the next try (default 1800)
#   AGENT_MAX_TRIES       runs for one job on one commit before the runner skips it (default 3). A new commit resets it.
#   AGENT_BUILDER_MODEL / AGENT_BUILDER_EFFORT   default sonnet / medium
#   AGENT_REVIEW_MODEL  / AGENT_REVIEW_EFFORT    default opus / high (the reviewer is the quality gate)
set -uo pipefail
root="$(git rev-parse --show-toplevel)"
cd "$root"

BUILDERS="${AGENT_BUILDERS:-1}"
INTERVAL="${AGENT_INTERVAL:-300}"
TIMEOUT="${AGENT_TIMEOUT:-90m}"
LIMIT_WAIT="${AGENT_LIMIT_WAIT:-1800}"
MAX_TRIES="${AGENT_MAX_TRIES:-3}"
BUILDER_MODEL="${AGENT_BUILDER_MODEL:-sonnet}"; BUILDER_EFFORT="${AGENT_BUILDER_EFFORT:-medium}"
REVIEW_MODEL="${AGENT_REVIEW_MODEL:-opus}"; REVIEW_EFFORT="${AGENT_REVIEW_EFFORT:-high}"

logdir="$root/.claude/agent-runs"
stopfile="$root/.claude/agents.stop"
lock="$root/.claude/agent-runner.lock"
triedir="$logdir/tries"
mkdir -p "$logdir" "$triedir"

log() { echo "$(date "+%F %T") $*" >>"$logdir/runner.log"; }

# One runner only. A lock that belongs to a dead process is taken over.
if ! mkdir "$lock" 2>/dev/null; then
  old="$(cat "$lock/pid" 2>/dev/null || true)"
  if [ -n "$old" ] && kill -0 "$old" 2>/dev/null; then echo "A runner already runs (pid $old)." >&2; exit 1; fi
  rm -rf "$lock"; mkdir "$lock"
fi
echo $$ >"$lock/pid"
trap 'rm -rf "$lock"' EXIT

repo="$(gh repo view --json nameWithOwner -q .nameWithOwner)"

# State of the agent-review status on a commit: success, failure, pending or empty.
review_state() { gh api "repos/$repo/commits/$1/statuses" --jq '[.[]|select(.context=="agent-review")][0].state // ""' 2>/dev/null; }

# Bucket of one check on a pull request: pass, fail, pending, skipping or empty. A passing entry wins.
check_bucket() {
  gh pr checks "$1" --json name,bucket --jq "[.[]|select(.name==\"$2\")|.bucket] | if index(\"pass\") then \"pass\" elif index(\"fail\") then \"fail\" elif index(\"pending\") then \"pending\" else (.[0] // \"\") end" 2>/dev/null
}

# Wait, but stop early when the stop file appears.
nap() { local end=$((SECONDS + $1)); while [ $SECONDS -lt $end ] && [ ! -f "$stopfile" ]; do sleep 10; done; }

# Tries for one job key (agent, job, commit). A capped job stays skipped until its commit changes.
tries() { cat "$triedir/$1" 2>/dev/null || echo 0; }

# Run one Claude session in an agent worktree.
# Return 0 after a run, 2 on a usage limit (not counted as a try), 3 when the job is capped (no run).
run_claude() {
  local name="$1" task="$2" key="$3" model effort settings out rc result n
  n="$(tries "$key")"
  if [ "$n" -ge "$MAX_TRIES" ]; then
    [ -f "$triedir/$key.logged" ] || { log "capped: $key after $n runs with no progress. Check it by hand."; touch "$triedir/$key.logged"; }
    return 3
  fi
  if [ "$name" = agent-r ]; then
    model="$REVIEW_MODEL"; effort="$REVIEW_EFFORT"; settings="$root/.claude/agent-review-session.json"
  else
    model="$BUILDER_MODEL"; effort="$BUILDER_EFFORT"; settings="$root/.claude/agent-session.json"
  fi
  out="$logdir/$(date +%Y%m%d-%H%M%S)-$name.log"
  log "start $name ($model, $effort): $task"
  (cd "$root/.claude/worktrees/$name" && timeout "$TIMEOUT" claude -p --model "$model" --effort "$effort" --settings "$settings" \
    "$(cat "$root/docs/agents/$name.md")

This run: $task") >"$out" 2>&1
  rc=$?
  if grep -qiE "hit your .*limit|usage limit (was )?reached" "$out"; then log "usage limit: $name stopped (log $out)"; return 2; fi
  echo $((n + 1)) >"$triedir/$key"
  result="$(grep -oE 'RESULT: [a-z-]+' "$out" | tail -1)"
  [ "$result" = "RESULT: phase-complete" ] && touch "$logdir/$name.done"
  [ $rc -eq 124 ] && result="timeout after $TIMEOUT"
  log "end $name rc=$rc ${result:-no RESULT line} (log $out)"
  return 0
}

# What a builder must do now, as "key|job" (job: new, resume or fix), or empty (wait).
builder_job() {
  local b="$1" line n sha draft mergeable
  [ -f "$logdir/$b.done" ] && return
  line="$(gh pr list --base dev --state open --head "$b" --json number,headRefOid,isDraft,mergeable \
    --jq '.[0]|select(.)|"\(.number) \(.headRefOid) \(.isDraft) \(.mergeable)"')"
  if [ -z "$line" ]; then echo "$b-new-$(git rev-parse -q --verify "origin/$b" | cut -c1-12)|new: take the next task in your track"; return; fi
  read -r n sha draft mergeable <<<"$line"
  local k="${sha:0:12}"
  if [ "$draft" = true ]; then echo "$b-resume-$k|resume: finish the task of draft pull request #$n"; return; fi
  if [ "$mergeable" = CONFLICTING ]; then echo "$b-conflict-$k|fix: pull request #$n has a merge conflict with dev"; return; fi
  if [ "$(review_state "$sha")" = failure ]; then echo "$b-findings-$k|fix: pull request #$n has agent-review findings"; return; fi
  if [ "$(check_bucket "$n" ci)" = fail ] || [ "$(check_bucket "$n" commit-policy)" = fail ]; then echo "$b-check-$k|fix: pull request #$n has a failed check"; return; fi
}

rm -f "$stopfile"
log "runner started (pid $$, builders $BUILDERS)"
turn=0
while [ ! -f "$stopfile" ]; do
  if [ -f "$logdir/agent-a.done" ] && [ -f "$logdir/agent-b.done" ]; then log "both tracks report phase-complete (§13.5)"; break; fi
  git fetch -q origin
  worked=0
  prs="$(gh pr list --base dev --state open --json number,headRefOid,isDraft --jq '.[]|select(.isDraft|not)|"\(.number) \(.headRefOid)"')"

  # 1. Merge one green pull request (§13.2 step 8). No model turn.
  while read -r n sha; do
    [ -n "${n:-}" ] || continue
    if [ "$(check_bucket "$n" ci)" = pass ] && [ "$(check_bucket "$n" commit-policy)" = pass ] && [ "$(check_bucket "$n" agent-review)" = pass ]; then
      if gh pr merge "$n" --merge >/dev/null 2>&1; then log "merged #$n"; worked=1; break; fi
    fi
  done <<<"$prs"
  [ $worked -eq 1 ] && continue

  # 2. Review one pull request whose head commit has no agent-review status (§13.7).
  while read -r n sha; do
    [ -n "${n:-}" ] || continue
    if [ -z "$(review_state "$sha")" ]; then
      run_claude agent-r "review pull request #$n (head $sha)." "agent-r-review-${sha:0:12}"; rc=$?
      [ $rc -eq 2 ] && { nap "$LIMIT_WAIT"; continue 2; }
      [ $rc -eq 3 ] && continue
      worked=1; break
    fi
  done <<<"$prs"
  [ $worked -eq 1 ] && continue

  # 3. Builders. One at a time (the tracks take turns), or both at once.
  if [ "$BUILDERS" = 2 ]; then
    pids=()
    for b in agent-a agent-b; do
      job="$(builder_job "$b")"
      [ -n "$job" ] && { run_claude "$b" "${job#*|}" "${job%%|*}" & pids+=($!); }
    done
    limit=0
    for p in "${pids[@]}"; do
      wait "$p"; rc=$?
      [ $rc -eq 2 ] && limit=1
      [ $rc -eq 0 ] && worked=1
    done
    [ $limit -eq 1 ] && { nap "$LIMIT_WAIT"; continue; }
  else
    order=(agent-a agent-b); [ $((turn % 2)) -eq 1 ] && order=(agent-b agent-a)
    for b in "${order[@]}"; do
      job="$(builder_job "$b")"
      if [ -n "$job" ]; then
        run_claude "$b" "${job#*|}" "${job%%|*}"; rc=$?
        [ $rc -eq 2 ] && { nap "$LIMIT_WAIT"; continue 2; }
        [ $rc -eq 3 ] && continue
        worked=1; turn=$((turn + 1)); break
      fi
    done
  fi

  [ $worked -eq 0 ] && nap "$INTERVAL"
done
log "runner stopped"
