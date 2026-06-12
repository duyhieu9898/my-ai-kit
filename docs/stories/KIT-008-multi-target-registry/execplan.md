# Exec Plan

> Spec source: `docs/specs/multi-target-registry/SPEC.md`

## Goal

Replace the boolean `--gemini` switch with an extensible target registry, simplify
installation to a single mirror-copy, and add safe conflict handling — without
breaking the default Codex install path.

## Scope

In scope:

- Template folder migration to mirror layout (Step 1).
- `TARGET_REGISTRY` + helper functions (Step 2).
- Rewrite `init`, `update`, `status` commands (Steps 3–5).
- CLI option changes: `--target` replaces `--gemini` (Step 6).
- Marker file `.agents/.kit-target` for detection.
- Docs update: README, ARCHITECTURE (Step 7).

Out of scope:

- Claude Code target.
- `.gitignore` modification.
- Automated test suites.

## Risk Classification

Risk flags:

- Public contracts: CLI option surface changes (`--gemini` → `--target`).
- Existing behavior: init/update/status logic rewritten.
- Data loss: `init` deletes `.agents/` and old root instruction files.

Hard gates:

- Data deletion risk (destructive init/switch). Mitigated by confirmation prompts
  and `--force` gating; never delete user files without confirm or `--force`.

## Work Phases

1. Discovery — done (repo structure verified, decisions D1–D9 locked).
2. Design — done (SPEC.md approved by human).
3. Validation planning — manual validation ladder (see validation.md).
4. Implementation — Steps 1–7 in SPEC.md, in order.
5. Verification — `node --check`, CLI help output, dry-run install/switch/update.
6. Harness update — record trace, update story proof matrix, decision record.

## Stop Conditions

Pause for human confirmation if:

- A migration step would delete a file not listed in the SPEC migration table.
- Detection logic cannot reliably distinguish CLI-installed vs hand-written root files.
- Validation requirements need weakening.
- Architecture direction changes from the approved registry pattern.
