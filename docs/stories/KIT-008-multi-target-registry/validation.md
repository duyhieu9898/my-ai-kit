# Validation

> Manual validation only (per human decision). No automated test framework.

## Proof Strategy

The story is done when the CLI passes syntax check, all command help outputs show
the new `--target` surface, and a manual dry-run exercises install, target switch,
update, and status in a scratch directory. Deep behavioral testing is performed
by the human after install.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | none (manual only) |
| Integration | init → status → update cycle per target; codex→gemini switch cleanup; init --force overwrite |
| E2E | none |
| Platform | `node --check bin/index.js`; `node bin/index.js {init,update} --help` |
| Performance | n/a |
| Logs/Audit | verify deletion log on switch; success summary lists correct paths |

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
node bin/index.js init                       # default codex
node bin/index.js status                      # shows codex
node bin/index.js init --target gemini --force
node bin/index.js status                      # shows gemini
node bin/index.js update                      # auto-detect gemini
npm pack --dry-run --json                     # templates/codex + templates/gemini included
```

## Acceptance Evidence

Verified 2026-06-12 (manual validation, agent: kiro):

- `node --check bin/index.js` → pass (story verify KIT-008: pass).
- `init|update --help` → show `--target <name>` (`-t`); `--gemini` marked deprecated.
- Local mirror-logic test (scratch dir against migrated templates):
  - codex root instruction = `AGENTS.md`, gemini = `GEMINI.md`.
  - marker detection returns correct target after install.
  - codex→gemini switch deletes `AGENTS.md`, installs `GEMINI.md`.
  - `update` (overwriteRootInstruction:false) preserved a user-edited root file.
- `npm pack --dry-run` → templates/codex (326 files) + templates/gemini (212 files),
  both `.kit-target` markers present, zero old `.codex`/`.antigravity`/`root` folders.

Pending (out of agent scope): full network e2e install via giget requires the new
template layout to be pushed to `main`. Deep behavioral testing by human.
