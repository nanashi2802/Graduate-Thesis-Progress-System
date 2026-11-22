# AGENT DECISIONS — autonomous build mode log

**Rule:** `AGENTS.md` §13.3. The agents write here. The human reads it to check and undo decisions.
**Undo a decision:** run `git log --grep <ID>` to find its commits, then `git revert` them. Later decisions that depend on it say so in "Depends on".

## Phase summaries

(`agent-a` adds one summary at the end of each phase, newest first: the decisions made, the risky ones, and what the human must check.)

## Decisions

Copy this block for each decision. Newest last. IDs: `AD-A-nnn` for `agent-a`, `AD-B-nnn` for `agent-b`.

```markdown
### AD-A-001 — <short name>
- **Date / agent / task:** <YYYY-MM-DD> / agent-a / <task ID>
- **Normal rule that asked the human:** <AGENTS.md § or BUILD_PLAN gate or [CONFIRM] item>
- **Options:** <option 1>; <option 2>
- **Decision:** <the option>
- **Reason:** <spec IDs and facts>
- **Risk:** low / medium / high, and why
- **Depends on:** <other AD IDs, or none>
- **Undo:** <what to revert or change>
- **Pull request:** <#n>
```
