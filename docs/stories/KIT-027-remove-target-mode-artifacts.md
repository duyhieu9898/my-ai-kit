# KIT-027 Remove Obsolete Target-Mode Artifacts

## Status

implemented

## Lane

normal

## Product Contract

The repository no longer exposes or documents the old target-mode installation
surface. The supported installer contract is a unified side-by-side runtime
install for Codex, Gemini Antigravity, and Claude Code.

## Relevant Product Docs

- `README.md`
- `docs/product/overview.md`
- `docs/product/cli.md`
- `docs/product/toolkits.md`
- `docs/ARCHITECTURE.md`
- `docs/HARNESS.md`

## Acceptance Criteria

- Runtime code no longer uses old target-mode configuration for banner or
  installer behavior.
- Legacy generated template folders are removed from the package surface.
- Current docs and maintained stories no longer point to old target-mode flags,
  marker files, or legacy generated template folders as active behavior.
- Validation proves installer, hook, and template checks still pass.

## Design Notes

- Commands: `init`, `update`, `status`, `repair`.
- Domain rules: preserve historical decision intent only when it does not keep
  obsolete commands alive as current guidance.

## Validation

When updating durable proof status, use numeric booleans:
`scripts/bin/harness-cli story update --id KIT-027 --unit 0 --integration 1 --e2e 0 --platform 1`.

| Layer | Expected proof |
| --- | --- |
| Unit | not required |
| Integration | installer and template consistency checks |
| E2E | not required |
| Platform | package dry-run excludes legacy template folders |
| Release | `npm run verify` |

## Harness Delta

Remove stale target-mode source-of-truth material now superseded by the unified
installer contract.

## Evidence

- Removed old target-mode banner registry code from `bin/index.js`.
- Removed legacy generated Codex/Gemini template files.
- Removed the obsolete multi-tool selection spec and decision/story packet.
- Updated current product, architecture, Harness, and story docs to the unified
  runtime layout.
- `node --check bin/index.js && npm run test:installer` passed.
- `npm run check:templates` passed 768 checks.
- `npm run verify` passed.
- `npm pack --dry-run --json` plus package path assertion confirmed the package
  excludes legacy generated template folders.
- `git diff --check` passed.
- `scripts/bin/harness-cli story verify KIT-027` passed using `npm run verify`.
