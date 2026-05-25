---
name: playwright-pitfalls
description: >-
  Use when refactoring, troubleshooting, or auditing existing Playwright test suites.
  Playwright pitfalls analysis covering timing, locators, assertions, and state isolation.
  NOT for new suites.
allowed-tools: Read Write Edit Glob Grep
---

# 7 Critical Playwright Pitfalls


> Strategic guidelines and procedures for the Playwright Pitfalls capability in this repository.

## 📑 Content Map

| File / Resource | Description | When to Read |
|:---|:---|:---|
| `SKILL.md` | Core guidelines, procedures, and best practices | Active throughout task execution |
| `agents/openai.yaml` | Codex UI and implicit invocation policy configuration | During skill indexing or UI setup |

## 🔗 Related Skills

| Skill | Relationship | When to Collaborate |
|:---|:---|:---|
| `clean-code` | Quality Foundation | To ensure strict clean code, typing, and safety standards |
| `simplify-code` | Refactor Companion | When dealing with redundant loops, nested conditions, or long blocks |




---

## Quick Reference

| # | Pitfall Category | Core Solution |
|---|---|---|
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
