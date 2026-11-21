#!/usr/bin/env bash
# Commit policy check (AGENTS.md §2). It holds no rules of its own.
# It rejects AI authors, AI co-author lines and AI attribution footers.
# Human co-authors are allowed.
#
# Usage:
#   scripts/check-commit-policy.sh --message <file>    check one commit message (commit-msg hook)
#   scripts/check-commit-policy.sh --range <A..B>      check every commit in a range (CI, local)
#   scripts/check-commit-policy.sh --commit <sha>      check one commit
#
# Exit code: 0 = pass, 1 = policy violation, 2 = usage error.

set -u
# Match bytes, not locale characters, so emoji and non-ASCII prefixes are found.
export LC_ALL=C

# AI tool and model names. Word-bounded and case-insensitive.
AI_NAMES='claude|anthropic|openai|chatgpt|gpt-?[0-9]|copilot|gemini|cursor|aider|codex|devin|windsurf|codeium|tabnine|cody|jules|amazon q|codewhisperer'
AI_EMAILS='noreply@anthropic\.com|@openai\.com|copilot@github\.com|aider@aider\.chat|cursoragent@cursor\.com'
TRAILERS='^(co-authored-by|assisted-by|generated-by)[[:space:]]*:'

fail=0

report() {
  echo "commit-policy: $1" >&2
  fail=1
}

# check_message <label> <message text>
check_message() {
  label=$1
  msg=$2
  # 1. AI co-author or assistant trailers. Human trailers pass.
  while IFS= read -r line; do
    if printf '%s\n' "$line" | grep -Eiq "$TRAILERS"; then
      if printf '%s\n' "$line" | grep -Eiq "\\b($AI_NAMES)\\b|$AI_EMAILS"; then
        report "$label: AI trailer is not allowed: $line"
      fi
    fi
  done <<EOF
$msg
EOF
  # 2. Attribution footers and session lines.
  if printf '%s\n' "$msg" | grep -Eiq '^[^a-z]*generated (with|by) '; then
    report "$label: 'Generated with/by' footer is not allowed."
  fi
  if printf '%s\n' "$msg" | grep -Eiq '^claude-session[[:space:]]*:'; then
    report "$label: 'Claude-Session:' line is not allowed."
  fi
  if printf '%s' "$msg" | grep -q $'\xF0\x9F\xA4\x96'; then
    report "$label: robot emoji footer is not allowed."
  fi
}

# check_identity <label> <name> <email>
check_identity() {
  label=$1
  who="$2 <$3>"
  if printf '%s\n' "$who" | grep -Eiq "\\b($AI_NAMES)\\b|$AI_EMAILS"; then
    report "$label: AI author or committer is not allowed: $who"
  fi
}

check_commit() {
  sha=$1
  short=$(git rev-parse --short "$sha")
  check_message "$short" "$(git log -1 --format=%B "$sha")"
  check_identity "$short author" "$(git log -1 --format=%an "$sha")" "$(git log -1 --format=%ae "$sha")"
  check_identity "$short committer" "$(git log -1 --format=%cn "$sha")" "$(git log -1 --format=%ce "$sha")"
}

case "${1:-}" in
  --message)
    [ -n "${2:-}" ] && [ -f "$2" ] || { echo "usage: $0 --message <file>" >&2; exit 2; }
    # Skip comment lines that git strips from the final message.
    check_message "message" "$(grep -v '^#' "$2")"
    check_identity "author" "$(git config user.name)" "$(git config user.email)"
    ;;
  --range)
    [ -n "${2:-}" ] || { echo "usage: $0 --range <A..B>" >&2; exit 2; }
    for sha in $(git rev-list "$2"); do check_commit "$sha"; done
    ;;
  --commit)
    [ -n "${2:-}" ] || { echo "usage: $0 --commit <sha>" >&2; exit 2; }
    check_commit "$2"
    ;;
  *)
    echo "usage: $0 --message <file> | --range <A..B> | --commit <sha>" >&2
    exit 2
    ;;
esac

if [ "$fail" -ne 0 ]; then
  echo "commit-policy: FAILED. See AGENTS.md §2. Remove the AI attribution and try again. Do not use --no-verify." >&2
  exit 1
fi
echo "commit-policy: OK"
