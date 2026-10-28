# Codex Kit Architecture

> Comprehensive AI Agent Skill & Dynamic Capability Toolkit — 2026.6.12

---

## 📋 Overview

Codex Kit is a modular toolkit organized around a unified, composable
**Modular Skill Architecture**. It replaces the legacy multi-agent routing
model with skill directories that can be loaded on demand.

The kit contains:
- **14 Composable Skills** - Task-focused knowledge, procedures, and scripts under `skills/`.
- **Gemini-only skills** - Extra skills in `skills/`, installed only when the project selects the Gemini agent.
- **4 Master Scripts** - System-level automation and validation scripts under `scripts/`.

---

## 🏗️ Directory Structure

Each agent's files exist only when the project selects that agent
(`install --agent claude,codex,gemini`; the default is `claude,codex`).

```plaintext
AGENTS.md                     # Codex: repository-wide workflow and skill rules
CLAUDE.md                     # Claude Code: the same rules
GEMINI.md                     # Gemini: the same rules plus Gemini-only skill notes
.codex/                       # Codex
├── hooks.json               # Lifecycle hook registration
└── hooks/
    ├── harness_guard.py     # Shared warning-only Harness policy
    └── codex_adapter.py     # Codex payload and response adapter
.claude/                      # Claude Code
├── settings.json            # Lifecycle hook registration
└── skills/                  # Links to .agents/skills/<name>
.agents/
├── ARCHITECTURE.md          # This file (Human-developer map)
├── hooks.json               # Gemini lifecycle hook registration
├── claude/hooks/            # Claude guard and adapter
├── gemini/hooks/            # Gemini guard and adapter
├── skills/                  # 14 Composable Skills, plus Gemini-only ones with Gemini
│   ├── {skill-name}/
│   │   ├── SKILL.md         # name + description frontmatter, then instructions
│   │   ├── agents/
│   │   │   └── openai.yaml  # Codex UI metadata
│   │   ├── references/      # Deep domain documentation
│   │   └── scripts/         # Skill-level utility scripts
├── rules/                   # Gemini: Antigravity workspace rules
└── scripts/                 # Master validation and automation scripts
```

The hook files are generated from the repository-level `shared/hooks/`
canonical source. Edit that source and run `npm run sync:shared-hooks`.

## Instruction Scope

Each agent reads its own root instruction for repository-wide workflow and
skill-loading rules. The kit owns only the `KIT` block in each of them.

Kit updates refresh the selected agents' files, merge kit-managed hook entries
into `.codex/hooks.json`, `.agents/hooks.json`, and `.claude/settings.json`,
and preserve the rest of each root instruction so project-specific rules and
external Harness blocks are not lost. Removing an agent
(`remove --agent <name>`) takes out its block, hook entries, and unmodified
files.

---

## 🧩 The 14 Composable Skills

Every capability is a skill: a folder with a `SKILL.md` that the agent loads
when its `description` matches the task. Skills follow
`docs/skills/SKILL_STANDARD.md` in the kit repository. Named profiles in
`kit.json` install a subset.

Codex and Antigravity read `skills/`; Claude Code links the skills that are
not Gemini-only. Gemini-only skills cover work Claude Code and Codex already handle
natively: `clean-code`, `verify-changes`, `code-review-checklist`, `explorer-agent`, `debugger`,
`lint-and-validate`, `devops-engineer`, `mcp-builder`, and
`documentation-writer`. They install into `skills/` only when the project
selects Gemini, so Codex sees them only in those projects.

| Area | Skills |
| :--- | :--- |
| **Core workflow** | `security-auditor`, `ambiguity-decisions`, `structural-refactor` |
| **Web frontend** | `frontend-design`, `web-design-guidelines`, `react-refactor-patterns`, `performance-profiling`, `seo-fundamentals`, `i18n-localization` |
| **Backend and data** | `backend-specialist`, `api-patterns`, `database-design` |
| **Testing** | `risk-based-testing`, `webapp-testing` |

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
activate the Gemini-only `devops-engineer` unless they directly involve deployment, CI/CD,
production infrastructure, server access, rollback, or release management.
The Gemini-only `documentation-writer` is explicit-only: it runs when
documentation is requested.

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
