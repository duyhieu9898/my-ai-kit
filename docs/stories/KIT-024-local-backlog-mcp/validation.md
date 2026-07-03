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

Checked 2026-07-03:

- `uv run --project backlog-mcp pytest backlog-mcp/tests` passed: 117 tests,
  including Claude workspace propagation and preview/apply mutation contracts.
- `npm run test:shared-runtime` passed.
- `npm run check:templates` passed: shared runtime, shared hooks, and 766
  template consistency checks.
- `npm run verify` passed: installer regressions, 9 hook tests, shared runtime,
  shared hooks, and template consistency.
- `npm pack --dry-run --json` passed; package contained 363 entries, no
  `skills/backlog`, `backlog_tool`, or `scripts/backlog.py` installable template
  paths; `backlog-mcp/` had zero package entries.
- Claude Code 2.1.198 user-scope registration succeeded. `claude mcp get
  backlog` reported the stdio server as connected from the stable absolute
  checkout path.
- MCP tool discovery exposes `mode: "preview" | "apply"` with `preview` as the
  default for all mutation tools.
- `scripts/bin/harness-cli story verify KIT-024` passed the complete story
  command, including the mutation safety guard.
