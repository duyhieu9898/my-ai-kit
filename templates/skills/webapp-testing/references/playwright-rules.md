# Playwright Rules

Rules for writing and fixing Playwright tests. Each rule names the mistake it
prevents.

Contents:

1. Waiting
2. Locators
3. Assertions
4. Isolation and data
5. Mocking
6. Optional UI
7. Structure

## 1. Waiting

- Actions such as `click`, `fill`, and `check` already wait until the element
  is visible and actionable. Adding `expect(loc).toBeVisible()` right before
  them is noise.
- Methods that do not wait (`evaluate()`, `count()`, `innerText()`,
  `allTextContents()`) need `await loc.waitFor()` before them.
- To wait for app state, wait on what changes: `page.waitForURL()`,
  `page.waitForResponse()`, or a web-first assertion. Never
  `page.waitForTimeout()`; it passes locally and flakes on slow CI.

```ts
// Bad: guesses timing
await page.getByRole('button', { name: 'Submit' }).click();
await page.waitForTimeout(3000);

// Good: waits for the real signal
await page.getByRole('button', { name: 'Submit' }).click();
await page.waitForURL('/dashboard');
```

## 2. Locators

Prefer, in order: `getByRole` (with `name`), `getByLabel`, `getByText` for
static copy, then `getByTestId`. CSS classes and DOM paths break on every UI
refactor.

```ts
// Bad
await page.locator('.form-group input').fill('ada');
// Good
await page.getByLabel('Username').fill('ada');
```

## 3. Assertions

Use web-first assertions, which retry until they time out. Boolean checks
take one snapshot and race the UI.

```ts
// Bad: no retry
expect(await page.getByTestId('loading').isVisible()).toBe(false);
// Good: retries until hidden or timeout
await expect(page.getByTestId('loading')).toBeHidden();
```

Never wrap `expect` in `try/catch`. It swallows real failures.

## 4. Isolation and data

- **Self-contained tests:** each test passes when run alone and in any order.
  Parallel workers do not share state.
- **No shared variables:** no module-level `let` and no ids shared across
  tests. Keep data inside the test or a fixture.
- **Unique data:** generate it per test, e.g.
  ``const email = `e2e-${test.info().testId}@example.com` ``.
- **Setup:** use `beforeEach` for navigation. Avoid `beforeAll` for data,
  because it becomes worker-shared.
- **Cleanup:** delete created records through the API in `afterEach`, or in a
  fixture's teardown.

## 5. Mocking

- **Third parties:** stub or abort them (payments, analytics, chat,
  maps). They make runs slow and flaky.
- **Your own backend:** use it for happy paths. A mocked happy path passes
  while production is broken. Mock it with `page.route()` only to force error
  states (500, 404, timeouts) that the real backend cannot produce on demand.

## 6. Optional UI

For UI that may or may not appear, such as cookie banners, tours, or
newsletter pop-ups, register a handler once:

```ts
const acceptCookies = page.getByRole('button', { name: 'Accept cookies' });
await page.addLocatorHandler(acceptCookies, async () => {
  await acceptCookies.click();
});
```

Do not branch on `if (await loc.count() > 0)`. `count()` does not wait, so
the check races the pop-up.

## 7. Structure

- **Grouping:** `test.describe` groups related tests, nested at most two
  levels.
- **Steps:** wrap phases in `test.step('Checkout', …)` so the report and the
  trace read like the flow.
- **Page Objects:** use one only when the same locators and actions are
  reused across files. Otherwise keep locators in the test.
