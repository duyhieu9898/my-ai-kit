---
name: clean-code
description: >-
  Use when writing, editing, reviewing, or refactoring code.
  Pragmatic coding standards covering concise implementation, avoiding over-engineering,
  eliminating unnecessary comments, and enforcing SRP/DRY/KISS/YAGNI naming conventions.
  NOT for non-coding tasks or product/design discussion without implementation work.
allowed-tools:
  - Read
  - Write
  - Edit
---

# 🧼 Clean Code - Pragmatic AI Coding Standards

> Strict behavioral and implementation rules to write concise, self-documenting, and robust software directly, without over-engineering.

## 📑 Content Map

| File / Resource | Description | When to Read |
|:---|:---|:---|
| No supplementary files | This skill is self-contained | Use the procedures below directly |

## 🔗 Related Skills

| Skill | Relationship | When to Collaborate |
|:---|:---|:---|
| [`simplify-code`](../simplify-code/SKILL.md) | Optimization companion | When refactoring loops, nested conditionals, or long blocks |
| [`lint-and-validate`](../lint-and-validate/SKILL.md) | Quality partner | To verify lint cleanliness, type coverage, and script success |
| [`debugger`](../debugger/SKILL.md) | Troubleshooting partner | When bug-fixing, tracking stack traces, or applying hotfixes |

---

## 🛠️ Instructions / Procedures

Be **concise, direct, and solution-focused**. All code implementations must strictly adhere to the following pragmatic standards:

### 1. Core Principles

| Principle | Rule Description |
|:---|:---|
| **SRP** | Single Responsibility - each function/class does ONE thing and does it well. |
| **DRY** | Don't Repeat Yourself - extract duplicates, abstract logic wisely, and reuse. |
| **KISS** | Keep It Simple - choose the simplest, most readable solution that works. |
| **YAGNI** | You Aren't Gonna Need It - do not write speculative code or unused features. |
| **Boy Scout** | Always leave code cleaner than you found it. |

### 2. Naming Conventions

| Element | Convention | Example |
|:---|:---|:---|
| **Variables** | Intent-revealing names | `userCount` instead of `n` |
| **Functions** | Verb + noun | `getUserById()` instead of `user()` |
| **Booleans** | Question form | `isActive`, `hasPermission`, `canEdit` |
| **Constants** | SCREAMING_SNAKE | `MAX_RETRY_COUNT` |

> 💡 **Naming Rule:** If you need a code comment to explain a name, rename the variable/function instead.

### 3. Function Design Rules

| Rule | Description |
|:---|:---|
| **Small** | Maximum 20 lines (ideally 5–10 lines). |
| **One Thing** | Solves exactly one problem at a single level of abstraction. |
| **Few Arguments** | Maximum 3 arguments, with a strong preference for 0–2. |
| **No Side Effects**| Never mutate global state or arguments unexpectedly. |

### 4. Code Structure Patterns
*   **Guard Clauses:** Use early returns to handle edge cases, empty states, and errors at the top of the function to prevent deep indentation.
*   **Flat over Nested:** Avoid deep nesting of blocks (maximum 2 levels of nesting).
*   **Composition:** Compose functions by piping small, focused utility methods together.
*   **Colocation:** Keep related code, variables, and type definitions close to where they are consumed.

### 5. AI Coding Communication Style

| Situation | Action Required |
|:---|:---|
| **User requests a feature** | Write the code directly. Do not write introductory tutorials. |
| **User reports a bug** | Fix the bug immediately and show the clean code. Do not explain basic concepts. |
| **Vague or incomplete spec**| Ask concise, targeted questions. Never make assumptions on core features. |

### 6. Dependency & Impact Check Protocol (THINK FIRST!)
Before changing *any* file, perform a mental impact review:

```
File to edit: UserService.ts
└── Who imports this? → UserController.ts, AuthController.ts
└── Do they need changes too? → Check signatures and import paths
```

*   **Rule:** Edit the modified file and all dependent files in the **same task/turn**.
*   **Safety:** Never leave broken import statements, missing parameters, or unaligned interfaces.

### 7. Verification Script Orchestration

> 🔴 **CRITICAL:** Run ONLY the validation scripts belonging to your active skill domain after completing work.

| Skill / Domain | Verification Script Command |
|:---|:---|
| **frontend-specialist** | `python3 .agents/skills/frontend-design/scripts/ux_audit.py .` |
| **frontend-specialist** | `python3 .agents/skills/frontend-design/scripts/accessibility_checker.py .` |
| **backend-specialist** | `python3 .agents/skills/api-patterns/scripts/api_validator.py .` |
| **mobile-developer** | `python3 .agents/skills/mobile-design/scripts/mobile_audit.py .` |
| **database-architect** | `python3 .agents/skills/database-design/scripts/schema_validator.py .` |
| **security-auditor** | `python3 .agents/skills/vulnerability-scanner/scripts/security_scan.py .` |
| **performance-optimizer**| `python3 .agents/skills/performance-profiling/scripts/lighthouse_audit.py <url>` |
| **test-engineer** | `python3 .agents/skills/webapp-testing/scripts/playwright_runner.py <url>` |
| **Any Agent (Lint)** | `python3 .agents/skills/lint-and-validate/scripts/lint_runner.py .` |
| **Any Agent (Coverage)**| `python3 .agents/skills/lint-and-validate/scripts/type_coverage.py .` |

### 8. Verification Output Protocol (READ ➜ SUMMARIZE ➜ ASK)
When executing any validation script, you must strictly follow this communication cycle:
1.  **Execute the script** and capture the complete standard output.
2.  **Analyze the logs** to isolate Errors, Warnings, and Passes.
3.  **Summarize findings** to the user using this exact schema:
    ```markdown
    ## Script Results: [script_name.py]

    ### ❌ Errors Found (X items)
    - [File:Line] Error description

    ### ⚠️ Warnings (Y items)
    - [File:Line] Warning description

    ### ✅ Passed (Z items)
    - Check description

    **Should I proceed to fix these X errors?**
    ```
4.  **Await confirmation** before performing fixes.
5.  **Re-run and verify** after applying fixes to guarantee success.

---

## ❌ Anti-Patterns

*   ❌ **Tutorial Writing:** Explaining basic syntax or lecturing the user. Just write direct, working code.
*   ❌ **Comment Clutter:** Adding obvious comments to code lines (e.g. `// increment count`). Let the code self-document.
*   ❌ **Over-Modularization:** Creating helpers or wrappers for single-line operations. Direct, idiomatic code is cleaner.
*   ❌ **God Functions:** Writing long methods (>20 lines) with nested loops and complex branching. Split them by responsibility.
*   ❌ **Ignoring Script Errors:** Running validation scripts and ignoring their failure outputs. This is considered a task failure.

---

## ✅ Quality Audit Checklist

The agent must perform this self-audit before declaring any code task complete:

*   [ ] **Correctness:** Did I implement exactly what the user asked, meeting all requirements?
*   [ ] **Safety & Dependency:** Did I identify and modify all files affected by import/signature changes?
*   [ ] **Function Size:** Are all newly created or refactored functions under 20 lines?
*   [ ] **Deep Indentation:** Are there guard clauses at the top of functions, keeping nesting under 2 levels?
*   [ ] **Self-Documenting Names:** Variable, constant, and function names reveal their purpose clearly without requiring inline comments.
*   [ ] **Verification Coverage:** Has the appropriate validation script been executed, summarized, and run to success?
