# Validation

## Proof Strategy

Prove that the MCP exposes the expected typed tools, existing workflow tests still pass from the new root, local state resolves under the MCP directory, no Backlog skill remains in installable templates, and distribution checks stay green.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Existing Backlog client, settings, resolver, workflow, and presenter tests |
| Integration | MCP tool discovery and dry-run command mapping |
| E2E | Local stdio MCP initialization smoke test; no live Backlog mutation |
| Platform | Shared-runtime, template, installer, and npm package checks |
| Performance | Not required |
| Logs/Audit | Paths stay under `backlog-mcp/logs/`; secret redaction tests pass |

## Fixtures

Existing deterministic Backlog API fixtures and mock clients move with the runtime.

## Commands

```text
uv run --project backlog-mcp pytest backlog-mcp/tests
npm run test:shared-runtime
npm run verify
npm pack --dry-run --json
```

## Acceptance Evidence

Pending implementation.
