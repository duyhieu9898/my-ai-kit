---
name: systematic-debugging
description: >-
  Use when debugging complex bugs, resolving unexpected errors, conducting root cause (5 Whys), or setting up regression tests.
  Systematic debugging methodology (Reproduce, Isolate, Understand, Fix & Verify).
  NOT for implementing unrelated new features or speculative code cleanup.
allowed-tools:
  - Read
  - Glob
  - Grep
---

# Systematic Debugging

> Source: obra/superpowers

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| _No supplementary files_ | Main systematic debugging procedures are in this file | Use this file by default |

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| Test-driven debugging workflows | [`tdd-workflow`](../tdd-workflow/SKILL.md) |
| Verifying code changes after a bug fix | [`verify-changes`](../verify-changes/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When tasked with isolating complex application errors, analyzing crash logs, or resolving legacy bugs, strictly follow this step-by-step procedure:

### Step 1: Reproduce consistently
1. Map reproduction steps, environment factors, and expected vs actual outcomes.
2. Ensure you have a clear reproducer.

### Step 2: Isolate target variables
1. Examine recent Git changes (`git log --oneline -20`) and logs.
2. Establish the smallest possible code snippet or input dataset that triggers the issue.

### Step 3: Understand root cause
1. Execute the 5 Whys technique (observations -> deeper reasons -> root cause).
2. Distinguish root causes from quick-fix symptom mitigations.

### Step 4: Fix and write regression tests
1. Implement the targeted correction.
2. Add automated testing assertions to prevent regressions.

### Step 5: Verify & Audit checklist
1. Verify resolution against the target failure case.
2. Confirm compliance against the **Quality Audit Checklist** before completing.

---

## Overview

This skill provides a structured approach to debugging that prevents random guessing and ensures problems are properly understood before solving.

---

## 4-Phase Debugging Process

### Phase 1: Reproduce
Before fixing, reliably reproduce the issue.

```markdown
## Reproduction Steps
1. [Exact step to reproduce]
2. [Next step]
3. [Expected vs actual result]

## Reproduction Rate
- [ ] Always (100%)
- [ ] Often (50-90%)
- [ ] Sometimes (10-50%)
- [ ] Rare (<10%)
```

### Phase 2: Isolate
Narrow down the source.

```markdown
## Isolation Questions
- When did this start happening?
- What changed recently?
- Does it happen in all environments?
- Can we reproduce with minimal code?
- What's the smallest change that triggers it?
```

### Phase 3: Understand
Find the root cause, not just symptoms.

```markdown
## Root Cause Analysis
### The 5 Whys
1. Why: [First observation]
2. Why: [Deeper reason]
3. Why: [Still deeper]
4. Why: [Getting closer]
5. Why: [Root cause]
```

### Phase 4: Fix & Verify
Fix and verify it's truly fixed.

```markdown
## Fix Verification
- [ ] Bug no longer reproduces
- [ ] Related functionality still works
- [ ] No new issues introduced
- [ ] Test added to prevent regression
```

## ✅ Quality Audit Checklist

Before concluding a bug investigation, root cause analysis, or regression testing task, verify compliance with the following:

- [ ] **Consistently Reproduced**: Verified that the bug can be reliably reproduced in local or staging contexts.
- [ ] **Minimal Reproducer Built**: Created the smallest possible code snippet or API call sequence triggering the defect.
- [ ] **Root Cause Located**: Executed 5 Whys reasoning to confirm the true underlying failure is addressed rather than symptoms.
- [ ] **Regression Tests Added**: Wrote automated tests targeting the boundary conditions that triggered the bug.
- [ ] **Verification Executed**: Ran exact test or curl verification steps to prove the issue no longer occurs.
- [ ] **No Side Effects Introduced**: Confirmed adjacent logic is undisturbed and zero runtime warnings occur.

---

## Common Debugging Commands

```bash
# Recent changes
git log --oneline -20
git diff HEAD~5

# Search for pattern
grep -r "errorPattern" --include="*.ts"

# Check logs
pm2 logs app-name --err --lines 100
```

## ❌ Anti-Patterns

❌ **Random changes** - "Maybe if I change this..."
❌ **Ignoring evidence** - "That can't be the cause"
❌ **Assuming** - "It must be X" without proof
❌ **Not reproducing first** - Fixing blindly
❌ **Stopping at symptoms** - Not finding root cause
