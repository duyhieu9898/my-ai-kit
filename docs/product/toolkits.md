# Toolkit Contract

## Codex

- Source: `templates/codex/`.
- Runtime destination: `.agents/`.
- Repository instruction: `templates/codex/AGENTS.md` to root `AGENTS.md`.
- Lifecycle integration: `templates/codex/.codex/` merges into root `.codex/`.
  Preserve unrelated project config and custom hooks while updating the
  kit-managed Harness guard.
- Hook policy: generated from `shared/hooks/harness_guard.py`; the Codex
  adapter maps native lifecycle payloads and warning output.
- Nested instruction: `templates/codex/.agents/AGENTS.md` to
  `.agents/AGENTS.md`.
- Skills use `SKILL.md`, required `agents/openai.yaml`, optional `references/`,
  `scripts/`, and `assets/`.
- The current template ships 49 skill directories and four top-level runtime
  scripts.

## Gemini Antigravity

- Source: `templates/gemini/`.
- Runtime destination: `.agents/`.
- Repository instruction: `templates/gemini/GEMINI.md` to root `GEMINI.md`.
- Lifecycle integration: `templates/gemini/.agents/hooks.json` and
  `.agents/hooks/` install warning-only Antigravity guards. Preserve unrelated
  hook entries and scripts while updating the kit-managed entry.
- Hook policy: generated from `shared/hooks/harness_guard.py`; the Gemini
  adapter maps Antigravity payloads and returns an allow decision with warning
  context. Context-read warnings run at `PreToolUse` because Antigravity's
  `PostToolUse` payload does not include tool arguments.
- Preserve its agents, skills, workflows, scripts, and shared assets.
- The current template ships 15 agent files, 33 skill directories, 11 workflow
  files, and four top-level runtime scripts.

## Shared Rules

- Preserve relative paths within each toolkit.
- All executable scripts present in both targets and `.shared` resources have their canonical source under `shared/runtime/`.
  Both target templates retain committed generated copies so installation
  remains a direct mirror-copy with no composition step.
- Shared lifecycle policy and target adapters have canonical sources under
  `shared/hooks/` and committed generated copies in each target template.
- Canonical source and sync tooling are development-only; npm installation
  ships the generated target templates without extra shared-source payload.
- Use `npm run sync:shared-runtime` after editing canonical files and
  `npm run check:shared-runtime` to detect drift.
- Use `npm run sync:shared-hooks`, `npm run check:shared-hooks`, and
  `npm run test:hooks` after editing lifecycle guards.
- Do not package credentials, logs, caches, or runtime databases.
- Update toolkit architecture documentation when discovery or directory
  conventions change.
- Validate the narrowest affected skill or script before broad verification.
  For skill frontmatter and naming compatibility, run `skills-ref validate` on
  affected skill directories, then apply `CODEX_SKILL_STANDARD.md` or
  `ANTIGRAVITY_SKILL_STANDARD.md` for target-specific quality and conversion
  rules.
