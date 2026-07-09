# 0008 Install Supported Tool Runtimes Into `.agents`

Date: 2026-06-11

## Status

Accepted

## Context

The CLI supports multiple coding tools. Maintaining separate top-level runtime
folders makes status detection, ignore rules, and updates inconsistent.

## Decision

Install supported tool runtimes under `.agents/`, with tool-specific root
instructions and integration settings outside `.agents/`.

## Alternatives Considered

1. Keep Codex in `.codex/` and Gemini in `.agent/`.
2. Install all supported runtimes side-by-side.

## Consequences

Positive:

- One runtime location and one ignore rule.
- Simpler status and update behavior.
- One install command prepares the project for all supported tools.

Tradeoffs:

- Runtime detection depends on stable template structure and required config
  files.

## Follow-Up

- Preserve obsolete-folder detection for migration guidance.
