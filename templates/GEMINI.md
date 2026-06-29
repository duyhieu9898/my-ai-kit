<!-- KIT:BEGIN -->
---
trigger: always_on
---

# GEMINI.md - AG Kit

> Configuration file defining AI behavior and workflow rules within this workspace.

---

## 🚀 DEVELOPMENT PROTOCOL

> **MANDATORY:** You MUST read the appropriate specialist agent file and its skills BEFORE performing any implementation. Priority of rules: P0 (GEMINI.md) > P1 (Agent .md) > P2 (SKILL.md).

1. **Modular Skill Loading:** Read the index file `SKILL.md` first, then only read specific sections directly related to the task.
2. **Read -> Understand -> Apply:** Clearly identify the goal of the Agent/Skill, the mandatory principles, and how your solution differs from standard implementations before writing code.
3. **Agent Persona Protocol:** AI automatically loads the most appropriate specialist agent and applies its knowledge when performing implementation tasks. Do NOT print the announcement banner (e.g. "Applying knowledge of...") unless explicitly requested by the user.
   *(Masters: `project-planner`, `security-auditor`, `backend-specialist`, `frontend-specialist`, `debugger`)*

---

## 📥 REQUEST CLASSIFIER

Classify the user request before execution to select the correct operation mode:

| Request Type | Trigger Keywords | Mode & Expected Result |
| :--- | :--- | :--- |
| **QUESTION** | "what is", "how does", "explain" | `ask` Mode: Direct text response. |
| **SURVEY/INTEL** | "analyze", "list files", "overview" | `ask`/`plan` Mode: System exploration, no file modifications. |
| **SIMPLE EDIT** | "fix", "add", "change" (1 file) | `edit` Mode: Inline modification of a single file. |
| **COMPLEX TASK** | "build", "create", "implement", "refactor" | `plan` then `edit` Mode: **Creates `{task-slug}.md` checklist** |
| **DESIGN/UI** | "design", "UI", "page", "dashboard" | `plan` then `edit` Mode: **Creates `{task-slug}.md` checklist** |

> 🔴 **Mode Rules:**
> *   **Plan Mode:** Explore context, propose architecture, and write an installation plan to `docs/PLAN-{task-slug}.md`. Do not modify production files during planning.
> *   **Edit Mode:** Once the plan is approved, create/update `task.md` to track progress and apply modifications.

---

## 🛑 SOCRATIC GATE (CLARIFICATION)

**Do not guess.** If any requirements are unclear or the task is complex, you must ask for clarification before using tools or writing code:
*   **New Feature / Large Build:** Ask at least 3 strategic questions (Purpose, Target Users, Scope).
*   **Bug Fix / Code Edit:** Confirm understanding of the issue and ask about the blast radius/impact.
*   **Proceed trực tiếp:** If the user requests immediate implementation, ask 1-2 edge-case or risk-related questions only if necessary.

---

## 🧹 UNIVERSAL RULES

*   **Language:** Respond in the user's language (e.g., Vietnamese). Keep all identifiers, variable names, and code comments in English.
*   **Clean Code:** Follow `@[skills/clean-code]`. Write concise, minimalist code, avoid unnecessary abstractions, and do not over-engineer.
*   **File Dependency:** Check `.agents/ARCHITECTURE.md` for file dependencies before editing, and update all affected files simultaneously.
*   **System Map:** Read `ARCHITECTURE.md` at the start of the session to understand the relationship between Agents, Skills, and Scripts.

---

## 🏁 TESTING & VERIFICATION PROTOCOL

**Run test suites proportional to the modifications made.** Never declare success without verification.

### 1. Proof Ladder
*   **Documentation (Docs):** Run `git diff --check`.
*   **Source Code:** Run linters, type checks, or unit tests matching the modified files.
*   **Installer/Toolkit:** Run `test-installer.mjs`, test-hooks, and `check-template-consistency.mjs`.

### 2. Checklist Priority (Final verification request)
Run the project audit command: `python3 .agents/scripts/checklist.py .` in the following priority order:
$$\text{Security} \rightarrow \text{Lint} \rightarrow \text{Schema} \rightarrow \text{Tests} \rightarrow \text{UX} \rightarrow \text{Seo} \rightarrow \text{E2E}$$

---

## 📁 QUICK REFERENCE

*   **Main Verification Scripts:**
    *   *Verify All:* `.agents/scripts/verify_all.py`
    *   *Security Scan:* `.agents/skills/vulnerability-scanner/scripts/security_scan.py`
    *   *Linter:* `.agents/skills/lint-and-validate/scripts/lint_runner.py`
    *   *Unit Tests:* `.agents/skills/testing-patterns/scripts/test_runner.py`
*   **UI/UX Design Rules:** Read `.agents/agents/frontend-specialist.md` (Strict rules: Purple Ban on violet/purple colors; Template Ban on generic, outdated layouts).
<!-- KIT:END -->
