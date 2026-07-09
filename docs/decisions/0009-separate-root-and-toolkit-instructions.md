# 0009 Separate Root And Toolkit Instructions

Date: 2026-06-11

## Status

Accepted

## Context

The same Codex `AGENTS.md` was previously copied both to the repository root
and into `.agents/`, even though those locations require different scopes.
Repository Harness and project-specific blocks also need to survive updates.

## Decision

Store repository-wide tool instructions in top-level template files such as
`templates/AGENTS.md`, `templates/GEMINI.md`, and `templates/CLAUDE.md`.
Store toolkit-maintenance instructions under `.agents/`. Refresh runtime files
during updates but preserve existing root instructions.

## Alternatives Considered

1. Use one instruction file at both levels.
2. Overwrite root instructions on every update.
3. Remove nested toolkit instructions.

## Consequences

Positive:

- Instruction scope matches directory ownership.
- Project-specific and Harness blocks survive toolkit updates.
- Toolkit maintenance rules stay concise.

Tradeoffs:

- Installer configuration must resolve root templates separately.
- Package validation must check both instruction sources.

## Follow-Up

- Keep README and toolkit architecture synchronized with installer behavior.
