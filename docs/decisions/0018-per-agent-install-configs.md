# 0018 One Template Tree With Per-Agent Install Configs

Date: 2026-10-28

## Status

Accepted. Supersedes ADR 0017; amends ADR 0015.

## Context

Every install wrote the root instruction, hook registration, and hook scripts
of Claude Code, Codex, and Gemini, whichever tools the project used. Profiles
chose only skills. Gemini-only skills were a second template folder behind a
`--gemini` flag (ADR 0017), and `harness_guard.py` existed three times in the
template. Which agent received which file was hard-coded in
`lib/integrations.js`.

## Decision

- The template is one tree with no duplicated file: `skills/`, `instructions/`,
  `hooks/`, `rules/`, `scripts/`. Tool-specific files remain only where each
  tool needs its own format (root instruction, hook registration, adapter).
- `templates/agents/<agent>.json` declares what an agent installs:
  `instruction`, `hooks`, `files` (source to destination), an optional skill
  link folder, and `exclusiveSkills`. `templates/agents/shared.json` lists files
  every install gets. Configs only map paths; how a file is merged stays in
  code.
- `selection.agents` records the agents. `install --agent` adds them (a first
  install defaults to `claude,codex`); `remove --agent` drops them.
- A skill in some agent's `exclusiveSkills` installs only while that agent is
  selected. Its record stores `agents`, and Claude links only skills not
  exclusive to other agents. This replaces `templates/gemini-skills/`,
  `selection.gemini`, and `--gemini`.
- Every file in `files` is hash-managed. A run deletes an unmodified kit file
  that no selected agent wants, which covers removed agents and files dropped
  between versions; removing an agent also strips its `KIT` block and kit hook
  entries.
- A manifest without `selection.agents` gets all three agents, since earlier
  versions installed all of them; on that run unrecorded files count as
  kit-owned.

## Alternatives Considered

1. A global `--agents` flag over the old layout. Keeps agent paths in code and
   the duplicated hook scripts.
2. A component graph in `kit.json` (profiles referencing rules, hooks, and
   skills). More flexible than needed; the user prefers flat lists.

## Consequences

Positive:

- A project contains only the files of the agents it uses.
- Adding an agent later, or removing one, is one command.
- Adding a fourth agent is a new config file plus, if its hook format differs,
  a merge function.

Tradeoffs:

- Codex and Gemini share `.agents/skills/`, so with both selected Codex also
  sees Gemini's exclusive skills.
- 4.x and pre-release 5.0 projects keep Gemini after `update` until they run
  `remove --agent gemini`.
- `uninstall` (removing every agent and the manifest) is not provided yet.

## Follow-Up

- None.
