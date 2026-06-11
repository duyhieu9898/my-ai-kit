# Improvements Backlog

This file tracks planned improvements for the AI kit installer and runtime layout.

## Profile Switch For Multiple Agent Runtimes

### Problem

Codex and Gemini Antigravity can both use workspace skills, but their native discovery paths overlap around `.agents/skills/`.

If Codex-specific skills and Gemini Antigravity-specific skills are installed into the same `.agents/skills/` folder, agents may read or select skills intended for another runtime.

If skills are namespaced instead, for example `.agents/codex/skills/` and `.agents/gemini/skills/`, the layout is cleaner but native auto-discovery may no longer work for runtimes that only scan `.agents/skills/`.

### Proposed Mechanism

Use profile switch mode:

```text
.agents/
├── skills/              # Active profile copied or linked here
├── profiles/
│   ├── codex/
│   │   ├── skills/
│   │   ├── scripts/
│   │   └── ARCHITECTURE.md
│   └── gemini/
│       ├── skills/
│       ├── agents/
│       ├── workflows/
│       ├── scripts/
│       └── ARCHITECTURE.md
└── shared/
```

Only one profile is active in `.agents/skills/` at a time. The inactive profiles remain stored under `.agents/profiles/`.

### CLI Commands

Potential commands:

```bash
hieund-ai-kit init
hieund-ai-kit init --gemini
hieund-ai-kit profile list
hieund-ai-kit profile use codex
hieund-ai-kit profile use gemini
hieund-ai-kit profile status
```

### Expected Behavior

- `profile use codex` activates Codex skills into `.agents/skills/` and writes or refreshes `AGENTS.md`.
- `profile use gemini` activates Gemini Antigravity skills into `.agents/skills/` and writes or refreshes `GEMINI.md`.
- The active profile can be copied or symlinked. Copying is more portable; symlinking is faster and avoids duplication but may be less reliable across OSes.
- The CLI should protect user changes before replacing `.agents/skills/`.
- The CLI should show the active profile in `hieund-ai-kit status`.

### Tradeoff

This does not allow simultaneous native auto-load for both runtimes from separate skill folders. Instead, it keeps native auto-discovery working by ensuring `.agents/skills/` always contains the currently active runtime profile.

### Open Questions

- Should profile activation copy files or create symlinks?
- Should the active profile be stored in `.agents/profile.json`?
- Should `AGENTS.md` and `GEMINI.md` both remain in the root, or should activation only install the selected root instruction?
- Should shared scripts live in `.agents/shared/scripts/` or be copied into each active profile?
