# Per-Agent Install Configs

Date: 2026-10-28
Status: Accepted

## Goal

Keep one template tree with no duplicated files, declare in one config file per
agent what that agent receives, and install only what the selected agents need.
Adding an agent later installs its part; removing it deletes its part.

Success criteria:

- Every template file exists once. `harness_guard.py` is no longer synced into
  three template folders.
- What an agent receives is readable from `templates/agents/<agent>.json`
  alone; no agent-specific paths stay hard-coded in `lib/integrations.js`.
- `install --agent claude` writes no Codex or Gemini file, and no Gemini-only
  skill.
- `install --agent gemini` on a project that has Claude adds Gemini's files and
  skills and leaves Claude's alone.
- `remove --agent gemini` deletes the kit's unmodified Gemini files, strips the
  kit's Gemini hook entry and `KIT` block, and keeps locally modified files with a
  warning.
- `update` on a 4.x or pre-release 5.0 project deletes nothing the project
  uses today.

## Context

Today `installIntegrations` installs every agent's root instruction, hook
config, and hook scripts on every run. Profiles only choose skills. Gemini-only
skills are a second template folder (`templates/gemini-skills/`) behind a
`--gemini` flag (ADR 0017). Claude-only, Codex-only, and Gemini-only files are
spread over `templates/.claude/`, `templates/.codex/`, and
`templates/.agents/{claude,gemini,rules}/`, and `harness_guard.py` exists three
times, kept equal by `scripts/sync-shared-hooks.mjs`.

## Decisions

### Template layout

```text
templates/
├── kit.json                    # profiles, unchanged (flat skill lists)
├── agents/
│   ├── shared.json             # installed when at least one agent is selected
│   ├── claude.json
│   ├── codex.json
│   └── gemini.json
├── skills/<name>/              # all 23 skills in one folder
├── instructions/
│   ├── CLAUDE.md
│   ├── AGENTS.md
│   └── GEMINI.md
├── hooks/
│   ├── harness_guard.py        # the only template copy
│   ├── claude_adapter.py
│   ├── codex_adapter.py
│   ├── gemini_adapter.py
│   ├── claude.json             # hook registration in each tool's own format
│   ├── codex.json
│   └── gemini.json
├── rules/testing-workflow.md
├── scripts/                    # checklist.py, verify_all.py, ...
├── ARCHITECTURE.md
└── ux_audit.json
```

Install destinations do not change, so existing projects need no file moves.
`shared/hooks/harness_guard.py` stays the source for this repo's own
`.codex/hooks/`; the sync script writes `templates/hooks/harness_guard.py`
instead of three template copies.

Tool-specific files remain: each tool reads its own root instruction, hook
registration format, and adapter. Only duplicated content goes away.

### Agent config format

Configs only map sources to destinations. How a file is written (copy, merge a
`KIT` block, merge hook entries, link a skill) is chosen by the section it sits
in and stays in code.

```json
// templates/agents/claude.json
{
  "instruction": { "src": "instructions/CLAUDE.md", "dest": "CLAUDE.md" },
  "hooks": { "src": "hooks/claude.json", "dest": ".claude/settings.json" },
  "files": [
    { "src": "hooks/harness_guard.py", "dest": ".agents/claude/hooks/harness_guard.py" },
    { "src": "hooks/claude_adapter.py", "dest": ".agents/claude/hooks/claude_adapter.py" }
  ],
  "skills": { "link": ".claude/skills" }
}
```

```json
// templates/agents/gemini.json
{
  "instruction": { "src": "instructions/GEMINI.md", "dest": "GEMINI.md" },
  "hooks": { "src": "hooks/gemini.json", "dest": ".agents/hooks.json" },
  "files": [
    { "src": "hooks/harness_guard.py", "dest": ".agents/gemini/hooks/harness_guard.py" },
    { "src": "hooks/gemini_adapter.py", "dest": ".agents/gemini/hooks/gemini_adapter.py" },
    { "src": "rules/", "dest": ".agents/rules/" }
  ],
  "exclusiveSkills": [
    "clean-code", "code-review-checklist", "debugger", "devops-engineer", "documentation-writer",
    "explorer-agent", "lint-and-validate", "mcp-builder", "verify-changes"
  ]
}
```

```json
// templates/agents/shared.json
{
  "files": [
    { "src": "scripts/", "dest": ".agents/scripts/" },
    { "src": "ARCHITECTURE.md", "dest": ".agents/ARCHITECTURE.md" },
    { "src": "ux_audit.json", "dest": ".agents/ux_audit.json" }
  ]
}
```

- A `src` ending in `/` copies the folder's files one by one.
- Every entry in `files` is hash-managed like today's shared assets: a locally
  modified file is kept unless `--force`.
- `hooks` is merged with the existing per-tool merge (kit entries replaced,
  project entries kept). `instruction` merges the `KIT` block as today.
- Codex has no `skills` section: it reads `.agents/skills/` directly.

### Which skills install

All skills install into `.agents/skills/`, which Codex and Gemini both read.
A skill installs when both hold:

1. It is in a selected profile, named on the command line, or `--all` is set.
2. It is not exclusive to another agent: a skill listed in some agent's
   `exclusiveSkills` installs only when that agent is selected.

Naming an exclusive skill whose agent is not selected is an error that tells the
user which `--agent` to add. Claude links (`.claude/skills/<name>`) are made
only for skills that are not exclusive to another agent.

This replaces `templates/gemini-skills/`, the registry scopes,
`selection.gemini`, and `--gemini`. A record of an exclusive skill stores
`agents: ["gemini"]` so `status` can tell offline which skills Claude links.

Limit: Codex and Gemini share `.agents/skills/`, so with both selected Codex
also sees Gemini's exclusive skills. No layout avoids this.

### CLI and manifest

- `install --agent <names>` adds agents (comma-separated: `claude`, `codex`,
  `gemini`). `remove --agent <names>` removes them; removing the last agent is an
  error that points to uninstalling instead.
- A fresh install without `--agent` selects `claude,codex`, matching ADR 0017's
  default of Gemini off.
- The manifest stores `selection.agents`. `managedFiles` keeps its shape.
- Every run computes the wanted file set from the selected agents plus
  `shared.json`. A `managedFiles` entry outside that set is deleted when its hash
  still matches and kept with a warning otherwise. This one rule covers
  `remove --agent` and files the kit drops between versions.
- Removing an agent also strips the kit's hook entries from its hook config,
  strips the `KIT` block from its root instruction, deletes either file when
  nothing else is left in it, and removes its skill links.
- `remove --agent` runs the integration step, unlike `remove <skill>` today.
- `status` prints the selected agents and checks only their files and links.

### Migration

- A manifest without `selection.agents` (4.x and pre-release 5.0) gets all three
  agents, because those versions installed every agent's files. The user can
  then run `remove --agent gemini`.
- `selection.gemini` and `managedGeminiSkills` are read once and dropped; the
  `.agent/skills/` cleanup from ADR 0017 stays.
- Skill records replace `scope: "gemini"` with `agents: ["gemini"]`.
- Hook scripts were not hash-managed before. On the migrating run, a file the
  kit wants that exists but has no recorded hash counts as kit-owned.
- The cleanup of pre-4.0 `.agents/gemini/{skills,agents,workflows}`, which
  today happens as a side effect of replacing `.agents/gemini/`, becomes an
  explicit step of the migrating run.

## Out of Scope

- Per-agent skill content (one skill with different text per agent).
- New agents beyond Claude Code, Codex, and Gemini, though adding one becomes a
  new config file plus, if needed, a hook merge function.
- Changing install destinations.

## Work Outline

1. Move templates into the new layout, write the four agent configs, and point
   `sync-shared-hooks.mjs` and `check-template-consistency.mjs` at it.
2. Registry: one skills folder; load agent configs; validate that every `src`
   exists and every `exclusiveSkills` name is a skill.
3. Resolve and manifest: `selection.agents`, exclusive-skill filtering,
   migration.
4. Integrations: drive install and removal from the configs; delete stale
   managed files.
5. CLI and status: `--agent` on `install` and `remove`; drop `--gemini`.
6. Tests: unit tests per step; installer tests for single agent, adding an
   agent, removing an agent, and migration.
7. Docs: README, `docs/product/cli.md`, `toolkits.md`,
   `templates/.agents/ARCHITECTURE.md`, and a new ADR superseding ADR 0017.

## Resolved Questions

- A fresh install without `--agent` selects `claude,codex`.
- `uninstall` is left for a later change.
