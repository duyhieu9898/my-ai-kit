---
name: playwright-pro-patterns
description: >-
  Use when writing brand-new Playwright test suites from scratch.
  Professional Playwright E2E standards (waiting, data isolation, POM, web-first assertions).
  NOT for refactoring existing tests.
allowed-tools: Read Write Edit Glob Grep
---

# Playwright Pro Patterns (Test Creation)

> Guide for writing high-quality, stable, and professional E2E tests from scratch.

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

## ✅ New Test Quality Gate (Checklist)

Before finishing a new test file, ensure:
- [ ] No `waitForTimeout` or hardcoded sleeps are used.
- [ ] No `expect(...).toBeVisible()` is used immediately before a `click()` or `fill()`.
- [ ] All complex flows are grouped into descriptive `test.step()` blocks.
- [ ] Every test is independent (no module-level state leakage).
- [ ] **Data cleanup (`afterEach`/`afterAll`) is implemented for any created data.**
- [ ] Assertions use web-first patterns (automatic retries).
- [ ] `test.describe` nesting is 2 levels or less.
- [ ] Reused logic is extracted into Page Object Models (POM).
