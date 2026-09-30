---
name: verify-changes
description: >-
  Picks and runs the smallest project-native checks that prove a change,
  following Harness risk lanes, story proof, and the kit's checklist.py when
  present, and reports the evidence. Use when a change is ready to hand off
  or the user asks to test or verify it. Not for writing new tests (use
  testing-patterns).
---

# Verify Changes

Prove the changed behaviour with the smallest sufficient executable evidence,
and report exactly what was run. Other skills hand off here instead of
carrying their own check loops.

## Authority

Apply verification requirements in this order:

1. Repository instructions (`AGENTS.md`, `CLAUDE.md`) and explicit user
   requirements.
2. The Harness, when the project has one: the risk lane, the story's
   acceptance criteria and configured verify command, and the proof matrix.
3. Project-native test, build, lint, typecheck, and smoke commands.
4. The defaults below, when the project gives no stronger direction.

Do not weaken required proof. Do not expand a narrow task into a release
audit unless the affected contract, the risk lane, or the user asks for it.

## Where the proof requirements live

Check these only when they exist in the project:

- `docs/HARNESS.md`: the work loop and the risk lanes (tiny, normal,
  high-risk).
- `docs/FEATURE_INTAKE.md`: how a change is classified into a lane.
- `docs/TEST_MATRIX.md`: the proof matrix, mapping each story's contract to
  its unit, integration, E2E, and platform proof.
- `scripts/bin/harness-cli`: `query matrix` shows proof status and is the
  durable source when it disagrees with the Markdown matrix;
  `story verify <id>` runs a story's configured verify command.
- Project commands: `package.json` scripts, `pyproject.toml`, `Makefile` or
  task runners, and CI workflow files show what the project actually runs.
- Kit toolkit checks: `python3 .agents/scripts/checklist.py .` runs the
  bundled skill checks. Use it when the change touches what it checks, not
  after every edit.

## Select proportional proof

| Scope | Default evidence |
|---|---|
| Docs, copy, or metadata only | Parser, link check, targeted search, or `git diff --check` |
| Tiny code change | Syntax or type check plus one targeted test or focused probe |
| Normal change | Targeted tests for the changed behaviour, then affected integration or build checks |
| High-risk lane or shared contract | Required story proof, negative paths, integration checks, broader regression |
| Release or explicit full verification | Project release suite, `story verify-all`, or the full checklist |

Compilation alone is enough only when the changed contract is compilation or
syntax. API calls, browser checks, database operations, and server startup
are needed only when the change touches those surfaces.

## Run narrow first

1. Run the closest existing test or reproduction for the changed behaviour.
2. Run the affected static or integration checks.
3. Widen to broader suites only when the Harness or acceptance criteria
   require it, the change has a wide blast radius, targeted evidence exposes
   a regression, or the user asks for release-level confidence.

Avoid unrelated network, browser, database, or deployment checks. A check
that fails for a reason unrelated to the change is reported as such, not
silently skipped or "fixed" out of scope.

## When no suitable test exists

- Run a focused executable smoke or reproduction command.
- Add a regression test when the behaviour matters and test work is in scope
  (see `testing-patterns`, or `webapp-testing` for browser flows).
- Otherwise report the gap and what remains unverified.

## Report

Keep it proportional to the task:

- commands executed;
- observed pass or fail result, with relevant counts;
- the behaviour each check directly proves;
- skipped or unavailable checks, with the reason.

Do not paste full logs unless asked. Do not claim that a check passed unless
it was run in this session.

## Pitfalls

- Running build, lint, tests, curl, and browser checks by habit instead of
  for the changed surface.
- Treating a successful compile as proof of runtime behaviour.
- Inventing commands (`npm run test:unit`) without reading the project's
  configuration.
- Skipping verification because a change looks small.
- Stopping at a failing check without reading the failure; hand it to
  `debugger` when fixing is in scope.

## Done when

The required Harness or story proof, if any, was identified and met; the
evidence directly covers the changed behaviour; and every skipped check or
remaining gap is stated.
