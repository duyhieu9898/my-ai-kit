# Design

## Domain Model

The existing Backlog client, issue services, workflow rules, presenter, configuration, and journal remain the domain runtime. FastMCP is an adapter over the same command handlers.

## Application Flow

An MCP client starts the server over stdio, invokes a typed tool, and receives structured JSON. The adapter maps tool arguments to the existing command handler. API calls use the single local credential and all observability is written under `backlog-mcp/logs/`.

## Interface Contract

The MCP exposes typed equivalents of the existing issue, bug, story, project, and configuration commands. Mutation tools accept `apply: bool = false`; omission always produces a dry run.

## Data Model

No database is introduced. JSON config and project catalogs live under `backlog-mcp/config/`; `.env` and `logs/` are local ignored state under `backlog-mcp/`.

## UI / Platform Impact

Codex and Gemini register the same local stdio command once at user scope. Project templates no longer include the Backlog skill.

## Observability

Operational logs, JSONL metrics, and session traces are rooted under `backlog-mcp/logs/`. Secrets and full API-key query strings must never be logged.

## Alternatives Considered

1. Installer-managed merging of per-project skill state.
2. Per-project MCP copies.
3. Remote MCP service.
