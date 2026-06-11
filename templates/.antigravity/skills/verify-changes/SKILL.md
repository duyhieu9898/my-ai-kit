---
name: verify-changes
description: Prove changed behavior with proportional executable evidence selected from project-native checks, Harness risk lanes, story criteria, and the proof matrix. Use after code changes or explicit verification requests; do not automatically run every available check.
allowed-tools: Read, Bash, Grep, Glob
---

# Verify Changes

Prove the changed behavior with the smallest sufficient executable evidence.

## Authority

Apply verification requirements in this order:

1. Repository instructions and explicit user requirements.
2. Harness lane, story acceptance criteria, configured verification command,
   and proof matrix.
3. Project-native test, build, lint, typecheck, and smoke commands.
4. This skill's defaults when the project provides no stronger direction.

Do not weaken required proof. Do not expand a narrow task into a release audit
unless the affected contract, risk lane, or user request requires it.

## Workflow

### 1. Map The Change

- Identify changed files, behavior, callers, and contracts.
- Inspect nearby tests and project command definitions such as `package.json`,
  `pyproject.toml`, task runners, CI files, or story verification commands.
- Distinguish executable behavior from docs-only or metadata-only changes.

### 2. Select Proportional Proof

| Scope | Default evidence |
|---|---|
| Tiny docs/copy/metadata | Structural check, parser, link check, or diff check when applicable |
| Tiny code change | Syntax/type check plus one targeted test or focused executable probe |
| Normal change | Targeted tests for changed behavior, then affected integration/build checks |
| High-risk or shared contract | Required story proof, negative paths, integration checks, and broader regression coverage |
| Release or explicit full verification | Project release suite, configured story verification, or full checklist |

Compilation alone is sufficient only when the changed contract is compilation
or syntax. API calls, browser checks, database operations, and server startup
are conditional on touching those surfaces.

### 3. Execute Narrow First

1. Run the closest existing test or reproduction for the changed behavior.
2. Run affected static or integration checks.
3. Expand to broader suites when:
   - required by Harness or acceptance criteria;
   - shared behavior has a wider blast radius;
   - targeted evidence exposes a regression;
   - the user requests release-level confidence.

Do not run every validator merely because it exists. Avoid unrelated network,
browser, database, or deployment checks.

### 4. Handle Missing Proof

If no suitable test exists:

- run a focused executable smoke or reproduction command;
- add a regression test when the behavior is important and test creation is in scope;
- otherwise report the proof gap and what remains unverified.

Never replace unavailable runtime evidence with an unsupported claim.

### 5. Report Evidence

Keep the report proportional to the task. Include:

- commands executed;
- observed pass/fail result and relevant counts;
- behavior directly proven;
- skipped or unavailable checks with the reason.

Do not paste full logs unless requested. Do not claim that unexecuted checks
passed.

## Verification Checklist

- [ ] Required Harness/story proof was identified and respected.
- [ ] Commands came from project-native configuration where available.
- [ ] Evidence directly covers the changed behavior.
- [ ] Negative or boundary cases were checked when risk or behavior warrants them.
- [ ] Broader suites were run only when justified.
- [ ] Remaining gaps and skipped checks are explicit.

## Anti-Patterns

| Anti-pattern | Correction |
|---|---|
| Always run build, lint, tests, curl, and browser checks | Select checks for the changed surface and required proof |
| Run the full suite for a one-line local change | Start with the closest targeted check |
| Treat compilation as proof of runtime behavior | Execute the behavior or its test |
| Invent commands without inspecting project configuration | Prefer existing scripts, tests, and story commands |
| Skip all verification because a change is small | Run the smallest meaningful check |
| Stop after a failing check without diagnosis | Report the failure and investigate when fixing is in scope |
