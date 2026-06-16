---
name: playwright-pro-patterns
description: >-
  Use ONLY when writing brand-new Playwright test files from scratch or scaffolding new E2E test suites.
  NOT for debugging, fixing, or refactoring existing tests.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Playwright Pro Patterns (Test Creation)

> Guide for writing high-quality, stable, and professional E2E tests from scratch.

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| _No supplementary files_ | Main Playwright test-creation procedures are in this file | Use this file by default |

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| Troubleshooting or refactoring legacy Playwright suites | [`playwright-pitfalls`](../playwright-pitfalls/SKILL.md) |
| Integration testing & overall testing design | [`test-engineer`](../test-engineer/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When tasked with writing a brand-new Playwright test suite from scratch, strictly follow this step-by-step procedure:

### Step 1: Initialize Suite Context & Project Layout
1. Check existing playwright configuration files to understand testing environment options.
2. Group related tests within `test.describe` blocks using descriptive, intent-driven names. Keep nesting under 2 levels.

### Step 2: Establish Page Object Models (POM)
1. For complex interactive elements or shared user flows, encapsulate DOM queries and actions within dedicated Page Classes.
2. Ensure Page Classes use accessible roles (`getByRole`, `getByLabel`) or test IDs (`getByTestId`) rather than CSS strings.

### Step 3: Write Independent Test Flows
1. Formulate tests where each `test()` block is entirely independent. Avoid module-level `let` parameters.
2. Utilize dynamic data generators (e.g. `user-${Date.now()}`) to avoid data collisions in shared parallel runners.
3. Organize longer test scenarios into logical phases using explicit `test.step()` wrappers.

### Step 4: Integrate Web-First Assertions & Cleanups
1. Bridge non-waiting API methods with `waitFor` or network condition gates. Otherwise, rely fully on standard auto-waiting triggers.
2. Apply web-first asynchronous assertions (`expect(locator).toBeVisible()`) to enable automatic retry capabilities.
3. Configure post-test database deletions or API hook cleanups (`afterEach`, `afterAll`) to leave target environments pristine.

---

## 🚀 1. Smart Waiting & Synchronization

Playwright is designed to be deterministic. Do not fight its engine with manual timeouts.

1. **Leverage Auto-waiting**: Standard actions (`click`, `fill`, `check`) already wait for visibility and actionability. Adding `expect(loc).toBeVisible()` before them is redundant noise.
2. **Technical Sync Gates**: Use `loc.waitFor({ state: 'visible' })` **ONLY** as a bridge before non-waiting methods like `evaluate()`, `count()`, or `innerText()`.
3. **Condition-based Waiting**: If a test needs to wait for a specific app state, use network-based waiting (`page.waitForResponse()`) or URL-based waiting (`page.waitForURL()`).

---

## 🛡️ 2. Data Isolation & Parallel Safety

A pro test suite must be able to run in parallel without race conditions.

1. **Isolation by Default**: Every test should be self-contained. Never rely on the state left by a previous test.
2. **No Module-level State**: Avoid `let` variables in the file scope. Keep IDs, tokens, and test data inside the `test()` block or custom fixtures.
3. **Dynamic Data**: Generate unique identifiers (e.g., `user-${Date.now()}`) to avoid collisions in shared environments.
4. **Scoping with `beforeEach`**: Use `beforeEach` for navigation or setup that applies to a group of tests. Avoid `beforeAll` for data-heavy setup as it creates worker-shared state.
5. **Mandatory Cleanup**: Always use `afterEach` or `afterAll` hooks to delete created test data via API calls. Leave the environment exactly as you found it.

---

## 🎭 3. Professional Assertions & Mocking

Assert what matters; mock what you can't control.

1. **Web-first Assertions**: Always use `expect(locator).toBeVisible()` or `expect(locator).toHaveText()`. Avoid boolean assertions like `expect(await loc.isVisible()).toBe(true)`.
2. **Mocking External Noise**: Stub or abort third-party scripts (Analytics, Chat widgets, Stripe) to keep tests fast and deterministic.
3. **Real API over Happy-path Mocks**: Test your core business logic against your real backend. Mocking your own API should be reserved for error scenarios (500s, 404s).
4. **Handling Optional UI**: Use `locator.count()` to check for elements that may or may not appear (like popups). Do not use `try/catch` around `expect`.

---

## 🧹 4. Clean Architecture & Structure

Tests should be as readable as documentation.

1. **Grouping with `describe`**: Use `test.describe` to group related tests. Limit nesting to **max 2 levels** for clarity.
2. **Intent-Driven Steps**: Wrap logical phases (e.g., "Login", "Add to Cart", "Checkout") in `test.step()`. This drastically improves trace and report readability.
3. **Semantic Locators**: Write tests using accessible roles (`getByRole`, `getByLabel`) or stable test IDs (`getByTestId`). Never use CSS classes or volatile DOM structures.
4. **Page Object Model (POM)**: For complex or reused logic across files, encapsulate locators and actions in Page Classes. This prevents locator duplication and simplifies maintenance.
5. **Intent-Driven Naming**: Use the pattern `test.describe('Feature (Category - Data Strategy)', ...)` to clarify the test's scope and environment (e.g., `Daily Review (Functional - Mocked)`).

---

## ❌ Anti-Patterns

- Starting a new suite with hardcoded sleeps or fixed delays.
- Sharing module-level state or `beforeAll` data across parallel tests.
- Mocking first-party happy-path API behavior instead of exercising real application logic.
- Using CSS classes, XPath, or volatile DOM structures for core locators.
- Creating deeply nested `describe` blocks that obscure setup and teardown flow.

---

## ✅ Quality Audit Checklist

Before finishing a new test file, ensure:

- [ ] **No Hardcoded Sleep**: Removed all `waitForTimeout` or hardcoded custom sleep statements from code.
- [ ] **No Redundant Visibility Checks**: Avoided using `expect(...).toBeVisible()` immediately prior to implicit auto-waiting triggers (`click`, `fill`).
- [ ] **Descriptive Step Groups**: Complex flows and phases are properly grouped using `test.step()` blocks.
- [ ] **State Isolation**: Every test remains completely independent, containing zero module-level state leakage or shared worker values.
- [ ] **Mandatory Data Cleanup**: Active `afterEach`/`afterAll` hooks exist to tear down and purge created database records.
- [ ] **Web-First Assertions**: All tests assert conditions utilizing auto-retrying web-first matchers.
- [ ] **Proper Scope Nesting**: The maximum `test.describe` nesting does not exceed 2 levels.
- [ ] **POM Encapsulation**: Shared element locators and logic flows are properly organized under Page Object Model classes.
