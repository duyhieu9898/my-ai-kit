# Overview

## Current Behavior

Backlog is shipped as a self-contained skill in both target templates. Runtime code is synchronized from `shared/runtime/`, while credentials and logs are local to or derived from installed copies.

## Target Behavior

One local stdio MCP server at `backlog-mcp/` serves every project on the workstation. Target templates contain no Backlog skill runtime or per-project Backlog state.

## Affected Users

- Developers using Codex or Gemini across multiple local projects.
- Maintainers evolving Backlog workflows in the kit repository.

## Affected Product Docs

- `docs/product/toolkits.md`
- `docs/product/overview.md`
- `README.md`

## Non-Goals

- Remote MCP hosting.
- Multi-user authentication or authorization.
- Changing Backlog workflow semantics.
