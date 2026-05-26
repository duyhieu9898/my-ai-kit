---
name: tdd-workflow
description: >-
  Use when practicing TDD, writing unit/integration tests before implementing, or debugging via test-first bug replication.
  Test-Driven Development (TDD) RED-GREEN-REFACTOR workflow. NOT for purely visual layout tweaks or exploratory spikes.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# TDD Workflow

> Write tests first, code second.

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| _No supplementary files_ | Main TDD workflow procedures are in this file | Use this file by default |

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| Verifying code changes after implementations | [`verify-changes`](../verify-changes/SKILL.md) |
| Automated UI and unit test frameworks | [`webapp-testing`](../webapp-testing/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When practicing test-driven development, reproducing bugs via unit tests, or refactoring codebase logic, strictly follow this step-by-step procedure:

### Step 1: Map Expected Behavior
1. Analyze user request to extract functional behaviors, target inputs, and expected outcomes.
2. Outline test boundaries.

### Step 2: RED Phase (Write failing tests)
1. Write target behavior unit or integration tests applying the Arrange-Act-Assert (AAA) pattern.
2. Run test execution commands (`npm run test`) to explicitly verify the test fails first.

### Step 3: GREEN Phase (Write minimal passing code)
1. Write the simplest possible implementation necessary to satisfy the test assertions.
2. Avoid advanced optimizations or additional features at this stage. Run the test to confirm green.

### Step 4: REFACTOR Phase (Refine logic incrementally)
1. Clean up duplicate loops, refine variables naming, and simplify conditional logic.
2. Verify all test suites stay green throughout the refactoring.

### Step 5: Audit checklist compliance
1. Validate coverage parameters and edge boundaries.
2. Confirm compliance against the **Quality Audit Checklist** before completing.

---

## 1. The TDD Cycle

```
🔴 RED → Write failing test
    ↓
🟢 GREEN → Write minimal code to pass
    ↓
🔵 REFACTOR → Improve code quality
    ↓
   Repeat...
```

---

## 2. The Three Laws of TDD

1. Write production code only to make a failing test pass
2. Write only enough test to demonstrate failure
3. Write only enough code to make the test pass

---

## 3. RED Phase Principles

### What to Write

| Focus | Example |
|-------|---------|
| Behavior | "should add two numbers" |
| Edge cases | "should handle empty input" |
| Error states | "should throw for invalid data" |

### RED Phase Rules

- Test must fail first
- Test name describes expected behavior
- One assertion per test (ideally)

---

## 4. GREEN Phase Principles

### Minimum Code

| Principle | Meaning |
|-----------|---------|
| **YAGNI** | You Aren't Gonna Need It |
| **Simplest thing** | Write the minimum to pass |
| **No optimization** | Just make it work |

### GREEN Phase Rules

- Don't write unneeded code
- Don't optimize yet
- Pass the test, nothing more

---

## 5. REFACTOR Phase Principles

### What to Improve

| Area | Action |
|------|--------|
| Duplication | Extract common code |
| Naming | Make intent clear |
| Structure | Improve organization |
| Complexity | Simplify logic |

### REFACTOR Rules

- All tests must stay green
- Small incremental changes
- Commit after each refactor

---

## 6. AAA Pattern

Every test follows:

| Step | Purpose |
|------|---------|
| **Arrange** | Set up test data |
| **Act** | Execute code under test |
| **Assert** | Verify expected outcome |

---

## 7. When to Use TDD

| Scenario | TDD Value |
|----------|-----------|
| New feature | High |
| Bug fix | High (write test first) |
| Complex logic | High |
| Exploratory | Low (spike, then TDD) |
| UI layout | Low |

---

## 8. Test Prioritization

| Priority | Test Type |
|----------|-----------|
| 1 | Happy path |
| 2 | Error cases |
| 3 | Edge cases |
| 4 | Performance |

---

## ❌ Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|-------|
| Skip the RED phase | Watch test fail first |
| Write tests after | Write tests before |
| Over-engineer initial | Keep it simple |
| Multiple asserts | One behavior per test |
| Test implementation | Test behavior |

---

## 10. AI-Augmented TDD

### Multi-Agent Pattern

| Agent | Role |
|-------|------|
| Agent A | Write failing tests (RED) |
| Agent B | Implement to pass (GREEN) |
| Agent C | Optimize (REFACTOR) |

---

## ✅ Quality Audit Checklist

Before concluding a test-first bug fix, feature unit testing, or refactoring task, verify compliance with the following:

- [ ] **Test Fails First (RED)**: Verified that the new or modified test fails before writing production code changes.
- [ ] **Minimal Pass Code (GREEN)**: Wrote only the minimal production logic to transition tests from failing to green.
- [ ] **Incremental Refactoring Done**: Simplified naming, eliminated duplicates, and committed files incrementally while keeping tests green.
- [ ] **AAA Pattern Followed**: Structured all test code systematically using Arrange, Act, and Assert steps.
- [ ] **Edge Cases Covered**: Checked boundaries, empty inputs, and error/exception states.
- [ ] **Zero Dev Console Errors**: Confirmed zero compilation errors or test suite execution warnings.

---

> **Remember:** The test is the specification. If you can't write a test, you don't understand the requirement.
