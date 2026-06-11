---
name: testing-patterns
description: >-
  Use when writing unit or integration tests, setting up mock stubs/spies/fakes, or designing test suites.
  Core testing patterns (Pyramid, AAA, mocking). NOT for manual QA planning without automated test implementation.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Testing Patterns

> Principles for reliable test suites.

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| [scripts/test_runner.py](scripts/test_runner.py) | Python test runner execution utility | Execute when verifying/running tests |

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| General QA automation architectures | [`test-engineer`](../test-engineer/SKILL.md) |
| Specific Playwright E2E browser creations | [`playwright-pro-patterns`](../playwright-pro-patterns/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When tasked with writing unit/integration tests or designing mock boundaries, strictly follow this step-by-step procedure:

### Step 1: Analyze Context & Test Target
1. Review target functions, logic engines, or system integrations.
2. Determine appropriate test scope (Pyramid Rule) using the Test Type Selection criteria.

### Step 2: Design Assertions using AAA Pattern
1. Draft the test framework layout (AAA Pattern).
2. Configure **Arrange** steps: Prepare mock models, parameters, inputs, or database records.
3. Configure **Act** steps: Execute the specific function or endpoint under test.
4. Configure **Assert** steps: Verify outcome metrics, status codes, payload contracts, or exceptions.

### Step 3: Configure Isolation & Mocking Boundaries
1. Isolate test layers. Mock external endpoints, system databases (for unit tests), and random math functions (When to Mock).
2. Employ distinct mock strategies (Stubs for static data, Spies to track invocations, Fakes for lightweight implementations).
3. Ensure no module-level variable leakage occurs during parallel runner iterations.

### Step 4: Validate Suite & State Teardowns
1. Program required `afterEach`/`afterAll` hooks to purge mutated data files, drop database tables, and shut down mock ports.
2. Verify all test files follow naming standards and pass run loops. Confirm compliance against the **Quality Audit Checklist**.

---

## 1. Testing Pyramid

```
        /\          E2E (Few)
       /  \         Critical flows
      /----\
     /      \       Integration (Some)
    /--------\      API, DB queries
   /          \
  /------------\    Unit (Many)
                    Functions, classes
```

---

## 2. AAA Pattern

| Step | Purpose |
|------|---------|
| **Arrange** | Set up test data |
| **Act** | Execute code under test |
| **Assert** | Verify outcome |

---

## 3. Test Type Selection

### When to Use Each

| Type | Best For | Speed |
|------|----------|-------|
| **Unit** | Pure functions, logic | Fast (<50ms) |
| **Integration** | API, DB, services | Medium |
| **E2E** | Critical user flows | Slow |

---

## 4. Unit Test Principles

### Good Unit Tests

| Principle | Meaning |
|-----------|---------|
| Fast | < 100ms each |
| Isolated | No external deps |
| Repeatable | Same result always |
| Self-checking | No manual verification |
| Timely | Written with code |

### What to Unit Test

| Test | Don't Test |
|------|------------|
| Business logic | Framework code |
| Edge cases | Third-party libs |
| Error handling | Simple getters |

---

## 5. Integration Test Principles

### What to Test

| Area | Focus |
|------|-------|
| API endpoints | Request/response |
| Database | Queries, transactions |
| External services | Contracts |

### Setup/Teardown

| Phase | Action |
|-------|--------|
| Before All | Connect resources |
| Before Each | Reset state |
| After Each | Clean up |
| After All | Disconnect |

---

## 6. Mocking Principles

### When to Mock

| Mock | Don't Mock |
|------|------------|
| External APIs | The code under test |
| Database (unit) | Simple dependencies |
| Time/random | Pure functions |
| Network | In-memory stores |

### Mock Types

| Type | Use |
|------|-----|
| Stub | Return fixed values |
| Spy | Track calls |
| Mock | Set expectations |
| Fake | Simplified implementation |

---

## 7. Test Organization

### Naming

| Pattern | Example |
|---------|---------|
| Should behavior | "should return error when..." |
| When condition | "when user not found..." |
| Given-when-then | "given X, when Y, then Z" |

### Grouping

| Level | Use |
|-------|-----|
| describe | Group related tests |
| it/test | Individual case |
| beforeEach | Common setup |

---

## 8. Test Data

### Strategies

| Approach | Use |
|----------|-----|
| Factories | Generate test data |
| Fixtures | Predefined datasets |
| Builders | Fluent object creation |

### Principles

- Use realistic data
- Randomize non-essential values (faker)
- Share common fixtures
- Keep data minimal

---

## 9. Best Practices

| Practice | Why |
|----------|-----|
| One assert per test | Clear failure reason |
| Independent tests | No order dependency |
| Fast tests | Run frequently |
| Descriptive names | Self-documenting |
| Clean up | Avoid side effects |

---

## ❌ Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|-------|
| Test implementation | Test behavior |
| Duplicate test code | Use factories |
| Complex test setup | Simplify or split |
| Ignore flaky tests | Fix root cause |
| Skip cleanup | Reset state |

---

## Script

| Script | Purpose | Command |
|--------|---------|---------|
| [scripts/test_runner.py](scripts/test_runner.py) | Python test running utility | `python3 scripts/test_runner.py` |

---

> **Remember:** Tests are documentation. If someone can't understand what the code does from the tests, rewrite them.

---

## ✅ Quality Audit Checklist

Before concluding testing tasks or completing test coverage updates, verify compliance with the following:

- [ ] **AAA Structure Applied**: Every test clearly structures code block setups using Arrange-Act-Assert separators.
- [ ] **Unit Test Speed**: Fast unit assertions complete in <100ms and operate entirely free of external dependencies.
- [ ] **Explicit Mocking Boundaries**: Stub/Spy mock components are confined to external network resources, database integrations, or random timers; core business algorithms are never mocked.
- [ ] **Data Cleanup & Isolation**: Database mutations, fixtures, and file modifications are completely purged after test runs to ensure state isolation.
- [ ] **No Implementation Testing**: Asserts verify expected behavioral contract outcomes rather than internal private method implementation details.
