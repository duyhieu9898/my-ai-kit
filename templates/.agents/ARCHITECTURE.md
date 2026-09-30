# Codex Kit Architecture

> Comprehensive AI Agent Skill & Dynamic Capability Toolkit — 2026.6.12

---

## 📋 Overview

Codex Kit is a modular toolkit organized around a unified, composable
**Modular Skill Architecture**. It replaces the legacy multi-agent routing
model with skill directories that can be loaded on demand.

The kit contains:
- **26 Composable Skills** - Task-focused knowledge, procedures, and scripts under `skills/`.
- **4 Master Scripts** - System-level automation and validation scripts under `scripts/`.

---

## 🏗️ Directory Structure

```plaintext
AGENTS.md                     # Repository-wide workflow and skill rules
.codex/
├── hooks.json               # Codex lifecycle hook registration
└── hooks/
    ├── harness_guard.py     # Shared warning-only Harness policy
    └── codex_adapter.py     # Codex payload and response adapter
.claude/
└── settings.json            # Claude Code lifecycle hook registration
.agents/
├── AGENTS.md                # Rules scoped to shared toolkit maintenance
├── ARCHITECTURE.md          # This file (Human-developer map)
├── claude/
│   └── hooks/
│       ├── harness_guard.py # Shared warning-only Harness policy
│       └── claude_adapter.py # Claude payload and response adapter
├── skills/                  # 26 Composable Skills
│   ├── {skill-name}/
│   │   ├── SKILL.md         # name + description frontmatter, then instructions
│   │   ├── agents/
│   │   │   └── openai.yaml  # Codex UI metadata
│   │   ├── references/      # Deep domain documentation
│   │   └── scripts/         # Skill-level utility scripts
└── scripts/                 # Master validation and automation scripts
```

The hook files are generated from the repository-level `shared/hooks/`
canonical source. Edit that source and run `npm run sync:shared-hooks`.

## Instruction Scope

Codex reads the root `AGENTS.md` for repository-wide workflow and skill-loading
rules. When changing files under `.agents/`, the nested `.agents/AGENTS.md`
adds toolkit-maintenance constraints without duplicating the root rules.

The CLI sources these files separately:

- `templates/AGENTS.md` installs as root `AGENTS.md`.
- `templates/GEMINI.md` installs as root `GEMINI.md`.
- `templates/CLAUDE.md` installs as root `CLAUDE.md`.
- `templates/.codex/` merges into root `.codex/` without replacing
  unrelated project configuration or custom hooks.
- `templates/.claude/settings.json` merges into root `.claude/settings.json`
  without replacing unrelated Claude settings or custom hooks.
- `templates/.agents/AGENTS.md` installs as `.agents/AGENTS.md`.

Kit updates refresh runtime folders, merge kit-managed `.codex/`,
`.agents/hooks.json`, and `.claude/settings.json` hooks, and preserve existing
root instructions so project-specific rules and external Harness blocks are not
lost.

---

## 🧩 The 26 Composable Skills

Every capability is a skill: a folder with a `SKILL.md` that the agent loads
when its `description` matches the task. Skills follow
`docs/skills/SKILL_STANDARD.md` in the kit repository. Named profiles in
`kit.json` install a subset.

| Area | Skills |
| :--- | :--- |
| **Core workflow** | `clean-code`, `verify-changes`, `debugger`, `explorer-agent`, `lint-and-validate`, `code-review-checklist`, `security-auditor` |
| **Web frontend** | `frontend-design`, `web-design-guidelines`, `nextjs-react-expert`, `react-refactor-patterns`, `performance-profiling`, `seo-fundamentals`, `i18n-localization` |
| **Backend and data** | `backend-specialist`, `api-patterns`, `database-design`, `mcp-builder` |
| **Testing** | `testing-patterns`, `webapp-testing` |
| **Planning** | `plan-writing`, `project-planner`, `product-manager`, `architecture` |
| **Operations and docs** | `devops-engineer`, `documentation-writer` |

---

## ⚡ Skill Discovery

```plaintext
User request → agent compares it with every skill's `description` → loads the matching SKILL.md
```

1. Each `SKILL.md` has frontmatter with `name` and `description` only.
2. The description says what the skill does, when to use it, and at most one
   sibling it should not be confused with.
3. The body loads only after selection; `references/` load only when the body
   says to read them.

Negative routing boundaries are part of skill discovery. In particular,
routine Git inspection, commit, branch, tag, pull, and push operations do not
activate `devops-engineer` unless they directly involve deployment, CI/CD,
production infrastructure, server access, rollback, or release management.
`documentation-writer` is explicit-only: it runs when documentation is
requested.

---

## 🛠️ Master Validation Scripts (4)

The scripts under `scripts/` automate testing, audits, and performance checks. All script configurations are fully aligned to `.agents/`.

### 1. `checklist.py` (Core validation)
Runs basic sanity checks (Security, Code Quality, Schema checks) during active development.
```bash
python3 .agents/scripts/checklist.py .
```

### 2. `verify_all.py` (Full release audit)
Runs the entire verification suite including Lighthouse performance, accessibility audits, and Playwright E2E tests before staging/deploying.
```bash
python3 .agents/scripts/verify_all.py . --url http://localhost:3000
```

### 3. `auto_preview.py`
Generates live dev server previews and screenshots.

### 4. `session_manager.py`
Prints project status and package metadata for the current session. It does
not currently write memory files.

---

## 🔗 Quick Reference

When adding or changing skills, follow the directory shape documented here and
the maintenance rules in `.agents/AGENTS.md`.
