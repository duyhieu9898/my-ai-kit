---
name: lint-and-validate
description: >-
  Use when code has been modified and must be checked for syntax correctness, type safety, and project standards.
  Automatic quality control and static analysis procedures covering linting and type checking.
  NOT for local environment configuration or dependency management.
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Lint and Validate Skill

> **MANDATORY:** Run appropriate validation tools after EVERY code change. Do not finish a task until the code is error-free.

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| [scripts/lint_runner.py](scripts/lint_runner.py) | Unified lint runner | Running local lint validation |
| [scripts/type_coverage.py](scripts/type_coverage.py) | Type coverage analyzer | Checking typed-code coverage |

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| Validating functional system test cases | [`verify-changes`](../verify-changes/SKILL.md) |
| Code quality linting in Node.js backends | [`nodejs-best-practices`](../nodejs-best-practices/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When tasked with checking syntax correctness, verifying type definitions, or running project quality sweeps, strictly follow this step-by-step procedure:

### Step 1: Detect Root Configurations
1. Identify project root descriptors (e.g. tsconfig.json, .eslintrc, pyproject.toml).
2. If none exist, suggest creating appropriate syntax/compilation profiles.

### Step 2: Trigger Style Linters
1. Run target ecosystem styles linters (ESLint `--fix` for Node/TS vs Ruff for Python).
2. Correct formatting discrepancies.

### Step 3: Verify Type Safety
1. Run standard compiler verification parameters (`npx tsc --noEmit` vs `mypy`).
2. Correct argument typing mismatches and signature returns.

### Step 4: Execute Security Scanners
1. Run local dependencies auditing parameters (`npm audit` vs `bandit`).
2. Ensure zero high-risk warnings remain.

### Step 5: Execute Unified Scans & Verify Checklist
1. Trigger unified validation checkers (`python3 scripts/lint_runner.py <project_path>`).
2. Confirm compliance against the **Quality Audit Checklist** before completing.

---

### Procedures by Ecosystem

#### Node.js / TypeScript
1. **Lint/Fix:** `npm run lint` or `npx eslint "path" --fix`
2. **Types:** `npx tsc --noEmit`
3. **Security:** `npm audit --audit-level=high`

#### Python
1. **Linter (Ruff):** `ruff check "path" --fix` (Fast & Modern)
2. **Security (Bandit):** `bandit -r "path" -ll`
3. **Types (MyPy):** `mypy "path"`

## ❌ Anti-Patterns

- Reporting code changes as complete without running the relevant validation commands.
- Running only formatter checks when type checks or security scans are required.
- Ignoring high-severity audit results because they are outside the edited file.
- Using project-agnostic commands before checking the repository's package scripts and config files.

## ✅ Quality Audit Checklist

Before concluding any code edit, script modification, or task completion, verify compliance with the following:

- [ ] **Linter Executed**: Run the appropriate static analysis commands (ESLint/Ruff) and confirmed zero style or syntax violations remain.
- [ ] **Types Checked Clean**: Verified TypeScript compile parameters (`tsc --noEmit`) or Python type signatures (`mypy`) return error-free.
- [ ] **Unified Runner Run**: Executed local project scanners (`python3 scripts/lint_runner.py <project_path>`) and documented outputs.
- [ ] **No High Security Alerts**: Confirmed `npm audit` or `bandit` returns zero critical or high-severity vulnerabilities.
- [ ] **Zero Failures Policy**: Resolved all warning states before considering the current modification complete.

---

## Scripts

| Script | Purpose | Command |
|--------|---------|---------|
| [scripts/lint_runner.py](scripts/lint_runner.py) | Unified lint check | `python3 scripts/lint_runner.py <project_path>` |
| [scripts/type_coverage.py](scripts/type_coverage.py) | Type coverage analysis | `python3 scripts/type_coverage.py <project_path>` |

---

**Strict Rule:** No code should be committed or reported as "done" without passing these checks.
