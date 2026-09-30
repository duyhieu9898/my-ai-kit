---
name: webapp-testing
description: >-
  Writes, debugs, and stabilizes Playwright end-to-end tests for web apps. Use
  when adding a browser test for a user flow, fixing a flaky or failing E2E
  run, or reviewing a Playwright suite. Not for unit or integration tests (use
  testing-patterns).
---

# Web App Testing (Playwright)

Read [references/playwright-rules.md](references/playwright-rules.md) before
writing or changing a test. It holds the locator, waiting, isolation, and
mocking rules this kit follows, with before/after examples.

## Defaults

- **Project setup:** follow the project's existing `playwright.config.*`,
  fixtures, and folder layout. Add a Page Object only when the same locators
  are used in more than one file.
- **Locators:** `getByRole`, `getByLabel`, `getByTestId`. No CSS classes or
  DOM paths.
- **Waiting:** rely on auto-waiting and web-first `expect(...)`. For
  navigation, wait on the URL or a response. Never use `waitForTimeout`.
- **Test data:** each test creates its own data with a unique suffix and
  deletes it through the API. No module-level `let`, and no data-heavy
  `beforeAll`.
- **Mocks:** stub third parties (payments, analytics, chat widgets). Use the
  real backend for happy paths; mock it only to force error states.

## Writing a test

1. **Happy path first**, then the unhappy paths that matter for this flow:

   | Scenario | How |
   |---|---|
   | Server error mid-flow | `page.route()` returns 500 for one request |
   | Slow network | `page.route()` delays the response |
   | Double submit | Click submit twice; expect one request or one record |
   | Session expires mid-form | Clear the auth cookie, then submit |
   | Empty state | Start with no data for this user |

2. **Structure:** group phases with `test.step()`, and nest `describe` at most
   two levels deep.
3. **Stability:** run only that file, `npx playwright test <file>
   --project=<one>`, then `--repeat-each=3` before calling it stable.

## Debugging a failure

1. **Read the trace first.** Rerun with `--trace on` and open it with
   `npx playwright show-trace <trace.zip>`. Read it before editing the test.
2. **Decide whether the app or the test is wrong.** A test that needs a sleep
   to pass is hiding an app race; report it instead of adding the sleep.
3. **Intermittent overlays** (cookie banners, product tours): register
   `page.addLocatorHandler()` once. Do not scatter
   `if (await locator.count())` checks.

## Quick smoke check without a suite

`python3 .agents/skills/webapp-testing/scripts/playwright_runner.py <url> [--screenshot] [--a11y]`

The script opens the page, reports status, title, and console errors, and can
save a screenshot or run basic accessibility checks. It needs the Python
`playwright` package and a browser (`playwright install chromium`). Run it;
do not read the source.

## Done when

The new or fixed test passes three repeats locally, uses no fixed sleeps, and
leaves no data behind. Hand off to `verify-changes` for the wider checks.
