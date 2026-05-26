# AGENTS.md - Global Workspace Rules

> Repository-level operating rules for Codex. Keep this file short; detailed procedures belong in skills.

---

## Skill Protocol

Before implementation, select the relevant skill and read its `SKILL.md`.

* Read `SKILL.md` first.
* Read only the specific `references/` files needed for the task.
* Prefer scripts shipped with a skill when they exist.
* Priority order: `AGENTS.md` > active skill `SKILL.md` > skill `references/`.

Do not bulk-load every reference file in a skill folder.

---

## Request Routing

Use the smallest effective route:

| Request | Default Handling |
|:---|:---|
| Question or explanation | Answer directly; load skills only when domain detail matters |
| Survey, analysis, or file overview | Use `explorer-agent` when repository discovery is needed |
| Simple code edit or bug fix | Use the relevant domain skill and edit directly when intent is clear |
| Broad feature, refactor, architecture, or design work | Use the relevant domain skill; add `project-planner` only when scope is broad or risky |
| Multi-domain coordination | Use `orchestrator` when sequencing or ownership is unclear |

When useful, mention the applied skill briefly. Do not add a fixed announcement format.

---

## Language

When the user writes in a non-English language:

1. Understand the request internally in the most useful language.
2. Respond in the user's language.
3. Keep code identifiers and code comments in English unless the project already uses another convention.

---

## Coding Baseline

All implementation should follow `.agents/skills/clean-code/SKILL.md`.

Before modifying files:

1. Check `.agents/ARCHITECTURE.md` when present.
2. Inspect nearby code and current patterns.
3. Update dependent files when the changed contract requires it.
4. Preserve unrelated user changes.

---

## Clarification Gate

Ask questions only when missing context would make the work risky, ambiguous, or likely wrong.

Proceed without extra process when the user gives a clear execution request such as `continue`, `fix it`, `sửa toàn bộ`, or equivalent.

For vague work, ask the smallest blocking question. For broad work, state a short plan before editing.

---

## Project Routing

| Project Type | Primary Skill | Supporting Skills |
|:---|:---|:---|
| Mobile (iOS, Android, React Native, Flutter) | `mobile-developer` | `mobile-design` |
| Web (React, Next.js, browser UI) | `frontend-specialist` | `frontend-design`, `tailwind-patterns` |
| Backend (API, server, database) | `backend-specialist` | `api-patterns`, `database-design` |
| Security audit | `security-auditor` | `vulnerability-scanner`, `verify-changes` |
| Testing | `test-engineer` | `testing-patterns`, `webapp-testing`, `playwright-pro-patterns` |

Mobile work should not route through `frontend-specialist` unless it is explicitly web-based.

---

## Verification

Run verification that matches the change. Do not claim success without execution evidence when tests or builds are available.

Useful commands:

| Task | Command |
|:---|:---|
| Manual audit | `python .agents/scripts/checklist.py .` |
| Full verification | `python .agents/scripts/verify_all.py . --url <URL>` |

Use `.agents/skills/verify-changes/SKILL.md` for final validation and evidence reporting.

---

## Quick Reference

Key skills:

* `clean-code`
* `brainstorming`
* `app-builder`
* `project-planner`
* `frontend-specialist`
* `backend-specialist`
* `mobile-developer`
* `security-auditor`
* `debugger`
* `verify-changes`

Key scripts:

* `.agents/scripts/verify_all.py`
* `.agents/scripts/checklist.py`
* `.agents/skills/vulnerability-scanner/scripts/security_scan.py`
* `.agents/skills/frontend-design/scripts/ux_audit.py`
* `.agents/skills/performance-profiling/scripts/lighthouse_audit.py`
