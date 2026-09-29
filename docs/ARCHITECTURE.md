# Architecture

This repository ships `hieund-ai-kit`, a Node.js CLI that installs AI-agent
toolkits into another repository.

## Runtime Stack

- Node.js with ES modules.
- Commander for CLI parsing.
- Giget for downloading the source repository.
- Chalk and Ora for terminal output.
- Python utilities bundled inside installed toolkit templates.

## Repository Shape

```text
bin/index.js
  Commander definitions and output only for install/init, remove, update,
  list, and status commands

lib/
  errors.js       KitError for expected, user-facing failures
  fsx.js          lstatOrNull
  integrations.js Hook merges, root instruction block merge, shared assets,
                  runtime hook folders, Codex hook scripts, detectHarness
  registry.js     Load and validate templates/kit.json; list skills
  hash.js         hashSkillDir, isIgnoredName
  resolve.js      Pure selection logic and unknown-name messages
  manifest.js     Read, migrate, create, write .ai-kit.json
  plan.js         Classify each skill into an action
  skills.js       Apply actions, Claude links, legacy adoption, stale
                  staging cleanup
  source.js       Resolve and fetch the template source
  pipeline.js     runPipeline, loadCatalog
  status.js       collectStatus (offline)

templates/
  Generated installer layout: root instructions, templates/kit.json
  (registry), the single skill source under .agents/skills/, Codex hooks,
  Gemini hooks, and Claude Code settings/hooks

templates/kit.json
  Registry: formatVersion plus named skill profiles

shared/hooks/
  Canonical Harness guard policy plus tool-specific lifecycle adapters

../hieund-backlog-mcp/
  Workstation-local stdio MCP server and centralized Backlog runtime/state;
  registered separately with Claude Code, Codex, or another MCP client
  (lives as a sibling project, not inside this repo)

docs/
  Repository Harness policy, product contracts, stories, and decisions
```

## Installer Layout

`install` (alias `init`), `remove`, and `update` manage skills, hooks, and
root instructions from the generated `templates/` layout, driven by
`lib/pipeline.js`. The installer performs structured merges for tool-owned
config files and per-skill actions (add/keep/update/skip/conflict) for
`.agents/skills/`.

- Top-level files (e.g. `AGENTS.md`, `GEMINI.md`, `CLAUDE.md`) are Root
  Instruction Files; a kit-owned `KIT` block is merged into each, the rest of
  the file is left untouched.
- `.agents/skills/<name>` listed in the manifest's `managedSkills` is
  installed, updated, or removed by the kit; a locally modified managed skill
  is skipped unless `--force`. Skills not listed in `managedSkills` belong to
  the project and are never touched.
- `.claude/skills/<name>` is a relative symlink to `../../.agents/skills/<name>`,
  created and removed alongside its managed skill.
- The Codex `.codex/hooks.json` and `.codex/hooks/` files are merged into
  `project/.codex/`; existing project config and unrelated hooks are
  preserved.
- The Gemini `.agents/hooks.json` lifecycle entry and `.agents/gemini/hooks/`
  scripts are merged so project-owned hooks survive updates.
- Claude Code `.claude/settings.json` hook groups are merged into
  `project/.claude/settings.json`; unrelated Claude settings and custom hooks
  are preserved.
- Shared files under `.agents/scripts/`, `.agents/shared/`, and the top-level
  toolkit files are tracked in the manifest's `managedFiles` with content
  hashes. A file still matching its recorded hash is updated; a locally
  modified one is kept unless `--force`. A manifest without `managedFiles`
  adopts the existing files and updates them.

## Installation Boundaries

- Treat `templates/` as package data; preserve relative paths during
  publication and installation.
- Edit a skill directly under `templates/.agents/skills/<name>/`; it is the
  single source Codex, Gemini Antigravity, and Claude Code all read from.
- Edit and test the Backlog integration under `../hieund-backlog-mcp/`. It is not copied
  into target templates or included in the npm package.
- Keep tool-specific metadata such as `SKILL.md`, Codex `agents/openai.yaml`,
  environment files, and runtime logs outside the shared source.
- Edit shared lifecycle policy and adapters under `shared/hooks/`, then run
  `npm run sync:shared-hooks` to refresh committed target copies.
- `install`/`update` skip a managed skill that was modified locally unless
  `--force` is supplied; `--force` never overwrites root instructions, since
  those are always block-merged.
- `update` refreshes managed skills, kit-managed Codex/Gemini/Claude hooks
  through structured merges, and the `KIT` block in root instructions, leaving
  the rest of each root instruction file and every project-owned skill
  untouched.
- The CLI does not modify `.gitignore`; users manage it themselves.

## Instruction Hierarchy

```text
templates/AGENTS.md
  repository-wide workflow and skill loading

templates/GEMINI.md
  Gemini-specific workflow and skill loading

templates/CLAUDE.md
  Claude Code workflow and skill loading

templates/.codex/hooks.json
  warning-only lifecycle guardrails merged with project hooks

templates/.agents/hooks.json
  Gemini Antigravity lifecycle adapter using the same shared guard policy

templates/.claude/settings.json
  Claude Code lifecycle adapter using the same shared guard policy

templates/.agents/ARCHITECTURE.md
  maintenance rules scoped to the installed toolkit

templates/.agents/skills/*/SKILL.md
  domain-specific procedures loaded on demand
```

External systems such as Repository Harness may append marked blocks to the
root instruction. Toolkit updates must not remove those project-specific
sections.

## Change Impact

When changing installer behavior, inspect together:

- `bin/index.js`
- `README.md`
- the affected generated template paths under `templates/`
- `package.json` package inclusion rules

When changing skill discovery or toolkit structure, update
`templates/.agents/ARCHITECTURE.md`.

## Validation Ladder

```text
CLI syntax        -> node --check bin/index.js
CLI contract      -> node bin/index.js <command> --help
package contents  -> npm pack --dry-run --json
template layout   -> copy into a temporary target and inspect paths
toolkit behavior  -> run the narrowest bundled validator or test suite
```
