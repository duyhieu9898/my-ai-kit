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

Checked 2026-06-24:

- `uv run --project backlog-mcp pytest backlog-mcp/tests` passed: 113 tests.
- `npm run test:shared-runtime` passed.
- `npm run check:templates` passed: shared runtime, shared hooks, and 766
  template consistency checks.
- `npm run verify` passed: installer regressions, 9 hook tests, shared runtime,
  shared hooks, and template consistency.
- `npm pack --dry-run --json` passed; package contained 385 entries, no
  `skills/backlog`, `backlog_tool`, or `scripts/backlog.py` installable template
  paths, and both target markers remained present.
- Stdio MCP smoke passed via `uv --project backlog-mcp run backlog-mcp-server`;
  client initialization and tool discovery returned 15 tools.

Current gap:

- The implementation does not yet preserve the documented mutation dry-run
  contract. `create_issue`, `update_issue`, `resolve_bug`, and `create_ut_bug`
  append `--apply` directly, while this story, the decision record, README, and
  architecture docs say mutation tools should default to preview and require an
  explicit apply mode. Keep the story open until that safety contract is either
  implemented or deliberately changed through a follow-up decision.
