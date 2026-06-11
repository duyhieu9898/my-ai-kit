# 0011 Scoped Clean Code Guidance

Date: 2026-06-11

## Status

Accepted

## Context

The existing `clean-code` skill mixed implementation style, validation command
selection, log reporting, and user-confirmation workflow. It also imposed fixed
limits on function size, arguments, and nesting, and Antigravity force-loaded
it for agents that do not implement code.

These rules overlapped with Harness and `verify-changes`, encouraged unrelated
refactoring, and added context to planning and documentation tasks.

## Decision

Limit `clean-code` to scoped implementation-quality heuristics:

- follow repository conventions and existing boundaries first;
- prefer simple current solutions over speculative abstractions;
- treat complexity metrics as review signals rather than universal quotas;
- update required dependents while excluding unrelated cleanup;
- delegate validation selection and reporting to Harness and `verify-changes`.

Do not force-load `clean-code` for planning, product, documentation, discovery,
or orchestration agents. Keep it available for agents that write or refactor
code.

## Alternatives Considered

1. Keep strict universal limits. Rejected because framework and domain code may
   remain clearer when cohesive logic exceeds arbitrary thresholds.
2. Keep validation orchestration inside both skills. Rejected because duplicate
   authority creates contradictory execution behavior.
3. Make `clean-code` globally mandatory for every agent. Rejected because
   non-implementation tasks gain context without useful behavior.

## Consequences

Positive:

- Implementation guidance stays concise and locally adaptable.
- Validation ownership is unambiguous.
- Agents avoid unrelated cleanup and unnecessary abstractions.
- Non-code agents load less irrelevant context.

Tradeoffs:

- The skill no longer supplies universal numeric style limits.
- Agents must use repository context to judge acceptable complexity.

## Follow-Up

- Review traces for unnecessary cleanup or repeated ambiguity around abstraction.
