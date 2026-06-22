# Backlog Local MCP

## Goal

Replace the duplicated Backlog skill runtime with one repository-root local MCP server shared by every project on the workstation.

## Scope

- In: move the Python runtime to `backlog-mcp/`, expose the existing commands as MCP tools, centralize local config, credentials, logs, metrics, and sessions there, remove all Backlog skill copies, and update distribution contracts.
- Out: remote hosting, multi-user authentication, and live Backlog API verification.

## Tasks

- [ ] Add the `backlog-mcp/` Python project and FastMCP stdio entrypoint around the existing tested domain runtime.
  Verify: compile the package and inspect the MCP tool contract with the official SDK.
- [ ] Preserve dry-run behavior and structured results for every existing Backlog command.
  Verify: run the migrated unit suite and focused MCP contract tests.
- [ ] Relocate local `.env` and log state under `backlog-mcp/` without exposing credentials or deleting existing logs.
  Verify: assert the settings paths resolve inside the MCP root and legacy log files remain present.
- [ ] Remove Backlog skill directories from `shared/runtime/`, Codex, and Gemini templates.
  Verify: targeted searches find no `.agents/skills/backlog` path.
- [ ] Remove Backlog-specific shared-runtime synchronization and update toolkit/package documentation.
  Verify: shared-runtime drift tests and template consistency pass.
- [ ] Document global local-client registration for Codex and Gemini.
  Verify: README examples launch the same root MCP command independent of project cwd.

## Done When

- [ ] One local `backlog-mcp/` owns code and runtime state, no Backlog skill is shipped, and repository verification passes.
