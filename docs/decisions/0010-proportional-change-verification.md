# 0010 Proportional Change Verification

Date: 2026-06-11

## Status

Accepted

## Context

The existing `verify-changes` guidance required build, API, browser, edge-case,
and detailed reporting checks too broadly. This overlapped with Harness proof
selection and caused narrow changes to trigger unrelated validation work.

## Decision

Repository instructions, Harness lanes, story acceptance criteria, configured
verification commands, and the proof matrix determine required evidence.
`verify-changes` executes that evidence using project-native commands and starts
with the narrowest check that directly proves the changed behavior.

Broader suites, negative paths, API calls, browser checks, database operations,
and release audits remain required when the affected surface, risk lane, story,
or explicit user request calls for them.

## Alternatives Considered

1. Keep a universal full checklist for every change. Rejected because it ignores
   task scope and duplicates Harness proof selection.
2. Make verification optional for tiny changes. Rejected because even narrow
   changes need the smallest meaningful check.
3. Remove `verify-changes`. Rejected because executable evidence and proof-gap
   reporting remain useful across projects without a complete Harness.

## Consequences

Positive:

- Verification effort scales with risk and blast radius.
- Harness remains the authority for required proof.
- Agents prefer existing tests and project commands.
- Missing proof is reported instead of hidden behind broad unrelated checks.

Tradeoffs:

- Agents must inspect task context before choosing commands.
- Full-suite coverage is no longer automatic unless a stronger requirement
  selects it.

## Follow-Up

- Review future traces for unnecessary full-suite runs or under-verification.
