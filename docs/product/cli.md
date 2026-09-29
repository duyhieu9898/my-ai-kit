# CLI Contract

## Commands

### `install` (alias `init`)

- Install skills (all by default, or a named profile, or individual skills)
  plus hooks and root instructions for Codex, Gemini Antigravity, and Claude
  Code, side-by-side.
- Write and maintain `.ai-kit.json` (source, selection, `managedSkills` with
  content hashes).
- Merge a kit-owned `KIT` block into each root instruction file; the rest of
  the file is left untouched.
- Skip a colliding skill directory that differs from the kit's copy unless
  `--force`; adopt one that is already byte-identical as managed.
- Support `--path`, `--ref`, `--source`, `--link` (requires `--source`),
  `--dry-run`, and `--profile <names>` / `--all`.

### `remove <skills...>`

- Remove the named skills from the manifest selection and from the project
  (including their `.claude/skills/<name>` symlink).
- Support the same `--path`, `--ref`, `--source`, `--link`, `--dry-run`, and
  `--force` options as `install`.

### `update`

- Refresh kit-managed skills, hooks, and settings for Codex, Gemini
  Antigravity, and Claude Code.
- Skip a managed skill that was modified locally unless `--force` is
  supplied; never touch a skill that is not in `managedSkills`.
- Refresh the `KIT` block in each root instruction file; never overwrite the
  rest of the file, even with `--force`.
- Support `--path`, `--ref`, `--source`, `--link`, `--dry-run`, and `--force`.

### `list`

- List the skills available in the resolved template source and the profiles
  declared in `templates/kit.json`.
- Support `--path`, `--ref`, and `--source`.

### `status`

- Report installation state from `.ai-kit.json` only (no network access):
  selected skills, modified or missing managed skills, broken Claude symlinks,
  and project-owned skills.
- Support `--path`.

## Options

- `--path <dir>`: project directory (default: the current directory).
- `--ref <ref>`: GitHub ref (tag, commit, or branch) to install/update/list
  from.
- `--source <dir>`: use a local kit checkout instead of GitHub.
- `--link`: with `--source`, symlink skills into the checkout instead of
  copying them; rejected without `--source`.
- `--dry-run`: print the plan without changing any files.
- `--force`: take over a colliding project skill directory and overwrite a
  locally modified managed skill; it never overwrites root instructions,
  which are always block-merged.

`repair` and the deprecated `--branch` flag no longer exist; use `install`,
`update`, or `status`, and `--ref` for pinning.

## Distribution

- Publish `bin/`, `lib/`, and `templates/` in the npm package.
- Keep `bin/index.js` executable.
- Resolve root instruction paths from `templates/`, independently from the
  skill source installed into `.agents/skills/`.
