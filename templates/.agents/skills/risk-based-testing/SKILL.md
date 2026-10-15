---
name: risk-based-testing
description: >-
  Picks which behaviours of a change deserve a Vitest test, writes few strong
  ones, and checks the rest in the browser via Chrome DevTools MCP. Use when
  about to write tests, including while implementing a feature or fix, when
  reviewing weak tests, or when confirming a UI change works. Not for
  Playwright suites (use webapp-testing).
---

# Risk-Based Testing

A test is worth writing when it fails for a bug someone could plausibly
introduce, and survives every refactor that keeps behaviour. Everything else
is maintenance cost. Follow the project's existing test layers; where it has
none, use this split:

- **Vitest** guards logic that can regress silently: money, permissions,
  state transitions, data mapping, API contracts.
- **Chrome DevTools MCP** checks the change in the real app once: rendering,
  wiring, console, network, layout. It replaces most component and E2E tests.
- **Playwright E2E:** extend the project's suite when it has one and the
  changed flow is in it; otherwise only when the user asks.

When superpowers TDD is active, this skill decides *which* behaviours get a
test; TDD governs the order in which you write them.

## 1. Decide what to test

List the behaviours the change adds or alters, then classify each one:

| Code | Example in this stack | Action |
|---|---|---|
| Domain logic, calculations, validation, permission checks | pricing utils, Zustand actions with rules, Zod schemas with refinements, Express auth middleware | Unit test: boundaries and every branch |
| Glue with many collaborators | Express route + Mongoose, component + query hook + store | One or two integration tests at the seam: supertest with a real DB, or RTL with a real QueryClient, real store, MSW |
| Logic tangled with I/O or JSX | a component that computes totals inline | Extract it to a pure function first (see `react-refactor-patterns`), then unit-test that |
| Trivial or framework behaviour | setters, one-line formatters over `Intl`, static markup, styling, "useQuery caches", "Mongoose enforces `required`", type-only code | No test. Check visible effects in the browser |
| A reported bug | any | A test that reproduces it first; see the bug-fix steps in section 3 |

Then apply the gate to every candidate test:

> **Name the break.** Which plausible code change makes this test fail, and
> is that change a bug? If you cannot name one, drop the test. If only a
> deliberate design change would fail it, it is a change detector; drop it.

**Budget.** Start from one test per branch or boundary of the classified
logic, and one integration test per seam for the happy path plus the error
path users see. Merge cases that exercise the same branch into one `it.each`
table. A test that is a subset of another test goes.

Write the plan before code, one line per test:
`<file> — <behaviour> — catches: <the break>`. Also list what you will check
in the browser instead.

## 2. Write the tests

Read [references/anti-patterns.md](references/anti-patterns.md) before
writing or reviewing tests. Read
[references/stack-setup.md](references/stack-setup.md) when you set up
Vitest, MSW, TanStack Query, Zustand, or supertest, or when a test misbehaves.

- **Follow the project:** existing config, setup files, helpers, file
  placement, and the installed versions in `package.json`. Do not add
  dependencies without asking.
- **Mock only what you do not own:** HTTP via MSW, time, randomness,
  third-party SDKs. Never `vi.mock` your own modules, hooks, or stores.
- **Assert what a caller observes:** return values, thrown errors, HTTP
  status and body, the rendered text and roles. Expected values are literals
  you worked out by hand, never recomputed with the code under test.
- **Shape:** one behaviour per test, named as a domain statement
  (`charges shipping when the discount drops the total under 500k`), flat
  `describe`, no logic in the test body, a factory for test data.

## 3. Prove each test is strong

1. **Watch it fail.** For new behaviour, run the test before the code exists
   or temporarily break the code (flip a comparison, return the default, drop
   a branch). A test that never failed proves nothing. Revert the break.
2. **Mutation check.** For the logic you tested, ask which of these would
   still pass: wrong constant, `>=` turned into `>`, a branch removed, an
   empty or default return, a missing state update, a missing null, empty, or
   unauthorized check. Each surviving mutation is either a missing case or a
   sign the case does not matter. For money or auth code with a Stryker setup
   already in the project, run it on the changed files.
3. **Bug fix:** write the reproducing test, run it, and read the failure. It
   must fail for the reported reason; a test that passes before the fix does
   not reproduce the bug, so keep looking. Then fix and rerun.

## Running tests

- Narrowest scope first: `npx vitest run <file>` (add `-t "<name>"` for one
  test), then the project's own test command.
- When the project's command is unknown:
  `python3 .agents/skills/risk-based-testing/scripts/test_runner.py <project> [--coverage]`
  detects Vitest, Jest, `npm test`, or pytest, runs the whole suite, and
  prints a JSON summary. Run it; do not read the source.

## 4. Verify in the browser

Read [references/browser-verification.md](references/browser-verification.md)
before driving the app. Use whichever Chrome DevTools MCP server is installed
(its tools are named `take_snapshot`, `list_network_requests`, and so on).

- **When:** after the unit tests pass, for a change that alters what the user
  sees or does: rendering, a form or flow, a request the UI sends, layout.
  Skip it when the change is logic already covered by tests, or has no UI.
- **Scope:** only the flows and edge states the change touches, not a tour of
  the app. One pass through each, with the evidence from the reference.

If the browser check finds a bug in logic you could have unit-tested, add
that test; do not rely on the next manual check to catch it again.

## Reviewing an existing or agent-written suite

Run the gate from section 1 and the catalogue in
`references/anti-patterns.md` over each test. Report per test: keep, merge
(with which), rewrite (why), or delete (why). Do not delete tests without the
user's approval.

## Done when

Report, in this order:

1. **Tested:** each test, the break it catches, and that it was seen failing.
2. **Verified in the browser:** steps, network and console evidence.
3. **Deliberately not tested:** each skipped behaviour and why.
4. **Not verified:** anything you could not run or check.
