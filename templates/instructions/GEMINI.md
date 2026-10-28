<!-- KIT:BEGIN -->
---
trigger: always_on
---

# GEMINI.md - AG Kit

> Configuration file defining AI behavior and workflow rules within this workspace.

---

## 🚀 DEVELOPMENT PROTOCOL

> Read the relevant skill in `.agents/skills/<name>/SKILL.md` before implementation. Gemini-only skills such as `clean-code`, `verify-changes`, and `lint-and-validate` install only for Gemini, so other agents do not see them; skip a reference whose skill is missing. Priority of rules: P0 (this file and the project's own conventions) > P1 (the active SKILL.md) > P2 (the skill's references).

1. **Modular Skill Loading:** Read the index file `SKILL.md` first, then only read specific sections directly related to the task.
2. **Read -> Understand -> Apply:** Identify the goal of the skill and its project-specific rules before writing code.
3. **Skill Selection:** Pick the smallest set of skills that matches the task and apply them without announcing them.

---

## 📥 REQUEST CLASSIFIER

Classify the user request before execution to select the correct operation mode:

| Request Type | Trigger Keywords | Mode & Expected Result |
| :--- | :--- | :--- |
| **QUESTION** | "what is", "how does", "explain" | `ask` Mode: Direct text response. |
| **SURVEY/INTEL** | "analyze", "list files", "overview" | `ask`/`plan` Mode: System exploration, no file modifications. |
| **SIMPLE EDIT** | "fix", "add", "change" (1 file) | `edit` Mode: Inline modification of a single file. |
| **COMPLEX TASK** | "build", "create", "implement", "refactor" | `plan` then `edit` Mode: implementation plan first. |
| **DESIGN/UI** | "design", "UI", "page", "dashboard" | `plan` then `edit` Mode: implementation plan first. |

> 🔴 **Mode Rules:**
> *   **Plan Mode:** Explore context and write an implementation plan with Antigravity's planning mode. Do not modify production files during planning.
> *   **Edit Mode:** Once the plan is approved, apply the changes and keep the task list current.

---

## 🛑 CLARIFY MINIMALLY

Ask only when missing information makes the next action ambiguous, risky, or destructive. Proceed when intent is clear, including direct requests such as "continue" or "fix it". For broad work, state a short plan before editing. When a question is needed, give a default so work can continue.

---

## 🧹 UNIVERSAL RULES

*   **Language:** Respond in the user's language (e.g., Vietnamese). Keep all identifiers, variable names, and code comments in English.
*   **Clean Code:** Follow `.agents/skills/clean-code/SKILL.md`. Write concise, minimalist code, avoid unnecessary abstractions, and do not over-engineer.
*   **File Dependency:** Before editing, find the callers, imports, tests, and contracts the change affects, and update them in the same task.
*   **Right Mechanism:** Before fixing or tuning an existing mechanism, check that it still serves the needed outcome; patch, replace, or remove it, whichever is smallest.
*   **Docs:** Edit docs in place with one home per fact, and delete what your change made stale.
*   **System Map:** Read `.agents/ARCHITECTURE.md` when changing the shared agent toolkit.

---

## 🏁 TESTING & VERIFICATION PROTOCOL

**Run test suites proportional to the modifications made.** Never declare success without verification.

### 1. Proof Ladder
*   **Documentation (Docs):** Run `git diff --check`.
*   **Source Code:** Run linters, type checks, or unit tests matching the modified files.
*   **Toolkit or skill changes:** Validate frontmatter, links, scripts, and changed skill paths. See `.agents/skills/verify-changes/SKILL.md`.

### 2. Checklist Priority (Final verification request)
Run the project audit command `python3 .agents/scripts/checklist.py .`, and fix findings in this order: Security → Lint → Schema → Tests → UX → SEO → E2E.

---

## 📁 QUICK REFERENCE

*   **Main Verification Scripts:**
    *   *Verify All:* `.agents/scripts/verify_all.py`
    *   *Security Scan:* `.agents/skills/security-auditor/scripts/security_scan.py`
    *   *Linter:* `.agents/skills/lint-and-validate/scripts/lint_runner.py`
    *   *Unit Tests:* `.agents/skills/risk-based-testing/scripts/test_runner.py`
*   **UI Styling Rules:** Read `.agents/skills/frontend-design/SKILL.md` before restyling or theming UI (tokens first, then component variants).
<!-- KIT:END -->
