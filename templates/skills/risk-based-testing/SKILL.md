---
name: risk-based-testing
description: >-
  Picks which behaviours of a change deserve a Vitest test, writes few strong
  ones, and checks the rest in the browser via Chrome DevTools MCP. Use when
  adding or reviewing tests, even mid-feature or mid-fix, or confirming a UI
  change works. Not for Playwright suites (use webapp-testing).
---

# Risk-Based Testing

A test is worth writing when it fails for a bug someone could plausibly
introduce, and survives every refactor that keeps behaviour. Everything else
is maintenance cost. Follow the project's existing test layers; where it has
none, use this split:

- **Vitest** guards logic that can regress silently: money, permissions,
  state transitions, data mapping, API contracts.
- **Chrome DevTools MCP** checks the change once in the real app: rendering,
  wiring, console, network, layout. It replaces most component and E2E tests
  but does not guard against regressions.
- **Playwright E2E:** extend the project's suite when it has one and the
  changed flow is in it; otherwise only when the user asks.

When a TDD workflow is active (such as superpowers), this skill decides
*which* behaviours get a test; TDD decides the order you write them in.

## 1. Decide what to test

List the behaviours the change adds or alters, then classify each one:

| Code | Example in this stack | Action |
|---|---|---|
| Domain logic, calculations, validation, permissions, guards | pricing utils, token amounts and decimals, Zod schemas with refinements, retry caps, double-submit guards, store actions with rules, Express auth middleware | Unit test: every branch, both sides of every boundary |
| Glue with many collaborators | Express route + Mongoose, component + query hook + store | One or two integration tests at the seam: supertest with a real DB, or RTL with a real QueryClient, real store, MSW |
| Logic tangled with I/O or JSX | a component that computes totals inline | Extract it to a pure function first (see `react-refactor-patterns`), then unit-test that |
| Trivial or framework behaviour | setters, one-line formatters over `Intl`, static markup, styling, "useQuery caches", "Mongoose enforces `required`", type-only code | No test. Check visible effects in the browser |
| A reported bug | any | A test that reproduces it first (section 3) |

> **Name the break.** For each candidate test: which plausible code change
> makes it fail, and is that change a bug? If you cannot name one, drop the
> test. If only a deliberate design change would fail it, it is a change
> detector; drop it.

**Budget.** One case per branch and per boundary side (a 5–10 rule needs 4,
5, 10, and 11), and per seam one integration test for the happy path plus one
for the error users see. Put the cases of one rule in one `it.each` table;
drop a case that adds no new branch or boundary side, and a test that is a
subset of another. Zero tests is a valid plan when the change has no logic
worth guarding.

Write the plan before code, one line per test:
`<file> — <behaviour> — catches: <the break>`. Also list what you will check
in the browser instead.

## 2. Write the tests

Read [references/anti-patterns.md](references/anti-patterns.md) before
writing or reviewing tests. Read
[references/stack-setup.md](references/stack-setup.md) when you set up
Vitest, MSW, TanStack Query, forms, i18n, web3 hooks, client stores, or
supertest, or when a test misbehaves.

- **Follow the project:** existing config, setup files, helpers, file
  placement, and the installed versions in `package.json`. Do not add
  dependencies without asking.
- **Mock only at the system edge:** HTTP via MSW, time, randomness, and
  third-party SDKs (or the thin wrapper you own around one). Keep your own
  modules, hooks, and stores real.
- **Assert what a caller observes:** return values, error codes, HTTP status
  and body, the rendered text and roles. Expected values are exact literals
  you worked out by hand, never recomputed with the code under test.
- **Shape:** one behaviour per test, named as a domain statement
  (`charges shipping when the discount drops the total under 500k`), flat
  `describe`, no logic in the test body, a factory for test data.

## 3. Prove each test catches its break

1. **See it fail.** Run the test alone (`npx vitest run <file> -t "<name>"`),
   make the break from its plan line in the code, and run it again. It must
   fail on the assertion, not on an import error or a crash. Undo the break
   and check with `git diff` that the code is back to what it was. A test
   that still passes is weak: fix the test, not the break. Under TDD, the red
   run before the code exists counts when it fails on the assertion.
2. **Look for missed breaks.** For the logic you tested, would any of these
   survive: a wrong constant, `>=` turned into `>`, a branch removed, an empty
   or default return, a missing null, empty, or unauthorized check? Each
   survivor is a missing case, or a case that does not matter. For money or
   auth code in a project with Stryker set up, run it on the changed files.
3. **Bug fix:** run the reproducing test before the fix. It must fail for the
   reported reason; if it passes, it does not reproduce the bug, so keep
   looking. Then fix and rerun.

Then run the project's own test command. If it is unknown, run
`python3 .agents/skills/risk-based-testing/scripts/test_runner.py <project>`;
it finds the runner, runs the whole suite, and prints a JSON summary. Run
it; do not read the source.

## 4. Verify in the browser

Read [references/browser-verification.md](references/browser-verification.md)
before driving the app. Use whichever Chrome DevTools MCP server is installed
(its tools are named `take_snapshot`, `list_network_requests`, and so on).

- **When:** after the tests pass, for a change that alters what the user sees
  or does: rendering, a form or flow, a request the UI sends, layout. Skip it
  when the change has no UI or is logic already covered by tests.
- **Scope:** only the flows and edge states the change touches, not a tour of
  the app. One pass through each, with the evidence from the reference.

Add a unit test for any logic bug the browser check finds. Never report a
check you did not run.

## Reviewing an existing suite

Run the gate from section 1 and the catalogue in
`references/anti-patterns.md` over each test, and classify the code under
test with the table to find what is missing. Give each test a verdict: keep,
merge (into which), rewrite (why), or delete (why). Confirm a suspected
"cannot fail" test by making its break. Report bugs the review exposed
first, then critical behaviour with no test (money, auth, state, guards),
then tests that cannot fail or miss the likely bug, then merge and delete
candidates. For a large suite, report per file and list only the tests that
are not keep. Do not delete tests without the user's approval.

## Report

1. **Tested:** each test, the break it catches, and that it was seen failing.
2. **Verified in the browser:** the evidence block from the reference.
3. **Deliberately not tested:** each skipped behaviour and why.
4. **Not verified:** anything you could not run or check.
