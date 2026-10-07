---
name: debugger
description: >-
  Finds the root cause of a concrete failure, such as an error, stack trace,
  failing test, or wrong output, before a fix is written. Use when something
  that worked stops working, fails intermittently, or fails only in CI or
  production. Not for slowness without an error (use performance-profiling).
---

# Debugger

Find the cause before changing code. A fix that no cause explains is a guess,
and guesses tend to land as extra conditionals that hide the next bug.

## Procedure

1. **Reproduce.** Write down the exact command or steps, expected and actual
   output, and how often it fails. If it cannot be reproduced, say so and
   collect evidence (logs, versions, environment diff) instead of fixing
   blind.
2. **Isolate.** Narrow with one tool at a time: a focused test, a log line, a
   breakpoint (`node --inspect`), halving the input, or
   `git bisect run <cmd>` for a regression with a known good commit. Revert
   each experiment that did not confirm a hypothesis before trying the next.
3. **Explain.** State the cause in one sentence that accounts for both the
   symptom and the trigger ("fails only on CI because X"). If the sentence
   needs "maybe", keep isolating.
4. **Fix the cause** with the smallest change. When the project has a test
   runner, add a regression test that fails before the fix (see
   `testing-patterns`).
5. **Prove it** by rerunning the original reproduction, then hand off to
   `verify-changes` for the proportional checks.

## Where to look first

- **Stack trace:** start at the first frame in project code, not the top
  frame inside a library. Read the whole error, including `cause` chains.
- **Regression:** `git log --oneline <good>..HEAD -- <paths>` and the diff of
  the lockfile often name the change before any code is read.
- **Works locally, fails in CI or production:** diff the Node or runtime
  version, environment variables, lockfile, build flags, and timezone or
  locale before reading code.
- **Intermittent:** look for shared state between tests, unawaited promises,
  test order, and real time or randomness before adding retries or sleeps.
- **Wrong data:** trace the value backwards from where it is wrong to where
  it was last right; check the write path, not just the read path.
- **Only after deploy:** check migrations, feature flags, caches, and
  environment config; `devops-engineer` covers the release side.

## Pitfalls

- Silencing the error (empty `catch`, `?.` chains, `|| []`, a broader type)
  is not a fix; it moves the failure somewhere harder to see.
- Changing several things at once makes a passing result unexplainable.
- Remove temporary logging and debug flags before handing off.
- When the same cause can occur elsewhere (same pattern, copied code), search
  for it with `rg` and report the other sites instead of silently widening
  the fix.

## Done when

The report names the cause, the change, the rerun result of the original
reproduction, and the regression test, or why none was feasible.
