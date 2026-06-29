---
name: webapp-testing
description: >-
  Use when writing E2E web browser test flows or conducting deep web application routing audits.
  Systematic web app testing (Playwright, accessibility). NOT for unit-only tests or manual QA without browser automation.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Web App Testing

> Discover and test everything. Leave no route untested.

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| [scripts/playwright_runner.py](scripts/playwright_runner.py) | Playwright test running wrapper utility | Execute when verifying web routes |

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| QA automation architectures and environments | [`qa-automation-engineer`](../qa-automation-engineer/SKILL.md) |
| Creation rules for Playwright suites | [`playwright-pro-patterns`](../playwright-pro-patterns/SKILL.md) |
| Legacy test refactoring and debugging | [`playwright-pitfalls`](../playwright-pitfalls/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When tasked with writing web browser E2E flows or routing audits, strictly follow this step-by-step procedure:

### Step 1: Conduct Route Discovery (Audit Target mapping)
1. Scan the codebase (router files, `app/` directories, `pages/` layouts) to establish a comprehensive map of all active routes (Discovery First).
2. Grep for active backend/frontend API endpoints to verify schema connections.

### Step 2: Establish Framework Dependencies
1. Confirm dependency setups (`pip install playwright` or Node equivalents).
2. Configure settings (retries, traces, screenshots) within test pipeline profiles.

### Step 3: Compose E2E & Visual Suite Abstractions
1. Write E2E testing scenarios under robust Page Object Model Page Classes.
2. Integrate visual regression parameters to map interface baseline structures (Visual Testing).
3. Verify status schemas across happy/unhappy APIs (API Testing).

### Step 4: Run Pipelines & Validate Teardown
1. Execute playwright runners to verify target URLs.
2. Confirm state cleanup. Run the **Quality Audit Checklist** before final submission.

---

## 🔧 Runtime Scripts

**Execute these for automated browser testing:**

| Script | Purpose | Usage |
|--------|---------|-------|
| [scripts/playwright_runner.py](scripts/playwright_runner.py) | Basic browser test | `python3 scripts/playwright_runner.py https://example.com` |
| | With screenshot | `python3 scripts/playwright_runner.py <url> --screenshot` |
| | Accessibility check | `python3 scripts/playwright_runner.py <url> --a11y` |

**Requires:** `pip install playwright && playwright install chromium`

---

## 1. Deep Audit Approach

### Discovery First

| Target | How to Find |
|--------|-------------|
| Routes | Scan app/, pages/, router files |
| API endpoints | Grep for HTTP methods |
| Components | Find component directories |
| Features | Read documentation |

### Systematic Testing

1. **Map** - List all routes/APIs
2. **Scan** - Verify they respond
3. **Test** - Cover critical paths

---

## 2. Testing Pyramid for Web

```
        /\          E2E (Few)
       /  \         Critical user flows
      /----\
     /      \       Integration (Some)
    /--------\      API, data flow
   /          \
  /------------\    Component (Many)
                    Individual UI pieces
```

---

## 3. E2E Test Principles

### What to Test

| Priority | Tests |
|----------|-------|
| 1 | Happy path user flows |
| 2 | Authentication flows |
| 3 | Critical business actions |
| 4 | Error handling |

### E2E Best Practices

| Practice | Why |
|----------|-----|
| Use data-testid | Stable selectors |
| Wait for elements | Avoid flaky tests |
| Clean state | Independent tests |
| Avoid implementation details | Test user behavior |

---

## 4. Playwright Principles

### Core Concepts

| Concept | Use |
|---------|-----|
| Page Object Model | Encapsulate page logic |
| Fixtures | Reusable test setup |
| Assertions | Built-in auto-wait |
| Trace Viewer | Debug failures |

### Configuration

| Setting | Recommendation |
|---------|----------------|
| Retries | 2 on CI |
| Trace | on-first-retry |
| Screenshots | on-failure |
| Video | retain-on-failure |

---

## 5. Visual Testing

### When to Use

| Scenario | Value |
|----------|-------|
| Design system | High |
| Marketing pages | High |
| Component library | Medium |
| Dynamic content | Lower |

### Strategy

- Baseline screenshots
- Compare on changes
- Review visual diffs
- Update intentional changes

---

## 6. API Testing Principles

### Coverage Areas

| Area | Tests |
|------|-------|
| Status codes | 200, 400, 404, 500 |
| Response shape | Matches schema |
| Error messages | User-friendly |
| Edge cases | Empty, large, special chars |

---

## 7. Test Organization

### File Structure

```
tests/
├── e2e/           # Full user flows
├── integration/   # API, data
├── component/     # UI units
└── fixtures/      # Shared data
```

### Naming Convention

| Pattern | Example |
|---------|---------|
| Feature-based | `login.spec.ts` |
| Descriptive | `user-can-checkout.spec.ts` |

---

## 8. CI Integration

### Pipeline Steps

1. Install dependencies
2. Install browsers
3. Run tests
4. Upload artifacts (traces, screenshots)

### Parallelization

| Strategy | Use |
|----------|-----|
| Per file | Playwright default |
| Sharding | Large suites |
| Workers | Multiple browsers |

---

## ❌ Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|-------|
| Test implementation | Test behavior |
| Hardcode waits | Use auto-wait |
| Skip cleanup | Isolate tests |
| Ignore flaky tests | Fix root cause |

---

> **Remember:** E2E tests are expensive. Use them for critical paths only.

---

## ✅ Quality Audit Checklist

Before concluding web application testing tasks, verify compliance with the following:

- [ ] **Routing Scanned**: Conducted discovery scanning across `app/`, `pages/`, or router files to map all routes.
- [ ] **Dependencies Confirmed**: Ensured `playwright` chromium dependencies are properly installed.
- [ ] **POM Utilized**: Modular Page Object Model encapsulates element locators.
- [ ] **Visual Baseline**: Snapshot baselines exist for visual regression tests.
- [ ] **API schemas**: API endpoint tests verify status codes, schemas, and empty/unhappy payloads.
- [ ] **Auto-wait Enabled**: Hardcoded waits are removed in favor of auto-waiting dynamic selectors.
