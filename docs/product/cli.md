# CLI Contract

## Commands

### `init`

- Install Codex by default.
- Install Gemini Antigravity when `--gemini` is supplied.
- Install the selected toolkit into `.agents/`.
- Install the mode-specific root instruction outside `.agents/`.
- Require confirmation before replacing an existing `.agents/` unless
  `--force` is supplied.
- Support `--path` and `--branch`.

### `update`

- Require an existing `.agents/` installation.
- Refresh the selected toolkit.
- Preserve an existing root instruction, including local or Harness blocks.
- Support Codex and Gemini modes.

### `status`

- Detect the active `.agents/` installation.
- Distinguish Codex from Gemini Antigravity by installed structure.
- Report obsolete `.codex/` or `.agent/` directories.

## Distribution

- Publish `bin/` and `templates/` in the npm package.
- Keep `bin/index.js` executable.
- Resolve root instruction paths from `templates/`, independently from the
  toolkit source copied into `.agents/`.
