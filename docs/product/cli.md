# CLI Contract

## Commands

### `init`

- Install Codex, Gemini Antigravity, and Claude Code side-by-side.
- Install the shared toolkit into `.agents/`.
- Install tool-specific root instructions outside `.agents/`.
- Require confirmation before replacing an existing `.agents/` unless
  `--force` is supplied.
- Support `--path` and `--ref`.
- Support deprecated `--branch`, with `--ref` taking precedence when both are
  supplied.

### `update`

- Refresh installed runtime files, hooks, and settings.
- Preserve existing root instructions, including local or Harness blocks.
- Support `--ref` for pinned updates.

### `status`

- Detect the active `.agents/` installation and required tool runtimes.
- Report obsolete `.codex/` or `.agent/` directories.

## Distribution

- Publish `bin/` and `templates/` in the npm package.
- Keep `bin/index.js` executable.
- Resolve root instruction paths from `templates/`, independently from the
  toolkit source copied into `.agents/`.
