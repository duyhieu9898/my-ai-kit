# CLI Contract

## Commands

### `init`

- Install Codex by default.
- Install Gemini Antigravity when `--target gemini` is supplied.
- Keep deprecated `--gemini` as a compatibility alias for `--target gemini`.
- Install the selected toolkit into `.agents/`.
- Install the target-specific root instruction outside `.agents/`.
- Require confirmation before replacing an existing `.agents/` unless
  `--force` is supplied.
- Support `--path`, `--target`, and `--ref`.
- Support deprecated `--branch`, with `--ref` taking precedence when both are
  supplied.

### `update`

- Require an existing `.agents/` installation.
- Refresh the toolkit identified by `.agents/.kit-target`.
- Preserve an existing root instruction, including local or Harness blocks.
- Support `--target <name>` only when it matches the installed marker.
- Support `--ref` for pinned updates.

### `status`

- Detect the active `.agents/` installation.
- Distinguish Codex from Gemini Antigravity by `.agents/.kit-target`.
- Report obsolete `.codex/` or `.agent/` directories.

## Distribution

- Publish `bin/` and `templates/` in the npm package.
- Keep `bin/index.js` executable.
- Resolve root instruction paths from `templates/`, independently from the
  toolkit source copied into `.agents/`.
