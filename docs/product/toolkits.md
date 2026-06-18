# Toolkit Contract

## Codex

- Source: `templates/codex/`.
- Runtime destination: `.agents/`.
- Repository instruction: `templates/codex/AGENTS.md` to root `AGENTS.md`.
- Nested instruction: `templates/codex/.agents/AGENTS.md` to
  `.agents/AGENTS.md`.
- Skills use `SKILL.md`, required `agents/openai.yaml`, optional `references/`,
  `scripts/`, and `assets/`.
- The current template ships 50 skill directories and four top-level runtime
  scripts.

## Gemini Antigravity

- Source: `templates/gemini/`.
- Runtime destination: `.agents/`.
- Repository instruction: `templates/gemini/GEMINI.md` to root `GEMINI.md`.
- Preserve its agents, skills, workflows, scripts, and shared assets.
- The current template ships 15 agent files, 34 skill directories, 11 workflow
  files, and four top-level runtime scripts.


## Shared Rules

- Preserve relative paths within each toolkit.
- All executable scripts present in both targets, plus shared Backlog runtime,
  have their canonical source under `shared/runtime/`. Both target templates
  retain committed generated copies so installation remains a direct
  mirror-copy with no composition step.
- Canonical source and sync tooling are development-only; npm installation
  ships the generated target templates without extra shared-source payload.
- Use `npm run sync:shared-runtime` after editing canonical files and
  `npm run check:shared-runtime` to detect drift.
- Backlog target metadata and runtime artifacts are not shared: keep
  `SKILL.md`, Codex `agents/openai.yaml`, `.env`, and `logs/` in their target
  trees.
- Do not package credentials, logs, caches, or runtime databases.
- Update toolkit architecture documentation when discovery or directory
  conventions change.
- Validate the narrowest affected skill or script before broad verification.
