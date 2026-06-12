# 0012 Target Registry Pattern

Date: 2026-06-12

## Status

Accepted

## Context

The CLI selected toolkits with a boolean `--gemini` flag and a two-branch
`getFolderConfig(isGemini)`. Adding more AI tools (Claude Code planned) would
require a new boolean flag per tool and branching logic, which does not scale.
Template detection also guessed the installed target by folder shape, which is
ambiguous against hand-written root instruction files (this repo itself has a
hand-written root `AGENTS.md`).

## Decision

Adopt a data-driven `TARGET_REGISTRY` keyed by target name, exposed via a
`--target <name>` option. Restructure templates into mirror-layout folders
(`templates/<target>/`) copied directly to the project root. Record the installed
target in a marker file `.agents/.kit-target` for reliable detection. One project
installs one target; `init` is destructive and replaces everything (with
confirmation or `--force`); `update` refreshes `.agents/` only and preserves root
instructions.

## Alternatives Considered

1. Add a boolean flag per tool (`--claude`, etc.) — does not scale, rejected.
2. Manifest file per template declaring root files — extra maintenance, rejected
   in favor of convention + marker.
3. Detect installed target by inspecting folder shape — ambiguous against
   hand-written files, rejected in favor of the `.kit-target` marker.

## Consequences

Positive:

- Adding a target is one registry entry plus one template folder.
- Install logic collapses to a single mirror-copy operation.
- Reliable target detection independent of hand-written root files.

Tradeoffs:

- Breaking change: template folder names change (`.codex` → `codex`,
  `.antigravity` → `gemini`); no backward compatibility for old paths.
- `init` performs destructive deletion of `.agents/` and old root instructions;
  mitigated by confirmation prompts and `--force` gating.
- `.gitignore` is no longer managed by the CLI (user-managed).

## Follow-Up

- Add Claude Code target when needed (registry entry + `templates/claude/`).
- Human performs deep behavioral testing after implementation.
