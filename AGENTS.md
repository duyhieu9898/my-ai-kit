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

- Question: answer directly, with file references when useful.
- Repository survey or unfamiliar codebase: use a discovery skill, inspect the
  relevant files, and summarize concrete paths.
- Clear edit or bug fix: use the relevant domain skill, read nearby code, and
  implement directly.
- Broad or risky change: state a short plan before editing.
- Multi-domain work: use orchestration only when independent coordination is
  required.
- Native mobile work: route through mobile skills, not web frontend skills.
- Ambiguous, destructive, security-sensitive, or credential-related work: ask
  before taking action.

Prefer execution when intent is clear. Ask only when missing information would
make the next action risky, destructive, or likely wrong.
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

Use this proof ladder:

- Docs-only changes: run targeted searches and `git diff --check`.
- Code changes: run the narrowest relevant lint, type, or test command.
- Toolkit or skill changes: validate frontmatter, links, scripts, and changed
  skill paths.
- User-facing app changes: verify manually or with browser checks when
  available.

Toolkit entry points, when they match the changed surface:

```bash
python3 .agents/scripts/checklist.py .
```

Use narrower skill scripts when they better match the changed surface.

<!-- HARNESS:BEGIN -->
## Harness

This repo uses Harness. Before work, read:

- `README.md`
- `docs/HARNESS.md`
- `docs/FEATURE_INTAKE.md`
- `docs/ARCHITECTURE.md`
- `docs/CONTEXT_RULES.md`
- `scripts/bin/harness-cli query matrix`

Use the Rust Harness CLI at `scripts/bin/harness-cli` as the main operational
tool.
<!-- HARNESS:END -->
