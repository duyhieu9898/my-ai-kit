# Product Overview

`hieund-ai-kit` installs reusable Codex or Gemini Antigravity tooling into a
target repository.

## User Contract

- `init` installs the selected toolkit into `.agents/`.
- Codex installs repository-wide `AGENTS.md` separately from
  `.agents/AGENTS.md`.
- Gemini installs repository-wide `GEMINI.md` separately from its toolkit.
- Existing toolkit directories require confirmation unless `--force` is used.
- `update` refreshes `.agents/` while preserving existing root instructions.
- `status` reports active and obsolete toolkit locations.
- Installation adds `.agents` to the target `.gitignore` without duplicate
  entries.

## Safety Contract

- Preserve existing root instructions unless overwrite is explicitly requested.
- Keep project-specific Harness or local instruction blocks during updates.
- Do not package local credentials, caches, logs, or runtime databases.
- Keep all files required by an installation inside the published npm package.

## Validation Contract

- Validate CLI syntax and help output.
- Inspect npm package contents before release.
- Test installation layout in an isolated target directory.
- Run skill-specific validation when changing bundled skills.

## Current Capabilities

| Capability | Contract | Proof owner |
| --- | --- | --- |
| CLI command surface | Expose `init`, `update`, and `status` with documented options | `KIT-001` |
| Dual toolkit package | Publish Codex and Gemini Antigravity templates | `KIT-002` |
| Instruction safety | Keep repository and nested toolkit instructions separate | `KIT-003` |
| Installation detection | Report active and obsolete toolkit locations | `KIT-004` |
| Backlog integration | Ship a validated Backlog workflow skill | `KIT-005` |
