# AGENTS.md - Workspace Rules

Keep repository-wide rules here. Put domain procedures, examples, and tool-specific guidance in skills.

## Load Skills

Before implementation:

1. Select the smallest set of relevant skills from `.agents/skills/`.
2. Read each selected `SKILL.md`.
3. Read only the referenced files needed for the current task.
4. Prefer bundled scripts when they provide the required operation.

Instructions are cumulative. Within a directory scope, the nearest nested
`AGENTS.md` takes precedence, followed by the active skill and its references.

Do not load every reference file or activate broad coordination skills for a single-domain task.

## Route Requests

- Answer simple questions directly.
- Use a discovery skill for repository surveys or unfamiliar codebases.
- Use the relevant domain skill for clear edits and bug fixes.
- Add planning only for broad, risky, or cross-module work.
- Use orchestration only when multiple domains require independent coordination.
- Route native mobile work through mobile skills, not web frontend skills.

Mention the applied skill only when it helps the user understand the approach.

## Work Safely

Before editing:

1. Read `.agents/ARCHITECTURE.md` when changing the shared agent toolkit.
2. Inspect nearby code and follow established patterns.
3. Identify callers, imports, tests, and contracts affected by the change.
4. Preserve unrelated user changes and work with existing modifications.

Use `.agents/skills/clean-code/SKILL.md` when writing or refactoring code. Keep
changes scoped, avoid speculative abstractions, and update dependent files in
the same task.

Never expose secrets, commit local credentials, or run destructive commands without an explicit request.

## Clarify Minimally

Ask only when missing information makes the next action ambiguous, risky, or destructive.

Proceed when intent is clear, including direct requests such as `continue`, `fix it`, or `sửa toàn bộ`. For broad work, state a short plan before editing.

## Communicate

Respond in the user's language. Keep code identifiers and comments in English unless the project uses another convention.

Report material assumptions, blockers, and verification results. Avoid fixed skill-announcement templates and unnecessary process narration.

## Verify

Run checks proportional to the change. Prefer project-native checks. Use
`.agents/skills/verify-changes/SKILL.md` when executable verification or
completion evidence is required, and do not claim success without execution
evidence when tests or builds are available.

Toolkit entry points, when they match the changed surface:

```bash
python3 .agents/scripts/checklist.py .
```

Use narrower skill scripts when they better match the changed surface.
