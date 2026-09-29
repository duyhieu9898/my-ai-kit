# KIT-028 Skill Distribution

## Status

implemented

## Lane

normal

## Product Contract

Maintain one copy of every skill and install a chosen subset of it into a
project so that Codex, Gemini (Antigravity), and Claude Code all discover the
same skills natively.

## Relevant Product Docs

- `docs/specs/2026-09-29-skill-distribution-design.md`
- `.superpowers/sdd/2026-09-29-skill-distribution-plan/task-12-brief.md` (this plan)
- `docs/product/toolkits.md`
- `docs/ARCHITECTURE.md`
- `docs/decisions/0015-single-skill-source-and-manifest-installer.md`

## Acceptance Criteria

- Editing a skill means editing exactly one directory in this repository.
- Codex, Gemini, and Claude Code discover installed skills without routing
  instructions.
- A project can install all skills, a named profile, or individual skills.
- `update` changes only kit-managed skills and never touches project-owned
  skills.
- During development, a project can link to the local kit checkout so skill
  edits apply without push or reinstall.

## Design Notes

- Commands: `install` (alias `init`), `remove`, `update`, `list`, `status`.
- Queries: `list` (skills and profiles from `templates/kit.json`), `status`
  (offline manifest read).
- Domain rules: `templates/.agents/skills/` is the single skill source;
  `.claude/skills/<name>` is a relative symlink to
  `../../.agents/skills/<name>`; `.ai-kit.json` records `managedSkills` with
  content hashes so only kit-managed, unmodified skills are updated or
  removed; an unmanaged skill directory byte-identical to the kit's copy is
  adopted as managed rather than treated as a conflict.

## Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli story update --id KIT-028 --unit 1 --integration 1 --e2e 0 --platform 0`.

| Layer | Expected proof |
| --- | --- |
| Unit | `node --test` (`npm run test:unit`) |
| Integration | `scripts/test-installer.mjs` (`npm run test:installer`) |
| E2E | not required |
| Platform | not required |
| Release | `npm run verify` |

## Harness Delta

Recorded in `docs/decisions/0015-single-skill-source-and-manifest-installer.md`.

## Evidence

- Verification command: `npm run verify`.
- Task 11 Step 5 result (final CLI surface):

```
npm run verify
```

PASS. Full output tail:

```
# tests 54
# pass 54
# fail 0
...
> node scripts/test-installer.mjs
Installer regression tests passed.

> python3 scripts/test-hooks.py
...........
Ran 11 tests in 0.109s
OK

> npm run check:templates
Shared hooks are synchronized.
Template consistency check passed: 551 checks.
```
