# CLI Contract

## Commands

### `install` (alias `init`)

- Install skills (all by default, or a named profile, or individual skills)
  plus the hooks, root instruction, and files of each selected agent, as
  declared in `templates/agents/<agent>.json`, and the files in
  `templates/agents/shared.json`.
- `--agent <names>` (comma-separated: `claude`, `codex`, `gemini`) adds agents
  to `selection.agents`. A first install without it selects `claude,codex`;
  a later install without it keeps the stored agents.
- Write and maintain `.ai-kit.json` (source, selection, and `managedSkills`
  and `managedFiles` with content hashes).
- Merge a kit-owned `KIT` block into each root instruction file; the rest of
  the file is left untouched.
- A project-owned skill directory whose name collides with a selected kit
  skill and differs from the kit's copy aborts the whole run before anything
  is written; `--force` lets the kit take it over. One that is already
  byte-identical is adopted as managed.
- `install --profile P` keeps earlier explicit excludes for skills in `P`;
  re-add such a skill by name (`install <skill>`).
- Every skill installs into `.agents/skills/`. A skill listed in an agent's
  `exclusiveSkills` installs only while that agent is selected; naming one
  without its agent fails with the `--agent` to add. Its record stores
  `agents`, and Claude links only skills not exclusive to other agents.
- A manifest without `selection.agents` (4.x and pre-release 5.0) gets every
  agent; on that run, existing files the kit installs count as kit-owned even
  without a recorded hash, and pre-4.0 `.agents/gemini/{skills,agents,workflows}`
  are deleted.
- A manifest that still records `managedGeminiSkills` (pre-release builds that
  used `.agent/skills/`) gets those skills in `.agents/skills/`; the run deletes
  the kit's unmodified copies under `.agent/skills/` and warns about modified
  ones.
- Names stored in the selection that no longer exist in the kit are dropped
  with a warning; names passed on the command line must exist.
- Support `--path`, `--ref`, `--source`, `--link` (requires `--source`),
  `--dry-run`, `--force`, `--profile <names>` / `--all`, and `--agent <names>`.

### `remove [skills...] [--profile <names>] [--agent <names>]`

- Remove the named skills from the manifest selection and from the project
  (including their `.claude/skills/<name>` symlink). A skill name is accepted
  when it exists in the kit, in the selection, or in `managedSkills`, so a
  skill deleted upstream can still be removed.
- `--profile <names>` (comma-separated) drops profiles from the selection; a
  name that is neither selected nor in the kit fails.
- `--agent <names>` drops agents: their `KIT` block and kit hook entries are
  stripped (a file left empty is deleted), their unmodified kit files and
  skill links are deleted, and skills exclusive to them are removed. Skills
  named explicitly stay in the selection and return with the agent. Removing
  the last agent fails. Pass at least one of skills, `--profile`, or `--agent`.
- Support the same `--path`, `--ref`, `--source`, `--link`, `--dry-run`, and
  `--force` options as `install`.

### `update`

- Refresh kit-managed skills, hooks, and settings for the selected agents.
- Skip a managed skill that was modified locally unless `--force` is
  supplied; never touch a skill that is not in `managedSkills`.
- Update the files of the selected agents that still match their
  `managedFiles` hash; keep a locally modified one unless `--force`. Delete
  an unmodified kit file no selected agent wants any more; keep a modified one
  with a warning.
- Drop skills and profiles that no longer exist in the kit from the selection
  with a warning, and remove their managed copies (a locally modified copy is
  kept).
- Refresh the `KIT` block in each root instruction file; never overwrite the
  rest of the file, even with `--force`.
- Support `--path`, `--ref`, `--source`, `--link`, `--dry-run`, and `--force`.

### `list`

- List the agents, the skills available in the resolved template source (marking
  agent-exclusive ones), and the profiles declared in `templates/kit.json`.
- Support `--path`, `--ref`, and `--source`.

### `status`

- Report installation state from `.ai-kit.json` only (no network access):
  selected agents and skills, modified or missing managed skills, broken
  Claude symlinks (when Claude is selected), and project-owned skills.
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
- Resolve every template path from `templates/agents/*.json`, independently
  from the skill source installed into `.agents/skills/`.
