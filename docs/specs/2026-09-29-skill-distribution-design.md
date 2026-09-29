# Skill Distribution Redesign

Date: 2026-09-29
Status: Draft (awaiting review)

## Goal

Maintain one copy of every skill and install a chosen subset of it into a
project so that Codex, Gemini (Antigravity), and Claude Code all discover the
same skills natively.

Success criteria:

- Editing a skill means editing exactly one directory in this repository.
- Codex, Gemini, and Claude Code discover installed skills without routing
  instructions.
- A project can install all skills, a named profile, or individual skills.
- `update` changes only kit-managed skills and never touches project-owned
  skills.
- During development, a project can link to the local kit checkout so skill
  edits apply without push or reinstall.

## Context

The current installer (`bin/index.js`) always installs every runtime and every
skill:

- 43 Codex skills in `templates/.agents/skills/`.
- A second, diverged copy of 29 of them plus 14 persona agents and 10 workflows
  in `templates/.agents/gemini/`. No duplicated pair is still identical.
- Skill scripts exist three times: `shared/runtime/` plus both template copies.
- Claude Code gets no skills; `CLAUDE.md` asks the agent to read
  `.agents/skills/` manually, but Claude Code only discovers `.claude/skills/`.
- Antigravity already scans `.agents/skills/`, so the Gemini copy is reached
  only through explicit `GEMINI.md` routing.
- `update` atomically replaces `.agents/skills/`, deleting any project-owned
  skill stored there.

## Decisions

| Topic | Decision |
| --- | --- |
| Install scope | Per project only. No global install. |
| Skill source | One directory: `templates/.agents/skills/<name>/`. |
| Gemini-specific assets | Remove skills, agents, workflows, and Gemini `ARCHITECTURE.md`. Keep Gemini hooks. |
| Claude Code discovery | Relative symlink `.claude/skills/<name>` -> `../../.agents/skills/<name>`. No copy fallback. |
| Fetch source | GitHub by ref (default), or a local checkout via `--source`. |
| Development mode | `--link`: project skills become symlinks into the local checkout. |
| Selection | Default is all skills. Named profiles live in the kit registry. Individual skills can be added or excluded. |
| Root instructions | Unchanged, except fixing paths in `GEMINI.md` that point to removed folders. |
| Harness | Unchanged. The work is recorded through the existing story and decision process. |
| Implementation approach | Split the installer into focused modules under `lib/`. |

## Repository Layout

```text
templates/
├── kit.json                       # NEW: registry
├── AGENTS.md CLAUDE.md GEMINI.md  # unchanged (GEMINI.md paths fixed)
├── .codex/hooks.json
├── .claude/settings.json
└── .agents/
    ├── skills/<name>/             # single source: SKILL.md, references/, scripts/, agents/openai.yaml
    ├── scripts/
    ├── hooks.json
    ├── ARCHITECTURE.md
    ├── claude/hooks/
    └── gemini/hooks/              # only hooks remain under gemini/
```

Removed:

- `templates/.agents/gemini/{skills,agents,workflows,ARCHITECTURE.md}`
- `shared/runtime/`, `scripts/sync-shared-runtime.mjs`,
  `scripts/test-shared-runtime.mjs`, and their npm scripts. Skill scripts are
  edited in place inside the skill directory.

Kept: `shared/hooks/` and `scripts/sync-shared-hooks.mjs`, because three hook
adapters still share one guard.

## Registry: `templates/kit.json`

```json
{
  "formatVersion": 1,
  "profiles": {
    "a": ["clean-code", "verify-changes", "debugger"]
  }
}
```

- The set of available skills is the set of directories in
  `templates/.agents/skills/`. It is not repeated in `kit.json`.
- The CLI declares the highest `formatVersion` it supports and refuses newer
  templates with an upgrade message.
- Profile contents are out of scope for this work; the file ships with at
  least one example profile so the mechanism is exercised by tests.

## Project Manifest: `.ai-kit.json`

```json
{
  "formatVersion": 1,
  "source": { "type": "github", "ref": "main" },
  "selection": {
    "all": false,
    "profiles": ["a"],
    "skills": ["extra-skill"],
    "exclude": []
  },
  "managedSkills": {
    "clean-code": { "hash": "sha256:..." }
  },
  "installedAt": "2026-09-29T00:00:00.000Z",
  "harness": { "enabled": true, "source": "repository-harness" },
  "features": { "backlog": true, "guardHooks": true, "toolRegistry": true }
}
```

- `source` is either `{ "type": "github", "ref": "<ref>" }` or
  `{ "type": "local", "path": "<abs path>", "mode": "copy" | "link" }`.
- `selection` records intent. `update` recomputes the target set from it, so
  profile edits in the kit reach the project on the next `update`.
- `managedSkills` lists skills the kit installed. A directory in
  `.agents/skills/` that is not listed here is project-owned and never modified
  or removed by the kit.
- `hash` is a SHA-256 over the skill directory's sorted relative paths and file
  contents, excluding `__pycache__/` and `*.pyc`. It is omitted in link mode.
- `harness` and `features` keep their current meaning.

Legacy migration: a manifest with `version: "2.0.0"` and no `formatVersion`
becomes `selection.all = true`, `source = github@<old ref>`. Existing
`.agents/skills/<name>` directories whose names exist in the kit become managed
skills with their current content hash. The legacy installer recorded no
hashes, so local edits made before migration cannot be detected and the
migrating `update` overwrites them; run `update --dry-run` first to see which
skills differ from the source.

## Commands

| Command | Behavior |
| --- | --- |
| `install [skills...] [--profile a,b] [--all]` | First run installs skills, hooks, and root instruction blocks; with no selection arguments it selects all. On an installed project it adds the given skills or profiles to the existing selection. |
| `remove <skills...>` | Removes skills from `selection.skills`. A skill that comes from `all` or a profile is added to `selection.exclude`. Then applies the plan. |
| `update [--ref <ref>] [--force]` | Refetches from the recorded (or overriding) source, recomputes the target set, and applies it. Also recreates missing directories and broken symlinks. |
| `list` | Prints available skills and profiles, marking which are installed. |
| `status` | Prints source, mode, selection, managed skills, modified skills, broken symlinks, and project-owned skills. |

Shared options: `--path <dir>`, `--ref <ref>`, `--source <dir>`, `--link`
(requires `--source`), `--dry-run`, `--force`.

`init` remains as an alias of `install`. `repair` is removed; `update` covers
it. `--branch` is removed in favor of `--ref`.

## Install and Update Pipeline

`install`, `update`, and `remove` share one pipeline:

1. **Resolve source.** Flags override the manifest, which overrides the default
   `github@main`. GitHub sources download `templates/` into a temp directory;
   local sources read `<source>/templates` directly.
2. **Load registry.** Read `kit.json`, check `formatVersion`, enumerate skills.
3. **Resolve target set.** `all` or the union of profiles, plus
   `selection.skills`, minus `selection.exclude`. Unknown names fail with close
   matches.
4. **Plan.** Classify every skill in the target set, in `managedSkills`, or
   colliding by name:

   | Action | Condition |
   | --- | --- |
   | `add` | In target set, not present in the project. |
   | `update` | In target set, managed, content differs from source, unmodified locally. |
   | `unchanged` | In target set, managed, content equals source (or link already correct). |
   | `skip-modified` | Managed, local hash differs from recorded hash, no `--force`. |
   | `remove` | Managed, not in target set, unmodified locally. |
   | `conflict` | In target set, present in the project, not managed, no `--force`. |

   Any `conflict` aborts before writing. `--dry-run` prints the plan and stops.
5. **Apply skills.**
   - Copy mode: copy the skill into a sibling staging directory, then swap it
     in with `rename`, one skill at a time.
   - Link mode: replace `.agents/skills/<name>` with an absolute symlink to
     `<source>/templates/.agents/skills/<name>`.
   - Switching from link to copy replaces symlinks with copies.
6. **Apply Claude links.** For each managed skill ensure
   `.claude/skills/<name>` is a relative symlink to
   `../../.agents/skills/<name>`. Remove only symlinks that point into
   `.agents/skills/` for skills that are no longer managed. A real directory at
   that path is left alone with a warning.
7. **Apply integrations.** Hooks and root instruction `KIT` blocks merge exactly
   as they do today (ADR 0014). This step runs on `install` and `update`, not
   on `remove`.
8. **Clean legacy folders.** Remove `.agents/gemini/{skills,agents,workflows}`
   and `.agents/gemini/ARCHITECTURE.md` if present.
9. **Write manifest** last, then print a summary of applied actions and
   warnings.

## Modules

| Module | Responsibility | Depends on |
| --- | --- | --- |
| `bin/index.js` | Commander definitions and output only. | `lib/*` |
| `lib/source.js` | Resolve and fetch the template source (GitHub temp dir or local path); cleanup. | `giget` |
| `lib/registry.js` | Read `kit.json`, check `formatVersion`, list skills and profiles. | — |
| `lib/manifest.js` | Read, migrate, and write `.ai-kit.json`. | — |
| `lib/resolve.js` | Pure: selection + registry -> target skill set. | — |
| `lib/plan.js` | Pure: target set + project state -> action list. | `lib/hash.js` |
| `lib/hash.js` | Content hash of a skill directory. | — |
| `lib/skills.js` | Apply actions: copy, link, remove, Claude symlinks, legacy cleanup. | — |
| `lib/integrations.js` | Existing hook merges and root instruction block merge, moved from `bin/index.js`. | — |

`package.json` `files` gains `lib`.

## Error Handling

| Situation | Behavior |
| --- | --- |
| Download fails, or `--source` has no `templates/kit.json` | Abort before any write. |
| Template `formatVersion` newer than supported | Abort with the CLI upgrade command. |
| Unknown skill or profile name | Abort with close matches. |
| `conflict` in plan | Abort; `--force` makes the kit take ownership. |
| `skip-modified` | Warn and keep the local copy; `--force` overwrites. |
| Symlink creation fails | Abort with the failing path. No copy fallback. |
| Failure mid-apply | Each skill swap is atomic and the manifest is written last, so rerunning `update` converges. |

## Testing

- Unit tests with `node:test` for `resolve`, `plan`, `manifest` (including
  legacy migration), `registry`, and `hash`.
- Integration tests (rewrite of `scripts/test-installer.mjs`) against temp
  projects using `--source` pointed at this repository:
  - install all, install by profile, install a single skill;
  - `remove` followed by `update`;
  - link mode: an edit in the source is visible in the project;
  - `.claude/skills` symlinks are created and removed correctly;
  - project-owned skills are untouched;
  - locally modified managed skills are skipped;
  - legacy install migration removes Gemini folders and preserves edits;
  - existing hook and root instruction merge assertions are kept.
- `scripts/check-template-consistency.mjs`: drop Gemini skill, agent, and
  workflow checks; add checks that profiles reference existing skills and each
  `SKILL.md` has a `name` matching its directory.
- `npm run verify` remains the single entry point.

## Documentation and Harness Records

- Update `README.md`, `docs/ARCHITECTURE.md`, `docs/product/toolkits.md`,
  `GEMINI.md`, and `templates/GEMINI.md` (paths only).
- Add story `KIT-027` for this work.
- Add ADR `0015` recording one skill source, the manifest-based installer,
  profiles, and link mode. It supersedes the per-runtime folder part of ADR
  0008 and extends the ownership table of ADR 0014 with `managedSkills` and
  `.claude/skills/`.
- Historical stories that mention old paths are not edited.

## Out of Scope

- Choosing which skills to delete or rewrite, and the contents of profiles.
- Merging `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md`.
- Global installation.
- Windows symlink support.
