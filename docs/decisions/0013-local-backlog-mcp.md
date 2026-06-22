# 0013 Local Backlog MCP

Date: 2026-06-22

## Status

Accepted

## Context

The Backlog integration is copied from `shared/runtime/` into both target templates and then into every installed project. Credentials, mutable project selection, catalogs, logs, metrics, and session traces consequently have unclear ownership and can drift or be replaced during kit updates.

## Decision

Replace the distributed Backlog skill with one local stdio MCP server at `backlog-mcp/`. The server is registered once per workstation and serves all projects. Its source, configuration, credentials, logs, metrics, and sessions are rooted in that directory. Existing CLI/domain behavior remains available inside the MCP project for testing and diagnostics, while Codex and Gemini templates no longer ship a Backlog skill.

Mutating tools remain dry-run by default and require an explicit `apply` argument.

## Alternatives Considered

1. Preserve the skill and teach the installer to merge `.env`, config, and logs.
2. Copy an MCP server into every installed project.
3. Host a remote shared MCP service.

## Consequences

Positive:

- One runtime and state location serves every local project.
- Kit updates no longer replace Backlog credentials, logs, or mutable configuration.
- MCP tools provide typed contracts shared by different agents.

Tradeoffs:

- The workstation must install the Python MCP dependency and register the local server once.
- The local checkout becomes an operational dependency and must remain at a stable path.
- Remote access and multi-user availability are intentionally unsupported.

## Follow-Up

- Keep CLI and MCP contract tests aligned as Backlog workflows evolve.
- Revisit a packaged installer only if manual local registration becomes recurring friction.
