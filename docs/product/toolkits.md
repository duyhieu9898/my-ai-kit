# Toolkit Contract

## Codex

- Source: `templates/`.
- Runtime destination: `.agents/`.
- Repository instruction: `templates/AGENTS.md` to root `AGENTS.md`.
- Lifecycle integration: `templates/.codex/` merges into root `.codex/`.
  Preserve unrelated project config and custom hooks while updating the
  kit-managed Harness guard.
- Hook policy: generated from `shared/hooks/harness_guard.py`; the Codex
  adapter maps native lifecycle payloads and warning output.
- Nested instruction: `templates/.agents/AGENTS.md` to
  `.agents/AGENTS.md`.
- Skills use `SKILL.md`, required `agents/openai.yaml`, optional `references/`,
  `scripts/`, and `assets/`.
- The current template ships 43 skill directories and four top-level runtime
  scripts.

## Gemini Antigravity

- Source: `templates/`.
- Runtime destination: `.agents/`.
- Repository instruction: `templates/GEMINI.md` to root `GEMINI.md`.
- Lifecycle integration: `templates/.agents/hooks.json` and
  `.agents/hooks/` install warning-only Antigravity guards. Preserve unrelated
  hook entries and scripts while updating the kit-managed entry.
- Hook policy: generated from `shared/hooks/harness_guard.py`; the Gemini
  adapter maps Antigravity payloads and returns an allow decision with warning
  context. Context-read warnings run at `PreToolUse` because Antigravity's
  `PostToolUse` payload does not include tool arguments.
- Preserve its agents, skills, workflows, scripts, and shared assets.
- The current template ships 15 agent files, 29 skill directories, 10 workflow
  files, and four top-level runtime scripts.

## Claude Code

- Source: `templates/`.
- Runtime destination: `.agents/`.
- Repository instruction: `templates/CLAUDE.md` to root `CLAUDE.md`.
- Lifecycle integration: `templates/.claude/settings.json` merges into root
  `.claude/settings.json`. Preserve unrelated Claude settings and custom hooks
  while updating hook groups that call the kit-managed Claude adapter.
- Hook policy: generated from `shared/hooks/harness_guard.py`; the Claude
  adapter maps Claude Code hook payloads and injects warning context without
  blocking tool calls.
- Claude reuses the shared `.agents/skills/` instructions. The kit does not
  duplicate the full skill tree under `.claude/skills/`.
- The current template ships Claude hook files under `.agents/claude/hooks/`.

## Shared Rules

- Preserve relative paths within each toolkit.
- All executable scripts present in the runtimes and `.shared` resources have
  their canonical source under `shared/runtime/`. Generated templates retain
  committed generated copies so installation
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
  `ANTIGRAVITY_SKILL_STANDARD.md` for tool-specific quality and conversion
  rules.

## External Backlog MCP

- `backlog-mcp/` is a workstation-local runtime, not part of any installed
  toolkit and not part of the npm package.
- Claude Code, Codex, Gemini, and other MCP clients start the same server over
  stdio from a stable absolute checkout path.
- Claude Code registration uses user scope and passes the active workspace in
  `CLAUDE_PROJECT_DIR`; the MCP uses that path for project resolution.
- Credentials, configuration, catalogs, logs, and sessions stay under
  `backlog-mcp/` and must not be copied into target templates.
