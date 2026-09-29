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
- A project-owned skill directory whose name collides with a selected kit
  skill and differs from the kit's copy aborts the whole run before anything
  is written; `--force` lets the kit take it over. One that is already
  byte-identical is adopted as managed.
- `install --profile P` keeps earlier explicit excludes for skills in `P`;
  re-add such a skill by name (`install <skill>`).
- Names stored in the selection that no longer exist in the kit are dropped
  with a warning; names passed on the command line must exist.
- Support `--path`, `--ref`, `--source`, `--link` (requires `--source`),
  `--dry-run`, `--force`, and `--profile <names>` / `--all`.

### `remove [skills...] [--profile <names>]`

- Remove the named skills from the manifest selection and from the project
  (including their `.claude/skills/<name>` symlink). A skill name is accepted
  when it exists in the kit, in the selection, or in `managedSkills`, so a
  skill deleted upstream can still be removed.
- `--profile <names>` (comma-separated) drops profiles from the selection; a
  name that is neither selected nor in the kit fails. Pass skills, `--profile`,
  or both.
- Support the same `--path`, `--ref`, `--source`, `--link`, `--dry-run`, and
  `--force` options as `install`.

### `update`

- Refresh kit-managed skills, hooks, and settings for Codex, Gemini
  Antigravity, and Claude Code.
- Skip a managed skill that was modified locally unless `--force` is
  supplied; never touch a skill that is not in `managedSkills`.
- Drop skills and profiles that no longer exist in the kit from the selection
  with a warning, and remove their managed copies (a locally modified copy is
  kept).
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
