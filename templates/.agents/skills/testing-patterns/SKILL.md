---
name: testing-patterns
description: >-
  Writes and fixes unit and integration tests, including mocks, fixtures, and
  test-first bug fixes. Use when adding tests for new or changed code,
  reproducing a bug with a failing test, or deciding what to mock. Not for
  browser end-to-end tests (use webapp-testing).
---

# Testing Patterns

Tests here exist to catch regressions in behaviour a caller depends on. A test
that breaks on every refactor, or passes whether the code works or not, is a
cost, not coverage.

## Defaults

- **Runner and layout:** follow the project: `package.json` scripts, the
  existing config (`vitest.config.*`, `jest.config.*`, `pytest.ini`), and
  where existing tests live. With no runner yet, use Vitest for TypeScript,
  Node, and React, and pytest for Python.
- **React components:** Testing Library, querying by role, label, or text.
  Mock HTTP at the network layer with MSW rather than mocking `fetch` or the
  API client module.
- **What to mock:** only what you do not own or cannot control: network,
  clock, randomness, third-party SDKs, email or payment providers. Do not mock
  the module under test or your own pure helpers.
- **Integration tests** use the real database the project already provides
  for tests (a local Supabase or Postgres, a test container,
  `mongodb-memory-server`). Do not replace it with mocks to make a test pass.
- **Test data:** factories with valid defaults and per-test overrides; unique
  ids per test; no mutable module-level state; clean up in `afterEach`.
- **Assertions:** assert what a caller observes: return values, thrown errors,
  HTTP status and body, rendered text. Assert an internal call only when the
  call is the behaviour (an email was sent, an event was emitted).

## Test-first bug fix

1. Write a test that reproduces the report.
2. Run it and read the failure. It must fail **for the reported reason**. A
   test that passes before the fix does not reproduce the bug; keep looking.
3. Fix the code, rerun the test, then run the rest of that file or module.

## Running tests

- **Run the narrowest scope first:**
  - `npx vitest run <file> -t "<name>"`
  - `npx jest <file> -t "<name>"`
  - `pytest <file>::<test>`
- **Then the project's own command** (`npm test`, `pnpm test`…).
- **When the project's command is unknown:**
  `python3 .agents/skills/testing-patterns/scripts/test_runner.py <project> [--coverage]`
  detects Vitest, Jest, `npm test`, or pytest and prints a JSON summary. It
  runs the whole suite. Run it; do not read the source.

## Pitfalls

- **Vitest mocking:** `vi.mock()` is hoisted above imports, so variables it
  uses must be created with `vi.hoisted()`. `jest.*` globals do not exist in
  Vitest unless the project enables the compat globals.
- **Fake timers:** they must be restored in `afterEach`, or later tests in the
  file hang or pass for the wrong reason.
- **Snapshots:** large snapshot tests of whole trees get approved blindly.
  Prefer targeted assertions, with a small snapshot only for stable,
  serialisable output.
- **Coverage:** the percentage is not the goal. Cover the branches the change
  touched, including the error path.
- **Flaky tests:** look for shared state, unawaited promises, or real time and
  ordering. Do not add retries or sleeps to make them pass.

## Done when

The changed behaviour, and the bug case if there is one, have tests that
failed before the change and pass after it, and the affected suite passes.
Hand off to `verify-changes` for the wider checks.
