# AGENT DECISIONS — autonomous build mode log

**Rule:** `AGENTS.md` §13.3. The agents write here. The human reads it to check and undo decisions.
**Undo a decision:** run `git log --grep <ID>` to find its commits, then `git revert` them. Check later decisions that cite its ID.

## Phase summaries

(`agent-a` adds one summary at the end of each phase, newest first: the decisions made, the risky ones, and what the human must check.)

## Decisions

Copy this block for each decision. Newest last. IDs: `AD-A-nnn` for `agent-a`, `AD-B-nnn` for `agent-b`.

```markdown
### AD-A-001 — <short name>
- **Task:** <task ID>
- **Options:** <option 1>; <option 2>
- **Decision and reason:** <the option, with spec IDs>
- **Risk:** low / medium / high, and why
- **Undo:** <what to revert or change>
```
