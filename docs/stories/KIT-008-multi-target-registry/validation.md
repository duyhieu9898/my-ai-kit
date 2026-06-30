# Validation

> Manual validation only (per human decision). No automated test framework.

## Proof Strategy

The story is done when the CLI passes syntax check, both runtimes (Codex and Gemini)
are installed side-by-side on `init`, and a dry-run confirms correct file layout,
merged hooks, and preserved root instructions on update.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | none (manual only) |
| Integration | `init` installs both runtimes; `update` preserves root instructions; `init --force` overwrites; `repair` restores missing dirs |
| E2E | none |
| Platform | `node --check bin/index.js`; `node bin/index.js {init,update,status,repair} --help` |
| Performance | n/a |
| Logs/Audit | success summary lists both `.agents/skills` and `.agents/gemini` paths |

## Fixtures

- Scratch project dir (e.g. `/tmp/test-project`).
- Local CLI invoked via `node /path/to/bin/index.js`.

## Commands

```bash
node --check bin/index.js
node bin/index.js --help
node bin/index.js init --help
node bin/index.js update --help
# scratch dir dry-run
node bin/index.js init                        # installs codex + gemini side-by-side
node bin/index.js status                      # shows INSTALLED with harness info
node bin/index.js update                      # refreshes both runtimes, preserves root instructions
node bin/index.js repair                      # restores if corrupted
npm pack --dry-run --json                     # templates/codex + templates/gemini included
```

## Acceptance Evidence

Verified 2026-06-12 (manual validation, agent: kiro) — original single-target pass.

Revalidated 2026-06-29 (clean-code refactor, agent: antigravity):

- Dead code removed: `detectInstalledTarget`, `getTargetConfig`, `getRootInstructionFiles`,
  `mergeDirectory`, `DEFAULT_TARGET`, `gemini` entry in `TARGET_REGISTRY`.
- `TARGET_REGISTRY` simplified to `codex`-only with three banner fields.
- `showBanner` fixed: replaced `%-40s` printf placeholders (unsupported in Node.js)
  with `.padEnd(40)` + template literals for correct alignment.
- `mergeInstructionBlocks` fallback branch simplified: removed unreachable inner
  `if (incomingBlockNames.has(...))` (always false when `incomingBlocks.length === 0`).
- `node --check bin/index.js` → pass.
- `node scripts/test-installer.mjs` → installer regression tests passed.
- `node scripts/check-template-consistency.mjs` → 766 checks passed.
- `python3 scripts/test-validator-regressions.py` → 16 tests OK.
- `python3 scripts/test-hooks.py` → 9/9 hook tests passed.
- `harness-cli story verify KIT-008` → pass.
