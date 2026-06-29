# Improvements Backlog

This file tracks planned improvements for the AI kit installer and runtime layout.

---

## 🚀 Asymmetric Coexistence For Multiple Agent Runtimes

### Problem Statement

Both Codex and Gemini Antigravity can use workspace skills, but their native discovery paths overlap around `.agents/skills/`.

If Codex-specific skills and Gemini Antigravity-specific skills are installed simultaneously into the same `.agents/skills/` folder, agents may read or select skills intended for another runtime, causing context pollution and incorrect behaviors.

### Resolution Design: Asymmetric Coexistence

Instead of physically switching profiles, both Codex and Gemini runtimes will coexist in the project simultaneously. Codex remains the **native root target** to ensure absolute backward compatibility, while Gemini is cleanly nested under `.agents/gemini/`.

#### Folder Structure Layout

```text
my-project/
├── .ai-kit.json                     # Root configuration file
├── AGENTS.md                        # Codex root instructions (project-owned)
├── GEMINI.md                        # Gemini root instructions (project-owned)
└── .agents/                         # Install directory
    ├── skills/                      # Codex-specific skills (flat at root)
    │   ├── api-patterns/
    │   ├── debugger/
    │   └── ...
    ├── scripts/                     # Shared scripts (identical across targets)
    │   ├── verify_all.py
    │   └── checklist.py
    ├── shared/                      # Shared assets (identical across targets)
    └── gemini/                      # Gemini nested runtime folder
        ├── skills/                  # Gemini-specific skills
        │   ├── project-planner/
        │   └── ...
        ├── agents/                  # Gemini agent configurations
        ├── workflows/               # Gemini workflows
        └── hooks.json               # Gemini hook configuration file
```

### Design Decisions

1. **Target Paths:**
   - **Codex:** Installed directly under `.agents/` (e.g. `.agents/skills/`, `.agents/scripts/`, etc.).
   - **Gemini:** Installed under `.agents/gemini/` (e.g. `.agents/gemini/skills/`, `.agents/gemini/agents/`, etc.).
2. **Shared Utilities:**
   - Folder `.agents/scripts/` and `.agents/shared/` contain shared utilities (like validation scripts, hooks, and checklists) that are identical between templates. Both targets share these files.
3. **Configuration & Versioning:**
   - The config `.ai-kit.json` tracks the active targets in the project.
   - Both targets share the same release tag, branch, or repository reference (`ref`).
4. **Agent Integration & Routing:**
   - `AGENTS.md` instructs the Codex agent to load skills from `.agents/skills/`.
   - `GEMINI.md` instructs the Gemini agent to load skills from `.agents/gemini/skills/`.
   - Both agents can run concurrently without any physical file switching or CLI profile commands.

---

## 📅 Action Plan for Next Session

- [ ] Update `init` and `update` commands in `bin/index.js` to install Codex flatly under `.agents/` and Gemini under `.agents/gemini/`.
- [ ] Align hook registration paths in `.agents/gemini/hooks.json` to point to `.agents/gemini/hooks/harness_guard.py`.
- [ ] Add unit/regression tests to verify that both targets are successfully installed and updated side-by-side, and that their respective instructions are correctly merged.
