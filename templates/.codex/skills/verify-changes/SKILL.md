---
name: verify-changes
description: >-
  Use when code was written, a feature completed, a bug fixed, or the user asks to test, verify, or prove.
  Runtime execution, testing, and evidence collection protocol.
  NOT for writing code.
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
---

# Verify Changes — Prove Code Works

> "Code that exists" ≠ "Code that works." This skill ensures changes are verified through execution.

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| _No supplementary files_ | Main verification procedures are in this file | Use this file by default |

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| Core Web Vitals optimization techniques | [`performance-optimizer`](../performance-optimizer/SKILL.md) |
| Writing atomic verifiable plans | [`plan-writing`](../plan-writing/SKILL.md) |
| Automating testing strategies | [`webapp-testing`](../webapp-testing/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When tasked with verifying changes, proving bug fixes, or running backend/frontend tests, strictly follow this step-by-step procedure:

### Step 1: Map Modified Files & Intent
1. Identify all altered files, code signatures, and behavioral changes.
2. Note the original requirement or target issue.

### Step 2: Determine Verification Methods
1. Select validation pathways per change class:
   - Bug fix -> reproduces bug scenario, checks resolution.
   - Refactor -> runs complete test suites.
   - API endpoints -> curls paths, checks response shapes.

### Step 3: Run Verification Triggers
1. Trigger appropriate compilers (`npm run build`), test suites (`npm run test`), or endpoint targets.
2. Test both happy paths and edge boundaries.

### Step 4: Write Verification Report
1. Create a detailed report summarizing files modified, precise commands run, and execution evidence.
2. Ensure you document any edge scenarios.

### Step 5: Validate checklist compliance
1. Audit overall outcomes.
2. Confirm compliance against the **Quality Audit Checklist** before concluded.

---

## Core Principle

```
- Verification by inspection:  "I can see the function exists, it should work"
- Verification by assumption:  "The types check out, so it's correct"
- Verification by execution:   "I ran it, here's the output, it works because [evidence]"
```

---

## Verification Protocol

### Step 1: Identify What Changed
```
- Which files were modified?
- What behavior should be different now?
- What was the original bug/requirement?
```

### Step 2: Determine Verification Method

| Change Type | Verification Method |
|---|---|
| **Bug fix** | Reproduce the original bug scenario → confirm it no longer occurs |
| **New feature** | Run the feature → confirm expected output |
| **Refactor** | Run existing tests → confirm nothing broke |
| **API change** | Call the endpoint → confirm response shape |
| **UI change** | Render the component → confirm visual output |
| **Config change** | Load the config → confirm values applied |
| **Build/infra** | Run build command → confirm success |

### Step 3: Execute Verification

```bash
# For Node.js projects
npm run build          # Does it compile?
npm run test           # Do tests pass?
npm run dev            # Does it start?

# For specific files
node -e "require('./path/to/module'); console.log('✅ Loads correctly')"

# For API endpoints
curl http://localhost:3000/api/endpoint

# For scripts
python script.py --test
```

### Step 4: Report Evidence

```markdown
## Verification Report

### What was changed
- [File list and summary]

### How it was verified
- [Exact commands run]

### Evidence
- Build: ✅ Compiled without errors
- Tests: ✅ 42/42 passing
- Runtime: ✅ Server starts, endpoint returns expected JSON
- Edge case: ✅ Empty input handled correctly

### Not yet verified
- [Anything that couldn't be tested automatically]
```

---

## ✅ Quality Audit Checklist

Before concluding a feature execution, code verification, or test reporting task, verify compliance with the following:

- [ ] **Execution Verified**: Verified all behavior through actual execution, not just code inspection or compile validation.
- [ ] **Build compiles successfully**: Checked compilation status utilizing standard bundle scripts (`npm run build` or similar).
- [ ] **API Endpoint Curl checks**: Triggered curl requests or test runners on modified endpoints and verified response structures.
- [ ] **Errors and Edge cases handled**: Audited edge inputs, boundary parameters, and error status code handling.
- [ ] **No Console warnings in runtime**: Audited console logs for error stack traces or layout warnings.
- [ ] **Verification report appended**: Documented changes, exact execution triggers, and passing evidence.

---

## ❌ Anti-Patterns

| Anti-Pattern | Why It's Bad | Fix |
|---|---|---|
| "It should work" | No evidence | Run it and show output |
| Only checking happy path | Bugs hide in edge cases | Test error paths too |
| Verifying only compilation | Compiles ≠ correct | Test runtime behavior |
| Skipping verification for "trivial" changes | Trivial changes cause real bugs | Verify everything |

---

## Integration with Other Skills

| After Using | Verify With |
|---|---|
| `frontend-design` → UI changes | Render in browser, check console |
| `backend-specialist` → API changes | curl endpoints, check responses |
| `database-design` → Schema changes | Run migrations, query data |
| `testing-patterns` → New tests | Run test suite, check coverage |
