# 0008 Install Both Toolkit Modes Into `.agents`

Date: 2026-06-11

## Status

Accepted

## Context

The CLI supports Codex and Gemini Antigravity, but maintaining separate runtime
folders makes status detection, ignore rules, and updates inconsistent.

## Decision

Install either selected toolkit into `.agents/`. Detect the active mode from
the installed directory shape.

## Alternatives Considered

1. Keep Codex in `.codex/` and Gemini in `.agent/`.
2. Install both modes simultaneously.

## Consequences

Positive:

- One runtime location and one ignore rule.
- Simpler status and update behavior.
- Mode selection remains explicit.

Tradeoffs:

- Switching modes replaces the existing `.agents/` toolkit.
- Mode detection depends on stable template structure.

## Follow-Up

- Preserve obsolete-folder detection for migration guidance.
