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
  CLI configuration, install, update, and status commands

templates/.codex/
  Codex toolkit copied into the target `.agents/` directory

templates/.antigravity/
  Gemini Antigravity toolkit copied into the target `.agents/` directory

templates/root/
  Repository-level instruction files copied outside `.agents/`

docs/
  Repository Harness policy, product contracts, stories, and decisions
```

## Installation Boundaries

- Treat `templates/` as package data; preserve relative paths during
  publication and installation.
- Copy only the selected toolkit source into `.agents/`.
- Copy root instructions separately so nested toolkit rules and repository-wide
  rules can differ.
- Preserve an existing root instruction during `update`.
- Overwrite root instructions only during an explicit forced initialization.
- Append `.agents` and local Harness runtime artifacts to `.gitignore` without
  duplicating entries.

## Instruction Hierarchy

```text
target/AGENTS.md
  repository-wide workflow and skill loading

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
- `templates/root/`
- the selected toolkit root under `templates/`
- `package.json` package inclusion rules

When changing skill discovery or toolkit structure, update
`templates/.codex/ARCHITECTURE.md`.

## Validation Ladder

```text
CLI syntax        -> node --check bin/index.js
CLI contract      -> node bin/index.js <command> --help
package contents  -> npm pack --dry-run --json
template layout   -> copy into a temporary target and inspect paths
toolkit behavior  -> run the narrowest bundled validator or test suite
```
