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
  CLI configuration, target registry, install, update, and status commands

templates/codex/
  Codex toolkit in mirror layout: AGENTS.md + .agents/ runtime + .codex/ hooks

templates/gemini/
  Gemini Antigravity toolkit: GEMINI.md + .agents/ runtime and native hooks

shared/hooks/
  Canonical Harness guard policy plus target-specific lifecycle adapters

shared/runtime/
  Canonical source for executable scripts shared by both targets

backlog-mcp/
  Workstation-local stdio MCP server and centralized Backlog runtime/state;
  registered separately with Claude Code, Codex, or another MCP client

docs/
  Repository Harness policy, product contracts, stories, and decisions
```

## Target Registry

Targets are defined in a `TARGET_REGISTRY` object in `bin/index.js`, keyed by
target name. Each entry carries display metadata and a `templateDir` pointing at
`templates/<templateDir>/`. The `--target <name>` option selects an entry;
`init` defaults to `codex`. Adding a target is one registry entry plus one
mirror-layout template folder — no command logic changes.

Each template folder mirrors the project layout exactly:

- Top-level files (e.g. `AGENTS.md`, `GEMINI.md`) are Root Instruction Files,
  copied to the project root.
- The `.agents/` subdirectory is the install folder, copied to `project/.agents/`.
- The Codex `.codex/` subdirectory contains lifecycle hooks. It is merged into
  `project/.codex/`; existing project config and unrelated hooks are preserved.
- The Gemini `.agents/hooks.json` lifecycle entry and `.agents/hooks/` scripts
  are merged during the otherwise atomic `.agents/` replacement so
  project-owned hooks survive updates.
- `.agents/.kit-target` is a marker file whose content is the target name; it is
  the source of truth for `detectInstalledTarget`.

## Installation Boundaries

- Treat `templates/` as package data; preserve relative paths during
  publication and installation.
- Edit shared executable scripts under `shared/runtime/`, then run
  `npm run sync:shared-runtime` to refresh their committed copies under both
  target templates.
- Edit and test the Backlog integration under `backlog-mcp/`. It is not copied
  into target templates or included in the npm package.
- Keep target-specific metadata such as `SKILL.md`, Codex `agents/openai.yaml`,
  environment files, and runtime logs outside the shared source.
- Edit shared lifecycle policy and adapters under `shared/hooks/`, then run
  `npm run sync:shared-hooks` to refresh committed target copies.
- Install uses mirror ownership rules: `.agents/` is replaced except for
  merged Gemini hook customizations, `.codex/` is merged, and top-level root
  instruction files honour the overwrite flag.
- `init` is destructive (replaces install folder and, on switch/force, root
  instructions) and gates destructive actions behind a confirmation prompt or
  `--force`.
- On target switch, the previous target's root instruction files are deleted
  before installing the new target.
- `update` refreshes `.agents/`, updates kit-managed Codex and Gemini hooks
  through structured merges, and preserves existing root instruction files.
- The CLI does not modify `.gitignore`; users manage it themselves.

## Instruction Hierarchy

```text
target/AGENTS.md
  repository-wide workflow and skill loading

target/.codex/hooks.json
  warning-only lifecycle guardrails merged with project hooks

target/.agents/hooks.json
  Gemini Antigravity lifecycle adapter using the same shared guard policy

target/.agents/AGENTS.md
  maintenance rules scoped to the installed toolkit

target/.agents/skills/*/SKILL.md
  domain-specific procedures loaded on demand
```

External systems such as Repository Harness may append marked blocks to the
root instruction. Toolkit updates must not remove those project-specific
sections.

## Change Impact

When changing installer behavior, inspect together:

- `bin/index.js`
- `README.md`
- the affected target folder under `templates/<target>/`
- `package.json` package inclusion rules

When changing skill discovery or toolkit structure, update
`templates/codex/.agents/ARCHITECTURE.md`.

## Validation Ladder

```text
CLI syntax        -> node --check bin/index.js
CLI contract      -> node bin/index.js <command> --help
package contents  -> npm pack --dry-run --json
template layout   -> copy into a temporary target and inspect paths
toolkit behavior  -> run the narrowest bundled validator or test suite
```
