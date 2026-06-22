# Codex Kit Architecture

> Comprehensive AI Agent Skill & Dynamic Capability Toolkit — 2026.6.12

---

## 📋 Overview

Codex Kit is a modular toolkit organized around a unified, composable
**Modular Skill Architecture**. It replaces the legacy multi-agent routing
model with skill directories that can be loaded on demand.

The kit contains:
- **49 Composable Skills** - Direct domain-specific knowledge packages and expert personas under `skills/`.
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
.agents/
├── AGENTS.md                # Rules scoped to shared toolkit maintenance
├── ARCHITECTURE.md          # This file (Human-developer map)
├── skills/                  # 49 Composable Skills (Expert Personas + Domain Knowledge)
│   ├── {skill-name}/
│   │   ├── SKILL.md         # Metadata, triggers, and prompt guidelines
│   │   ├── agents/
│   │   │   └── openai.yaml  # Brand interface configuration
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

- `templates/codex/AGENTS.md` installs as root `AGENTS.md`.
- `templates/codex/.codex/` merges into root `.codex/` without replacing
  unrelated project configuration or custom hooks.
- `templates/codex/.agents/AGENTS.md` installs as `.agents/AGENTS.md`.

Kit updates replace `.agents/`, merge kit-managed `.codex/` hooks, and preserve
an existing root instruction so project-specific rules and external Harness
blocks are not lost.

---

## 🧩 The 49 Composable Skills

In Codex, the boundary between "agents" and "skills" is dissolved. Every specialist capability or expert persona is implemented as a **Skill** that the unified AI engine can dynamically load into its context.

### 🎭 Expert Persona Skills (13)
These skills contain specialized persona prompts, deep domain methodologies, and dynamic color branding for the Codex UI.

| Skill | Focus | Primary Invocation / Triggers |
| :--- | :--- | :--- |
| `project-planner` | Self-contained initiative roadmaps | Major features, new projects, migrations, cross-module plans |
| `frontend-specialist` | Advanced web UI/UX & performance | React, Next.js, component design, responsive UI |
| `backend-specialist` | Scaleable APIs & serverless logic | Server-side development, endpoint design, auth |
| `database-architect` | High-efficiency database & schemas | Prisma, Drizzle, migrations, query performance |
| `devops-engineer` | CI/CD, containerization & cloud infra | Docker, PM2, deployment pipelines, Nginx |
| `security-auditor` | Security compliance & vulnerabilities | OWASP, auth audits, static analysis review |
| `test-engineer` | Testing architectures & coverage | Vitest, E2E testing, TDD workflow, Jest |
| `debugger` | Systematic root-cause analysis | Complex bug investigation, system crashes |
| `performance-optimizer` | Web speed & Core Web Vitals | Lighthouse audits, bundle size optimization |
| `seo-specialist` | Page ranking & search visibility | SEO tags, structured data, web vitals |
| `documentation-writer` | Professional documentation & guides | API docs, user guides, README files |
| `product-manager` | Business logic, user stories & backlog/MVP | Feature specifications, user flows, RICE prioritization |
| `qa-automation-engineer` | E2E automation & regression pipelines| Playwright runners, visual regression |

---

### 🧩 Domain Knowledge Skills (36)
These skills provide specific instructions and toolsets to guide implementation in target technologies and patterns.

| Domain Category | Skills Included |
| :--- | :--- |
| **Frontend & UI** | `react-refactor-patterns`, `web-design-guidelines`, `tailwind-patterns`, `frontend-design`, `seo-fundamentals`, `i18n-localization`, `playwright-pitfalls`, `playwright-pro-patterns`, `webapp-testing`, `nextjs-react-expert`, `ui-ux-pro-max` |
| **Backend & API** | `api-patterns`, `nodejs-best-practices`, `python-patterns`, `database-design`, `mcp-builder` |
| **Testing & QA** | `testing-patterns`, `tdd-workflow`, `verify-changes`, `lint-and-validate`, `clean-code`, `performance-profiling`, `systematic-debugging` |
| **Security & Audits** | `vulnerability-scanner`, `code-review-checklist`, `code-review-graph` |
| **Planning & Design** | `app-builder`, `architecture`, `plan-writing`, `brainstorming` |
| **Infrastructure** | `deployment-procedures`, `server-management` |
| **System Operations** | `batch-operations`, `simplify-code`, `code-archaeologist`, `explorer-agent` |

---

## ⚡ Dynamic Skill Discovery (Standard native)

```plaintext
User Intent / Prompt → Scan Frontmatter `description` → Auto-inject relevant SKILL.md
```

Unlike legacy systems that required hard-routed agent scripts or manual loading
tables, this toolkit uses skill metadata for selective loading:
1. Each `SKILL.md` has frontmatter with a `description`.
2. Matching skills can be loaded for the current task, while unrelated
   references stay out of context.
3. Skill files use Content Maps and Related Skills tables to support
   progressive disclosure.

Negative routing boundaries are part of skill discovery. In particular,
routine Git inspection, commit, branch, tag, pull, and push operations do not
activate `devops-engineer` unless they directly involve deployment, CI/CD,
production infrastructure, server access, rollback, or release management.

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
