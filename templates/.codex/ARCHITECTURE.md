# Codex Kit Architecture

> Comprehensive AI Agent Skill & Dynamic Capability Toolkit — 2026.5.22

---

## 📋 Overview

Codex Kit is a modular, high-efficiency toolkit built strictly according to the **OpenAI Codex Standard**. It replaces the legacy multi-agent routing model with a unified, composable **Modular Skill Architecture**. 

The kit contains:
- **67 Composable Skills** - Direct domain-specific knowledge packages and expert personas under `skills/`.
- **4 Master Scripts** - System-level automation and validation scripts under `scripts/`.
- **Cascading Memory** - Cross-session state and persistence under `memory/`.

---

## 🏗️ Directory Structure

```plaintext
.agents/
├── ARCHITECTURE.md          # This file (Human-developer map)
├── skills/                  # 67 Composable Skills (Expert Personas + Domain Knowledge)
│   ├── {skill-name}/
│   │   ├── SKILL.md         # Metadata, triggers, and prompt guidelines
│   │   ├── agents/
│   │   │   └── openai.yaml  # Brand interface configuration
│   │   ├── references/      # Deep domain documentation
│   │   └── scripts/         # Skill-level utility scripts
├── memory/                  # Persistent cross-session memory (MEMORY.md)
└── scripts/                 # Master validation and automation scripts
```

---

## 🧩 The 67 Composable Skills

In Codex, the boundary between "agents" and "skills" is dissolved. Every specialist capability or expert persona is implemented as a **Skill** that the unified AI engine can dynamically load into its context.

### 🎭 Expert Persona Skills (20)
These skills contain specialized persona prompts, deep domain methodologies, and dynamic color branding for the Codex UI.

| Skill | Focus | Primary Invocation / Triggers |
| :--- | :--- | :--- |
| `orchestrator` | Parallel task coordination & workers | Task decomposition, multi-domain coordinate |
| `project-planner` | Analysis, task breakdowns & roadmaps | Major features, new projects, project plans |
| `frontend-specialist` | Advanced web UI/UX & performance | React, Next.js, component design, responsive UI |
| `backend-specialist` | Scaleable APIs & serverless logic | Server-side development, endpoint design, auth |
| `database-architect` | High-efficiency database & schemas | Prisma, Drizzle, migrations, query performance |
| `mobile-developer` | Cross-platform mobile development | React Native, Flutter, mobile UI/UX |
| `game-developer` | Interactive games & physics engines | Canvas, Unity, Phaser, game mechanics |
| `devops-engineer` | CI/CD, containerization & cloud infra | Docker, PM2, deployment pipelines, Nginx |
| `security-auditor` | Security compliance & vulnerabilities | OWASP, auth audits, static analysis review |
| `penetration-tester` | Active offensive testing | Simulated exploits, vulnerability testing |
| `test-engineer` | Testing architectures & coverage | Vitest, E2E testing, TDD workflow, Jest |
| `debugger` | Systematic root-cause analysis | Complex bug investigation, system crashes |
| `performance-optimizer` | Web speed & Core Web Vitals | Lighthouse audits, bundle size optimization |
| `seo-specialist` | Page ranking & search visibility | SEO tags, structured data, web vitals |
| `documentation-writer` | Professional documentation & guides | API docs, user guides, README files |
| `product-manager` | Business logic & user stories | Feature specifications, user flows |
| `product-owner` | Backlog strategy & MVP priority | Prioritization, roadmap planning |
| `qa-automation-engineer` | E2E automation & regression pipelines| Playwright runners, visual regression |
| `code-archaeologist` | Legacy codebases & code health | AST maps, refactoring, code quality audits |
| `explorer-agent` | Discovery & dependency mapping | Codebase walkthroughs, dependency trees |

---

### 🧩 Domain Knowledge Skills (47)
These skills provide specific instructions and toolsets to guide implementation in target technologies and patterns.

| Domain Category | Skills Included |
| :--- | :--- |
| **Frontend & UI** | `react-refactor-patterns`, `web-design-guidelines`, `tailwind-patterns`, `frontend-design`, `seo-fundamentals`, `i18n-localization`, `playwright-pitfalls`, `playwright-pro-patterns`, `webapp-testing`, `game-development`, `mobile-design`, `nextjs-react-expert`, `ui-ux-pro-max` |
| **Backend & API** | `api-patterns`, `nodejs-best-practices`, `python-patterns`, `database-design`, `mcp-builder`, `geo-fundamentals` |
| **Testing & QA** | `testing-patterns`, `tdd-workflow`, `verify-changes`, `lint-and-validate`, `clean-code`, `performance-profiling`, `systematic-debugging` |
| **Security & Audits** | `vulnerability-scanner`, `red-team-tactics`, `code-review-checklist`, `code-review-graph` |
| **Planning & Design** | `app-builder`, `architecture`, `plan-writing`, `brainstorming`, `documentation-templates` |
| **Infrastructure** | `deployment-procedures`, `server-management` |
| **System Operations** | `bash-linux`, `batch-operations`, `coordinator-mode`, `memory-system`, `context-compression`, `simplify-code`, `skillify`, `intelligent-routing`, `parallel-agents`, `behavioral-modes` |

---

## ⚡ Dynamic Skill Discovery (Standard native)

```plaintext
User Intent / Prompt → Scan Frontmatter `description` → Auto-inject relevant SKILL.md
```

Unlike legacy systems that required hard-routed agent scripts or manual loading tables, the **OpenAI Codex Standard** leverages native **Implicit Invocation**:
1. When a user requests a task, the AI engine scans the `description` in all `SKILL.md` frontmatters.
2. Skills matching the context (e.g. React hooks triggering `frontend-specialist` and `react-refactor-patterns`) are dynamically loaded directly into the model's environment context.
3. This achieves **95%+ token efficiency** by ensuring instructions are only present when active.

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
Coordinates context saving and session state backups under `.agents/memory/`.

---

## 🔗 Quick Reference

For details on the exact metadata formats and writing rules when adding new skills, please refer to the root [CODEX_SKILL_STANDARD.md](../CODEX_SKILL_STANDARD.md) file.
