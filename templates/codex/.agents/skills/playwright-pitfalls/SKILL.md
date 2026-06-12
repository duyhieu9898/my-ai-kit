---
name: playwright-pitfalls
description: >-
  Use when refactoring, troubleshooting, or auditing existing Playwright test suites.
  Playwright pitfalls analysis covering timing, locators, assertions, and state isolation.
  NOT for new suites.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# 7 Critical Playwright Pitfalls

> Master these 7 categories to eliminate 90% of E2E test failures.

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| _No supplementary files_ | Main Playwright pitfalls procedures are in this file | Use this file by default |

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| Developing new Playwright test suites & best patterns | [`playwright-pro-patterns`](../playwright-pro-patterns/SKILL.md) |
| Integration testing & overall testing design | [`test-engineer`](../test-engineer/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When tasked with refactoring, troubleshooting, or auditing an existing Playwright test suite, follow this step-by-step procedure:

### Step 1: Map Execution & Failure Context
1. Run target tests to isolate failures, identify timing anomalies, or identify flaky behaviour.
2. Read test configuration files to understand parallel execution parameters and test dependencies.

### Step 2: Audit Timing & Locators
1. Review timing structures (Section 1). Remove all explicit `waitForTimeout` sleep statements and replace them with condition-based or URL-based syncs.
2. Review selector strategies (Section 2). Replace brittle CSS/XPath strings (`.form-group input`) with semantic Web-first locators (`getByRole`, `getByLabel`, `getByTestId`).

### Step 3: Refactor Assertions & Structure
1. Convert boolean-based assertions (Section 3) to asynchronous Web-First assertions (`expect(locator).toBeVisible()`) to enable automatic retry capabilities.
2. Audit data sharing (Section 4). Ensure data isolation exists across test steps, eliminating shared module-level `let` variables.
3. Clean up structure (Section 6 & 7) by ensuring nesting remains under 2 levels and removing `try/catch` assertion swallows.

### Step 4: Validate Test Robustness
1. Run the test suite in parallel mode to verify there is zero shared-state leakage.
2. Run the **Quality Audit Checklist** before final submission.

---

## Quick Reference

| # | Pitfall Category | Core Solution |
|:---|:---|:---|
| 1 | **Brittle Timing** | Replace `waitForTimeout` with condition-based waiting (URL, visibility). |
| 2 | **Brittle Locators** | Avoid CSS selectors. Prioritize `getByRole` and `getByTestId`. |
| 3 | **Static Assertions** | Use `expect(locator).toBeVisible()` instead of `isVisible()` boolean checks. |
| 4 | **Shared State** | Ensure data isolation. No module-level `let` variables or shared `beforeAll` data. |
| 5 | **Confidence-killing Mocks** | Only mock external services. Never mock your own backend API. |
| 6 | **Messy Structure** | Group tests with `describe` (max 2 levels). Use `test.step()` for readability. |
| 7 | **Conditional Logic** | Avoid `try/catch` around `expect`. Use `.count()` for optional UI elements. |

---

## 1. Brittle Timing & Navigation

**Mistake:** Using `page.waitForTimeout(ms)` or forgetting to wait for navigation.
**Result:** Flaky tests that pass locally but fail on slow CI runners.

```typescript
// ❌ BAD
await page.getByRole('button', { name: 'Submit' }).click();
await page.waitForTimeout(3000); // Guessing timing
await expect(page.getByText('Success')).toBeVisible();

// ✅ GOOD
await page.getByRole('button', { name: 'Submit' }).click();
await page.waitForURL('/dashboard'); // Explicit sync
await expect(page.getByText('Success')).toBeVisible();
```

---

## 2. Brittle Locators (CSS vs Semantic)

**Mistake:** Locating elements by CSS classes like `.btn-primary` or `.container > div`.
**Result:** Tests break on every UI refactor or library update.

```typescript
// ❌ BAD
await page.locator('.form-group input').fill('value');

// ✅ GOOD
await page.getByLabel('Username').fill('value');
await page.getByRole('button', { name: 'Save' }).click();
```

---

## 3. Static Assertions (Boolean vs Web-First)

**Mistake:** Asserting on boolean values like `isVisible()` or `textContent()` which do not retry.
**Result:** Silent failures or timing-related crashes.

```typescript
// ❌ BAD — snapshot check, no retry
const visible = await page.getByTestId('loading').isVisible();
expect(visible).toBe(false);

// ✅ GOOD — auto-retries for up to 5 seconds
await expect(page.getByTestId('loading')).not.toBeVisible();
```

---

## 4. Shared State & Data Leakage

**Mistake:** Sharing data between tests using module-level `let` or `beforeAll`.
**Result:** Tests pass alone but fail in parallel or when reordered.

```typescript
// ❌ BAD — shared state prone to race conditions
let userId: string;
test.beforeAll(async ({ request }) => { /* creates user */ });

// ✅ GOOD — data isolation
test('update profile', async ({ page, request }) => {
  const email = `test-${Date.now()}@example.com`;
  await request.post('/api/users', { data: { email } });
  await page.goto(`/profile/${email}`);
});
```

---

## 5. Confidence-killing Mocks

**Mistake:** Mocking your own API responses for happy-path tests.
**Result:** Mocks drift from reality, passing tests while production is broken.

**Rule:** Mock **external** services (Stripe, Analytics). Use your **real** API for core logic.

---

## 6. Messy Structure & Nesting

**Mistake:** Flat lists of tests or `describe` blocks nested 3+ levels deep.
**Result:** Impossible to track active hooks; unreadable reports.

**Rule:** Max 2 levels of `describe`. Use `test.step()` to label logical phases within a test.

---

## 7. Conditional Logic in Tests

**Mistake:** Wrapping `expect()` in `try/catch` to handle "optional" elements.
**Result:** Swallows real errors; non-deterministic test results.

```typescript
// ❌ BAD
try { await expect(page.locator('.popup')).toBeVisible(); } catch {}

// ✅ GOOD
const hasPopup = await page.locator('.popup').count() > 0;
if (hasPopup) { await page.locator('.close').click(); }
```

---

## ❌ Anti-Patterns

- Using fixed sleeps such as `page.waitForTimeout()` instead of condition-based waits.
- Targeting brittle CSS, XPath, or layout selectors instead of semantic locators.
- Sharing module-level test state across parallel test execution.
- Mocking first-party APIs for happy-path flows that should exercise real integration behavior.
- Swallowing assertion failures with `try/catch`.

---

## ✅ Quality Audit Checklist

Before concluding a Playwright test refactoring or troubleshooting task, verify compliance with the following:

- [ ] **No Hardcoded Timeout**: Removed all `page.waitForTimeout` or custom numeric sleep timers; implemented condition-based or URL-based syncs instead.
- [ ] **Semantic Locators**: Eliminated fragile CSS selectors (`.btn-primary`) or HTML structures (`div > span`); replaced them with `getByRole`, `getByLabel`, or `getByTestId`.
- [ ] **Web-First Assertions**: Verified all assertions use web-first matchers (e.g. `expect(locator).toBeVisible()`) that automatically retry, rather than boolean static checks.
- [ ] **State Isolation**: Verified no shared state variables (`let` at module level) are reused across tests, ensuring safety during parallel runner execution.
- [ ] **Mock Boundaries**: Core business logic and first-party endpoints use the real API; mock boundaries are reserved for third-party services (Stripe, Segment).
- [ ] **No try/catch Expects**: Eliminated fragile try/catch error suppression wrappers in test logic.
