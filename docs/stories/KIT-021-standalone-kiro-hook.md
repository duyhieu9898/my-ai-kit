# KIT-021 Standalone Kiro Harness Hook

## Status

implemented

## Lane

normal

## Product Contract

The package contains a standalone Kiro IDE hook that provides bounded Harness
safety review without creating a Kiro toolkit target or installing agents,
skills, rules, workflows, or root instructions.

## Relevant Product Docs

- `docs/product/toolkits.md`
- `docs/stories/KIT-020-shared-codex-gemini-hooks.md`

## Acceptance Criteria

- The hook is stored at
  `templates/kiro/.kiro/hooks/harness-guard.kiro.hook`.
- The Kiro template contains no files outside `.kiro/hooks/`.
- The hook uses Kiro's native `preToolUse` and `askAgent` schema.
- The hook is limited to `shell` and `write` tool categories.
- The prompt covers destructive commands, sensitive values, and Harness
  high-risk edit surfaces.
- Kiro is not added to `TARGET_REGISTRY`; this is a standalone artifact rather
  than a complete install target.
- Template checks validate the JSON shape and npm packaging includes the hook.

## Design Notes

- Kiro IDE `runCommand` hooks do not currently receive complete tool arguments,
  so the shared deterministic Python policy cannot inspect the proposed
  operation reliably.
- `askAgent` can inspect the active tool context but consumes credits and is
  less deterministic than the Codex and Gemini adapters.
- Read tools are intentionally excluded because invoking an agent hook before
  every file read would add substantial token and latency overhead.
- The hook is warning/confirmation oriented; it is not presented as a complete
  security boundary.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | JSON shape assertions in template consistency checks |
| Integration | Not required; no installer target is added |
| E2E | Future real Kiro IDE session |
| Platform | npm package contains the `.kiro.hook` file |
| Release | `git diff --check` |

## Harness Delta

Kiro now has a minimal standalone guard artifact while cross-runtime policy
sharing remains limited to runtimes with usable structured tool payloads.

## Evidence

- Kiro hook JSON schema assertion passed.
- `npm run check:templates` passed 330 checks.
- `npm pack --dry-run --json` included only the standalone Kiro artifact under
  `templates/kiro/`.
- `git diff --check` passed.
