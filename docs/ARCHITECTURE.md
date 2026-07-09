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
  CLI configuration, install, update, repair, and status commands

templates/
  Generated installer layout: root instructions, shared .agents/ runtime,
  Codex hooks, Gemini hooks/runtime, and Claude Code settings/hooks

shared/hooks/
  Canonical Harness guard policy plus tool-specific lifecycle adapters

shared/runtime/
  Canonical source for executable scripts shared by installed runtimes

backlog-mcp/
  Workstation-local stdio MCP server and centralized Backlog runtime/state;
  registered separately with Claude Code, Codex, or another MCP client

docs/
  Repository Harness policy, product contracts, stories, and decisions
```

## Installer Layout

`init`, `update`, and `repair` install the supported coding-agent runtimes
side-by-side from the generated `templates/` layout. The installer performs
structured merges for tool-owned config files and direct refreshes for runtime
folders.

- Top-level files (e.g. `AGENTS.md`, `GEMINI.md`) are Root Instruction Files,
  copied to the project root.
- The `.agents/` subdirectory is the install folder, copied to `project/.agents/`.
- The Codex `.codex/` subdirectory contains lifecycle hooks. It is merged into
  `project/.codex/`; existing project config and unrelated hooks are preserved.
- The Gemini `.agents/hooks.json` lifecycle entry and `.agents/hooks/` scripts
  are merged during the otherwise atomic `.agents/` replacement so
  project-owned hooks survive updates.
- Claude Code `.claude/settings.json` hook groups are merged into
  `project/.claude/settings.json`; unrelated Claude settings and custom hooks
  are preserved.

## Installation Boundaries

- Treat `templates/` as package data; preserve relative paths during
  publication and installation.
- Edit shared executable scripts under `shared/runtime/`, then run
  `npm run sync:shared-runtime` to refresh their committed copies under both
  target templates.
- Edit and test the Backlog integration under `backlog-mcp/`. It is not copied
  into target templates or included in the npm package.
- Keep tool-specific metadata such as `SKILL.md`, Codex `agents/openai.yaml`,
  environment files, and runtime logs outside the shared source.
- Edit shared lifecycle policy and adapters under `shared/hooks/`, then run
  `npm run sync:shared-hooks` to refresh committed target copies.
- Install uses mirror ownership rules: `.agents/skills`, `.agents/gemini`, and
  `.agents/claude` are refreshed from templates; `.codex/`,
  `.agents/hooks.json`, and `.claude/settings.json` are merged; top-level root
  instruction files honour the overwrite flag.
- `init` replaces runtime folders and, with `--force`, root instructions. It
  gates existing AI Kit files behind a confirmation prompt unless `--force` is
  supplied.
- `update` refreshes runtime folders, updates kit-managed Codex, Gemini, and
  Claude Code hooks through structured merges, and preserves existing root
  instruction files.
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

templates/.agents/AGENTS.md
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
