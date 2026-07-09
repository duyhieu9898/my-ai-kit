# Product Overview

`hieund-ai-kit` installs reusable Codex, Gemini Antigravity, and Claude Code
tooling into a target repository.

## User Contract

- `init` installs all supported runtimes into `.agents/`.
- Codex installs repository-wide `AGENTS.md` separately from
  `.agents/AGENTS.md`.
- Gemini installs repository-wide `GEMINI.md` separately from its toolkit.
- Claude Code installs repository-wide `CLAUDE.md` separately from its hook
  adapter runtime.
- Existing toolkit directories require confirmation unless `--force` is used.
- `update` refreshes `.agents/` while preserving existing root instructions.
- `status` reports active and obsolete toolkit locations.
- Installation does not modify `.gitignore`; users manage ignore rules
  themselves.

## Safety Contract

- Preserve existing root instructions unless overwrite is explicitly requested.
- Keep project-specific Harness or local instruction blocks during updates.
- Do not package local credentials, caches, logs, or runtime databases.
- Keep all files required by an installation inside the published npm package.

## Validation Contract

- Use `npm run verify` as the standard local verification entrypoint for the
  kit repository.
- Validate CLI syntax and help output.
- Inspect npm package contents before release.
- Test installation layout in an isolated target directory.
- Run skill-specific validation when changing bundled skills.

## Current Capabilities

| Capability | Contract | Proof owner |
| --- | --- | --- |
| CLI command surface | Expose `init`, `update`, and `status` with documented options | `KIT-001` |
| Unified toolkit package | Publish Codex, Gemini Antigravity, and Claude Code templates | `KIT-002`, `KIT-026` |
| Instruction safety | Keep repository and nested toolkit instructions separate | `KIT-003` |
| Installation detection | Report active and obsolete toolkit locations | `KIT-004` |
| Backlog integration | Provide one workstation-local MCP runtime outside installed templates | `KIT-024` |
| Proportional verification | Select checks based on change surface and risk | `KIT-006` |
| Scoped clean-code guidance | Keep implementation guidance focused and local | `KIT-007` |
| Unified runtime installer | Install all supported coding-agent runtimes side-by-side | `KIT-026` |
