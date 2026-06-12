# Overview

> Spec source: `docs/specs/multi-target-registry/SPEC.md`

## Current Behavior

The `hieund-ai-kit` CLI selects between two hardcoded toolkits using a boolean
`--gemini` flag. `getFolderConfig(isGemini)` returns one of two configs. Templates
live in `templates/.codex/`, `templates/.antigravity/`, and `templates/root/`.
Target detection in `status` guesses by inspecting installed folder shape.

## Target Behavior

A data-driven `TARGET_REGISTRY` maps target names to config objects. The CLI
accepts `--target <name>` (`-t`). Templates are restructured into mirror-layout
folders (`templates/codex/`, `templates/gemini/`) that copy directly to the
project root. A marker file `.agents/.kit-target` records the installed target
for reliable detection. `init` handles conflicts (same target, target switch,
file collision) with confirmation prompts; `update` auto-detects the installed
target and refreshes `.agents/` only, preserving root instructions.

## Affected Users

- CLI end users installing/updating kits in their projects.
- Kit maintainers adding new targets (e.g., Claude Code) in the future.

## Affected Product Docs

- `README.md`
- `docs/ARCHITECTURE.md`

## Non-Goals

- Claude Code target implementation (registry must accommodate it, not ship it).
- `.gitignore` management (removed; user-managed).
- Skill subset selection (always full install).
- Multi-target parallel install (one project = one tool).
- Automated test framework / property-based tests (manual validation only).
