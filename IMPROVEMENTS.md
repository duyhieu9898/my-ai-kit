# Improvements Backlog

This file tracks planned improvements for the AI kit installer and runtime layout.

---

## 🚀 Profile Switch For Multiple Agent Runtimes

### Problem Statement

Both Codex and Gemini Antigravity can use workspace skills, but their native discovery paths overlap around `.agents/skills/`.

If Codex-specific skills and Gemini Antigravity-specific skills are installed simultaneously into the same `.agents/skills/` folder, agents may read or select skills intended for another runtime, causing context pollution and incorrect behaviors.

If skills are stored in target-specific directories (e.g. `.agents/codex/skills/` and `.agents/gemini/skills/`), auto-discovery will fail for runtimes that only scan `.agents/skills/`.

### Resolution Design

Use a profile-switch mechanism where both runtimes are installed under local profile storage, and only the active profile's skills are mirrored/copied into `.agents/skills/`.

#### Folder Structure Layout

```text
.agents/
├── skills/              # ACTIVE Profile's skills folder (copied from profiles/<active>)
├── scripts/             # Shared runtime scripts
├── profiles/            # Inactive profile storage
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

### Design Decisions

1. **Active Target State:** 
   - Centralized in the root `.ai-kit.json` via the `"target"` field (e.g. `"target": "codex"`). There is no need for a separate `.agents/profile.json`.
2. **File Ownership Manifest Coexistence:**
   - Both `AGENTS.md` and `GEMINI.md` root instruction files can coexist at the project root safely.
   - When switching profiles, the CLI only refreshes or appends the `KIT` block in the corresponding instruction file (`AGENTS.md` for codex, `GEMINI.md` for gemini).
3. **Portability (Copy vs Symlink):**
   - Profile activation will **copy/mirror** files from `profiles/<target>/skills/` to `skills/`. This avoids permission and portability issues of symbolic links on Windows, Docker, and sandboxed runtimes.
4. **Shared Scripts:**
   - Common utilities and hooks will be located in the shared folders, while target-specific agent definitions and workflows remain in their respective profile folders.

### CLI Profile Commands

```bash
hieund-ai-kit profile list
# Lists available profiles (codex, gemini) and indicates which one is active.

hieund-ai-kit profile use <target>
# Activates the selected profile:
# 1. Clears .agents/skills/
# 2. Copies files from .agents/profiles/<target>/skills/ to .agents/skills/
# 3. Updates the "target" field in the root .ai-kit.json
# 4. Updates/appends the KIT block in the target's root instruction file
```

---

## 📅 Action Plan for Next Session

- [ ] Implement `profile` subcommands in `bin/index.js` (`list` and `use`).
- [ ] Update `init` and `update` logic to populate the `.agents/profiles/` directory instead of installing directly to `.agents/`.
- [ ] Add unit/regression tests to verify profile switching, file mirroring, and root instruction block updates.
