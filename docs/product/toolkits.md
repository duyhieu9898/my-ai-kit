# Toolkit Contract

## Codex

- Source: `templates/.codex/`.
- Runtime destination: `.agents/`.
- Repository instruction: `templates/root/AGENTS.md` to root `AGENTS.md`.
- Nested instruction: `templates/.codex/AGENTS.md` to `.agents/AGENTS.md`.
- Skills use `SKILL.md`, optional `agents/openai.yaml`, `references/`,
  `scripts/`, and `assets/`.

## Gemini Antigravity

- Source: `templates/.antigravity/`.
- Runtime destination: `.agents/`.
- Repository instruction:
  `templates/.antigravity/rules/GEMINI.md` to root `GEMINI.md`.
- Preserve its agents, skills, workflows, rules, scripts, and shared assets.

## Shared Rules

- Preserve relative paths within each toolkit.
- Do not package credentials, logs, caches, runtime databases, or local memory.
- Update toolkit architecture documentation when discovery or directory
  conventions change.
- Validate the narrowest affected skill or script before broad verification.
