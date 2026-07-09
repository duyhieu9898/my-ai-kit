# AG Kit Architecture

> Comprehensive AI Agent Capability Expansion Toolkit — 2026.5.13

---

## 📋 Overview

AG Kit is a modular system consisting of:

- **15 Specialist Agents** - Role-based AI personas
- **33 Skills** - Domain-specific knowledge modules with conditional loading
- **11 Workflows** - Slash command procedures

---

## 🏗️ Directory Structure

```plaintext
.agents/
├── ARCHITECTURE.md          # This file
├── hooks.json               # Antigravity lifecycle hook registration
├── hooks/                   # Shared Harness policy + Gemini adapter
├── agents/                  # 15 Specialist Agents
├── skills/                  # 33 Skills (with conditional loading)
├── workflows/               # 11 Slash Commands
└── scripts/                 # Master Validation Scripts
```

---

## 🤖 Agents (15)

Specialist AI personas for different domains.

| Agent                    | Focus                      | Skills Used                                              |
| ------------------------ | -------------------------- | -------------------------------------------------------- |
| `project-planner`        | Self-contained initiative roadmaps | None required                                     |
| `frontend-specialist`    | Web UI/UX & Architecture   | frontend-design, nextjs-react-expert, react-refactor-patterns, tailwind-patterns, frontend-specialist |
| `backend-specialist`     | API, business logic        | api-patterns, nodejs-best-practices, database-design     |
| `database-architect`     | Schema, SQL                | database-design                                          |
| `devops-engineer`        | CI/CD, Docker              | deployment-procedures                                    |
| `security-auditor`       | Security compliance        | vulnerability-scanner                                    |
| `test-engineer`          | Testing strategies         | testing-patterns, tdd-workflow, webapp-testing, playwright-pitfalls, playwright-pro-patterns |
| `debugger`               | Root cause analysis        | systematic-debugging                                     |
| `performance-optimizer`  | Speed, Web Vitals          | performance-profiling                                    |
| `seo-specialist`         | Ranking, visibility        | seo-fundamentals                                         |
| `documentation-writer`   | Manuals, docs              | documentation-writer                                     |
| `product-manager`        | Requirements, user stories | plan-writing, brainstorming                              |
| `qa-automation-engineer` | E2E testing, CI pipelines  | webapp-testing, testing-patterns, playwright-pitfalls, playwright-pro-patterns |
| `code-archaeologist`     | Legacy code, refactoring   | clean-code, react-refactor-patterns, code-review-checklist |
| `explorer-agent`         | Codebase analysis          | -                                                        |

---

## 🧩 Skills (33)

Modular knowledge domains that agents can load on-demand based on task context.
Most Gemini skills have a `when_to_use` frontmatter field for
conditional/intelligent loading; shared skills that are also used by Codex may
only provide `description`.

### Frontend & UI

| Skill                         | Description                                                           |
| ----------------------------- | --------------------------------------------------------------------- |
| `nextjs-react-expert`         | Next.js and React-specific architecture and optimization patterns     |
| `react-refactor-patterns` | Refactor patterns: hooks, services, Zustand, React Query (Before/After) |
| `web-design-guidelines`       | Web UI audit - 100+ rules for accessibility, UX, performance (Vercel) |
| `tailwind-patterns`           | Tailwind CSS v4 utilities                                             |
| `frontend-design`             | UI/UX patterns, design systems                                        |

### Backend & API

| Skill                   | Description                    |
| ----------------------- | ------------------------------ |
| `api-patterns`          | REST, GraphQL, tRPC            |
| `nodejs-best-practices` | Node.js async, modules         |
| `python-patterns`       | Python standards, FastAPI      |

### Database

| Skill             | Description                 |
| ----------------- | --------------------------- |
| `database-design` | Schema design, optimization |

### Cloud & Infrastructure

| Skill                   | Description               |
| ----------------------- | ------------------------- |
| `deployment-procedures` | CI/CD, deploy workflows   |
| `server-management`     | Infrastructure management |

### Testing & Quality

| Skill                    | Description                                                   |
| ------------------------ | ------------------------------------------------------------- |
| `testing-patterns`       | Jest, Vitest, strategies                                      |
| `webapp-testing`         | E2E, Playwright                                               |
| `tdd-workflow`           | Test-driven development                                       |
| `playwright-pitfalls`    | 7 critical Playwright pitfalls: timing, isolation, assertions |
| `playwright-pro-patterns`| Professional Playwright test writing standards (2026.5.14)    |
| `code-review-checklist`  | Code review standards                                         |
| `lint-and-validate`      | Linting, validation                                           |

### Security

| Skill                   | Description              |
| ----------------------- | ------------------------ |
| `vulnerability-scanner` | Security auditing, OWASP |

### Architecture & Planning

| Skill           | Description                |
| --------------- | -------------------------- |
| `app-builder`   | Full-stack app scaffolding |
| `architecture`  | System design patterns     |
| `plan-writing`  | Bounded implementation plans |
| `brainstorming` | Socratic questioning       |

### SEO & Growth

| Skill              | Description                   |
| ------------------ | ----------------------------- |
| `seo-fundamentals` | SEO, E-E-A-T, Core Web Vitals |

### Orchestration

| Skill                     | Description                                                 |
| ------------------------- | ----------------------------------------------------------- |
| `verify-changes`          | Prove code works by running it, not just inspecting         |
| `batch-operations`        | Multi-file pattern-based modifications                      |
| `simplify-code`           | Reduce over-engineered complexity                           |
| `code-review-graph`       | Token-efficient code review via Tree-sitter AST + MCP       |

### Other

| Skill                     | Description               |
| ------------------------- | ------------------------- |
| `clean-code`              | Scoped implementation quality heuristics |
| `mcp-builder`             | Model Context Protocol    |
| `i18n-localization`       | Internationalization      |
| `performance-profiling`   | Web Vitals, optimization  |
| `systematic-debugging`    | Troubleshooting           |

---

## 🔄 Workflows (10)

Slash command procedures. Invoke with `/command`.

| Command          | Description                                    |
| ---------------- | ---------------------------------------------- |
| `/brainstorm`    | Socratic discovery                             |
| `/create`        | Create new features                            |
| `/debug`         | Debug issues                                   |
| `/deploy`        | Deploy application                             |
| `/enhance`       | Improve existing code                          |
| `/plan`          | Task breakdown                                 |
| `/preview`       | Preview changes                                |
| `/status`        | Check project status                           |
| `/test`          | Run tests                                      |
| `/verify`        | **NEW** Prove code works by running it         |

---

## 🎯 Skill Loading Protocol (2026.5.13 — Conditional)

```plaintext
User Request → Check `when_to_use` frontmatter → Match? → Load full SKILL.md
                                                    ↓ No match
                                                 Skip (save tokens)
```

### Skill Structure

```plaintext
skill-name/
├── SKILL.md           # Required metadata and instructions
├── scripts/           # (Optional) Python/Bash scripts
├── references/        # (Optional) Templates, docs
└── assets/            # (Optional) Images, logos
```

### Required Frontmatter Fields

```yaml
---
name: skill-name
description: What this skill does
when_to_use: "When to activate. NOT for X."  # Preferred for Gemini-specific skills
allowed-tools: Read, Grep, Glob
---
```

### Enhanced Skills (with scripts/references)

| Skill               | Files | Coverage                            |
| ------------------- | ----- | ----------------------------------- |
| `app-builder`       | 20    | Full-stack scaffolding              |

---

## � Scripts (2)

Master validation scripts that orchestrate skill-level scripts.

### Master Scripts

| Script          | Purpose                                 | When to Use              |
| --------------- | --------------------------------------- | ------------------------ |
| `checklist.py`  | Priority-based validation (Core checks) | Development, pre-commit  |
| `verify_all.py` | Comprehensive verification (All checks) | Pre-deployment, releases |

### Usage

```bash
# Quick validation during development
python3 .agents/scripts/checklist.py .

# Full verification before deployment
python3 .agents/scripts/verify_all.py . --url http://localhost:3000
```

### What They Check

**checklist.py** (Core checks):

- Security (vulnerabilities, secrets)
- Code Quality (lint, types)
- Schema Validation
- Test Suite
- UX Audit
- SEO Check

**verify_all.py** (Full suite):

- Everything in checklist.py PLUS:
- Lighthouse (Core Web Vitals)
- Playwright E2E
- Bundle Analysis
- Mobile Audit
- i18n Check

The current template ships the runtime scripts directly under `.agents/scripts/`.

---

## 📊 Statistics

| Metric              | Value                             |
| ------------------- | --------------------------------- |
| **Total Agents**    | 15                                |
| **Total Skills**    | 34                                |
| **Total Workflows** | 11                                |
| **Total Scripts**   | 4 master + 12 skill-level script directories |

---

## 🔗 Quick Reference

| Need     | Agent                 | Skills                                |
| -------- | --------------------- | ------------------------------------- |
| Web App  | `frontend-specialist` | frontend-design, nextjs-react-expert, react-refactor-patterns, tailwind-patterns, frontend-specialist |
| API      | `backend-specialist`  | api-patterns, nodejs-best-practices   |
| Database | `database-architect`  | database-design                       |
| Security | `security-auditor`    | vulnerability-scanner                 |
| Testing  | `test-engineer`       | testing-patterns, webapp-testing, playwright-pitfalls, playwright-pro-patterns |
| Debug    | `debugger`            | systematic-debugging                  |
| Plan     | `project-planner`     | brainstorming, plan-writing           |
