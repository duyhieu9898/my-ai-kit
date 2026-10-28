---
name: code-review-checklist
description: >-
  Reviews a diff, pull request, or set of files for correctness and security
  problems and reports only confident findings, each with file:line and a
  severity. Use when asked to review code, a PR, or changes before merge. Not
  for a dedicated security audit or threat model (use security-auditor).
---

# Code Review

A review is useful when every finding is real, placed, and ranked. Ten
confident findings beat forty guesses: each false positive costs the author
time and teaches them to skim the rest.

## Scope the review

1. Get the change, not the whole repository:
   - local work: `git diff` and `git diff --staged`;
   - a branch: `git diff <base>...HEAD` (three dots: changes since the
     merge base);
   - a GitHub PR: `gh pr diff <number>` and `gh pr view <number>` for the
     description and linked issue.
2. Read the intent: PR description, linked story or acceptance criteria, and
   the commit messages. Review against what the change claims to do.
3. Read beyond the diff where it matters: callers of a changed function, the
   type or schema a change relies on, and the tests that cover it.
4. Skip generated files, lockfiles, snapshots, and vendored code unless the
   change is about them.

## Review in this order

1. **Correctness.** Does it do what it claims? Off-by-one and boundary cases,
   null or empty inputs, error paths that swallow or mis-handle failures,
   unawaited promises, wrong `await` inside loops, state changed on one path
   and not another, a changed contract whose callers were not updated.
2. **Security.** Untrusted input reaching SQL, shell, HTML, file paths, URLs
   (SSRF), redirects, or deserialisation; missing authorisation on a new
   route or action; secrets in code or logs. Treat model (LLM) output as
   untrusted input too when it reaches any of those sinks or a tool call.
   Hand a deep or cross-cutting concern to `security-auditor`.
3. **Data and concurrency.** Migrations that lock or lose data, missing
   transactions around multi-step writes, races on read-modify-write, cache
   invalidation.
4. **Performance, with a cause.** N+1 queries, unbounded loops or result
   sets, work repeated per request or per render. Report only when the
   input size or call frequency makes it matter.
5. **Tests.** Does a test fail if the change is reverted? Is the failure path
   covered? Missing tests for risky logic are a finding; missing tests for a
   rename are not.

Style, naming, and formatting are findings only when they hide a bug or break
a documented project convention. Leave what the linter or formatter already
enforces to the linter.

## Confidence threshold

Report a finding only when you can name the input, path, or sequence that
triggers it, or point to the line that breaks a stated requirement. When you
suspect a problem but cannot show it, either read more code until you can,
or list it as a question. Do not report something as a bug because a pattern
looks unusual.

## Severity

- **Blocker:** wrong behaviour, data loss, a security hole, or a broken
  contract. Must be fixed before merge.
- **Major:** likely bug on a less common path, or a missing test for risky
  logic. Should be fixed in this change.
- **Minor:** a real but low-impact issue. Fine to fix later.
- **Question:** something that looks wrong but may be intended; ask.

## Report format

Start with a one-line verdict (ready to merge, merge after blockers, or needs
rework), then findings ordered by severity:

```markdown
**Blocker** `src/billing/invoice.ts:88`
Refunds are subtracted twice when `partial` is true: `applyRefund` already
adjusts `total` at :61. Repro: refund 10 of 100 with partial=true, total is 80.
Fix: drop the second subtraction or pass the unadjusted total.
```

Each finding: severity, `file:line`, what goes wrong and when, and a concrete
fix. Group repeated instances of one issue into a single finding with all
locations. If there are no findings above the threshold, say so plainly.

## Boundaries

- Do not edit code during a review unless asked; propose the fix.
- Claims about test results need a run. If asked to confirm the change works,
  hand off to `verify-changes` and report what was actually executed.

## Done when

Every reported finding has a severity, a `file:line`, a trigger or evidence,
and a proposed fix; uncertain items are listed as questions; and the verdict
matches the worst finding.
