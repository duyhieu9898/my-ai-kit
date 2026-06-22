# Exec Plan

## Goal

Replace duplicated Backlog skills with one safe local MCP server shared across projects.

## Scope

In scope:

- MCP project, runtime/state relocation, template removal, distribution contracts, tests, and documentation.

Out of scope:

- Remote deployment and live credentialed API testing.

## Risk Classification

Risk flags:

- External systems.
- Public contracts.
- Existing behavior.
- Credentials and operational logs.

Hard gates:

- Preserve dry-run defaults and secret redaction.
- Preserve existing local state before removing skill directories.
- Pass MCP contract, Backlog runtime, template, installer, and package checks.

## Work Phases

1. Capture the architecture decision and proof plan.
2. Move the runtime and introduce the MCP adapter.
3. Relocate local state and remove duplicated skill copies.
4. Update distribution contracts and documentation.
5. Run focused and broad verification.
6. Record evidence in Harness.

## Stop Conditions

Pause for human confirmation if:

- Existing credential files conflict and no safe canonical value can be selected.
- Preserving local logs requires destructive overwrite.
- MCP registration requires changing user-global client configuration automatically.
- Backlog workflow behavior must change to complete the migration.
