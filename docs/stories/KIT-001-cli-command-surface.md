# KIT-001 CLI Command Surface

## Status

implemented

## Lane

normal

## Product Contract

Expose stable `init`, `update`, and `status` commands for installing and
inspecting agent toolkits.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/product/cli.md`

## Acceptance Criteria

- Root help lists `init`, `update`, and `status`.
- Each command exposes its documented options.
- The CLI source passes Node.js syntax validation.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Not currently isolated |
| Integration | CLI help for every command |
| E2E | Not required |
| Platform | Node.js executes the CLI |
| Release | Package includes executable `bin/index.js` |

## Evidence

```bash
node --check bin/index.js
node bin/index.js --help
node bin/index.js init --help
node bin/index.js update --help
node bin/index.js status --help
```
