# 0014 File Ownership Manifest

Date: 2026-06-29

## Status

Accepted

## Context

As the AI-agent toolkits scale, multiple components (such as the repository harness, Codex adapters, Gemini adapters, and project-owned customizations) need to coexist in the same files/folders. Without a clear contract on which files are owned by the kit (and can be safely overwritten on updates) and which are owned by the target project (and must be preserved), updates and repairs will overwrite user-made instructions or hooks, leading to broken setups.

For example, `AGENTS.md` merging previously treated the incoming kit template as the base, deleting any user-defined project instructions outside of marked blocks.

## Decision

We establish a clear File Ownership Manifest defining the owner and merge rules for each component:

| Component / Path | Owner | Install / Update Rule |
| --- | --- | --- |
| `AGENTS.md` / `GEMINI.md` | **Project** | **Kit only modifies its own marked block (`KIT`).** The project's existing file is treated as the base, preserving user custom instructions. |
| `.agents/` | **Kit** | **Kit-owned, atomic replace on update.** Replaced completely (except for Gemini hooks structured merge). |
| `.codex/hooks.json` | **Project** | **Structured Merge.** Merges kit-owned hooks and preserves project-owned hooks. |
| `.agents/hooks.json` | **Project** | **Structured Merge.** Merges kit-owned hook entries and preserves project-owned hooks. |
| `docs/HARNESS.md` | **Harness** | **Harness-owned.** Not modified or overwritten by the Kit; preserved. |

We will wrap target root instruction templates in `<!-- KIT:BEGIN -->` and `<!-- KIT:END -->` tags, and update `index.js` block-merging logic to treat the project's existing file as the base.

## Alternatives Considered

1. **Keep Kit-owned root instructions with block-preservation:** Requires the user to wrap all custom guidelines in custom blocks (e.g. `<!-- USER:BEGIN -->`). This is tedious and counter-intuitive since users expect to freely edit `AGENTS.md` at the project root.

## Consequences

Positive:

- Complete safety for user-defined instructions in `AGENTS.md`/`GEMINI.md` outside marked blocks.
- Clear contract prevents accidental deletion of project-specific customizations.
- Unified merge algorithm that handles both old format (backward compatibility) and new block format.

Tradeoffs:

- Root instruction templates must now be wrapped in `<!-- KIT:BEGIN -->` blocks.

## Follow-Up

- Run regression tests to verify that custom headers/texts in project `AGENTS.md` are preserved.
