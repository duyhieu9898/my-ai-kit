# Toolkit Contract

## Codex

- Source: `templates/codex/`.
- Runtime destination: `.agents/`.
- Repository instruction: `templates/codex/AGENTS.md` to root `AGENTS.md`.
- Nested instruction: `templates/codex/.agents/AGENTS.md` to
  `.agents/AGENTS.md`.
- Skills use `SKILL.md`, required `agents/openai.yaml`, optional `references/`,
  `scripts/`, and `assets/`.
- The current template ships 51 skill directories and four top-level runtime
  scripts.
- The `memory-system` skill is present, but no `.agents/memory/` scaffold is
  currently shipped.

## Gemini Antigravity

- Source: `templates/gemini/`.
- Runtime destination: `.agents/`.
- Repository instruction: `templates/gemini/GEMINI.md` to root `GEMINI.md`.
- Preserve its agents, skills, workflows, scripts, and shared assets.
- The current template ships 15 agent files, 35 skill directories, 14 workflow
  files, and four top-level runtime scripts.
- The `rules/` directory exists as a placeholder in the template and currently
  contains no rule files.

## Shared Rules

- Preserve relative paths within each toolkit.
- Do not package credentials, logs, caches, runtime databases, or local memory.
- Update toolkit architecture documentation when discovery or directory
  conventions change.
- Validate the narrowest affected skill or script before broad verification.
