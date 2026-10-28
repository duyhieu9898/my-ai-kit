# Toolkit Contract

Each agent's install is declared in `templates/agents/<agent>.json`; files every
install gets are in `templates/agents/shared.json`. A project installs only the
agents in `selection.agents` (`install --agent`, default `claude,codex`).

## Codex

- Config: `templates/agents/codex.json`.
- Repository instruction: `templates/instructions/AGENTS.md` merges its `KIT`
  block into root `AGENTS.md`.
- Lifecycle integration: `templates/hooks/codex.json` merges into
  `.codex/hooks.json`, and the guard and adapter install to `.codex/hooks/`.
  Preserve unrelated project config and custom hooks while updating the
  kit-managed Harness guard.
- Hook policy: generated from `shared/hooks/harness_guard.py`; the Codex
  adapter maps native lifecycle payloads and warning output.
- Skills: Codex reads `.agents/skills/` directly. Skills use `SKILL.md`,
  required `agents/openai.yaml`, optional `references/`, `scripts/`, and
  `assets/`.
- The current template ships 14 skill directories for every agent and four
  top-level runtime scripts. In projects that also select Gemini, Codex sees
  the Gemini-only skills too, because they share `.agents/skills/`.

## Gemini Antigravity

- Config: `templates/agents/gemini.json`.
- Repository instruction: `templates/instructions/GEMINI.md` merges its `KIT`
  block into root `GEMINI.md`.
- Lifecycle integration: `templates/hooks/gemini.json` merges into
  `.agents/hooks.json`, and the guard and adapter install to
  `.agents/gemini/hooks/`. Preserve unrelated hook entries while updating the
  kit-managed entry.
- Hook policy: generated from `shared/hooks/harness_guard.py`; the Gemini
  adapter maps Antigravity payloads and returns an allow decision with warning
  context. Context-read warnings run at `PreToolUse` because Antigravity's
  `PostToolUse` payload does not include tool arguments.
- Skills: Antigravity reads `.agents/skills/` (it still reads the legacy
  `.agent/skills/`, which the kit no longer writes). The config's
  `exclusiveSkills` lists the 9 Gemini-only
  skill directories, which install only when the project selects Gemini; they
  cover work Claude Code and Codex already handle natively.
- Rules: `templates/rules/` installs to `.agents/rules/`, which Antigravity
  loads in every session. It ships `testing-workflow.md`. Project-owned rule
  files are left alone.

## Claude Code

- Config: `templates/agents/claude.json`.
- Repository instruction: `templates/instructions/CLAUDE.md` merges its `KIT`
  block into root `CLAUDE.md`.
- Lifecycle integration: `templates/hooks/claude.json` merges into
  `.claude/settings.json`, and the guard and adapter install to
  `.agents/claude/hooks/`. Preserve unrelated Claude settings and custom hooks
  while updating hook groups that call the kit-managed Claude adapter.
- Hook policy: generated from `shared/hooks/harness_guard.py`; the Claude
  adapter maps Claude Code hook payloads and injects warning context without
  blocking tool calls.
- Skills: each installed skill that is not exclusive to another agent is
  exposed as `.claude/skills/<name>`, a relative symlink to
  `../../.agents/skills/<name>`.

## Shared Rules

- Every template file exists once. Skills live in `templates/skills/<name>/`,
  with their scripts inside; there is no generated copy.
- Every file an agent config lists is hash-managed: `update` keeps a locally
  modified file unless `--force`, and deletes an unmodified kit file once no
  selected agent wants it.
- Removing an agent strips its `KIT` block and kit hook entries, deleting the
  file only when nothing else is left in it.
- Shared lifecycle policy and target adapters have canonical sources under
  `shared/hooks/`, synced once into `templates/hooks/`.
- Canonical source and sync tooling are development-only; npm installation
  ships the generated target templates without extra shared-source payload.
- Use `npm run sync:shared-hooks`, `npm run check:shared-hooks`, and
  `npm run test:hooks` after editing lifecycle guards.
- Do not package credentials, logs, caches, or runtime databases.
- Update toolkit architecture documentation when discovery or directory
  conventions change.
- Validate the narrowest affected skill or script before broad verification.
  For skill frontmatter and naming compatibility, run `skills-ref validate` on
  affected skill directories, then apply `docs/skills/SKILL_STANDARD.md` and
  `docs/skills/DESCRIPTION_GUIDE.md`.

## External Backlog MCP

- `../hieund-backlog-mcp/` is a workstation-local runtime (sibling project,
  not inside this repo), not part of any installed toolkit and not part of
  the npm package.
- Claude Code, Codex, Gemini, and other MCP clients start the same server over
  stdio from a stable absolute checkout path.
- Claude Code registration uses user scope and passes the active workspace in
  `CLAUDE_PROJECT_DIR`; the MCP uses that path for project resolution.
- Credentials, configuration, catalogs, logs, and sessions stay under
  `../hieund-backlog-mcp/` and must not be copied into target templates.
