# Design

> Full design: `docs/specs/multi-target-registry/SPEC.md`

## Domain Model

- **Target**: named AI tool config (`codex`, `gemini`). Fields: displayName,
  bannerColor, tagLine, description, templateDir.
- **TARGET_REGISTRY**: `Record<string, TargetConfig>` keyed by target name.
- **Root Instruction File**: top-level file in a template (not in `.agents/`),
  e.g. `AGENTS.md`, `GEMINI.md`.
- **Marker**: `.agents/.kit-target` file whose content is the installed target name.

## Application Flow

- `init` — resolve target (default codex) → detect installed → classify scenario
  (none / same / switch / collision) → confirm or `--force` → cleanup old + mirror
  copy → write marker (shipped in template).
- `update` — resolve target (auto-detect via marker if absent) → mismatch check →
  mirror copy with `overwriteRootInstruction: false`.
- `status` — read marker → display target or "no target installed".

## Interface Contract

CLI options:

- `init [-t|--target <name>] [-f|--force] [-p|--path <dir>] [-b|--branch <name>]`
- `update [-t|--target <name>] [-f|--force] [-p|--path <dir>] [-b|--branch <name>]`
- `status [-p|--path <dir>]`
- Deprecated `--gemini` → warning + maps to `--target gemini`.

Errors: unknown target (exit 1, lists valid), template missing (exit 1), network
failure (exit 1 + temp cleanup), update no-install (exit 1), update mismatch
(exit 1 + suggest `init --target`), user decline (exit 0).

## Data Model

No database. Filesystem only:

- `templates/<target>/` mirror trees (source).
- `.agents/.kit-target` marker (installed state).
- Migration moves listed in SPEC Step 1 (destructive on `templates/`, one-time).

## UI / Platform Impact

CLI only. Terminal output: dynamic banner, conflict summaries, deletion logs,
success summary. No browser/mobile/desktop impact.

## Observability

Terminal logging only — deleted files logged on switch, success summary lists
installed paths. No persistent logs/metrics.

## Alternatives Considered

1. Manifest-based root instruction detection — rejected in favor of convention +
   marker (zero config per target).
2. Keep `--gemini` and add `--claude` etc. — rejected, does not scale.
3. Guess installed target by folder shape — rejected, ambiguous against
   hand-written root files; marker chosen instead.
