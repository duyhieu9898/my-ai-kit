# 0015 Single Skill Source and Manifest-Based Installer

Date: 2026-09-29

## Status

Accepted. Supersedes the per-runtime skill folders of ADR 0008. Extends the
ownership table of ADR 0014.

## Context

Codex and Gemini skills were maintained as two diverged copies, skill scripts
existed three times, Claude Code discovered no skills, and `update` replaced
`.agents/skills/` wholesale, deleting project-owned skills.

## Decision

- `templates/.agents/skills/` is the only skill source. Codex and Antigravity
  read `.agents/skills/`; Claude Code reads relative symlinks in
  `.claude/skills/`.
- `templates/kit.json` holds `formatVersion` and named profiles.
- `.ai-kit.json` records source, selection, and `managedSkills` with content
  hashes. Only managed skills are updated or removed; locally modified managed
  skills are skipped unless `--force`.
- `--source <dir> --link` symlinks project skills to a local checkout for
  development; GitHub by ref remains the release channel.

| Component / Path | Owner | Install / Update Rule |
| --- | --- | --- |
| `.agents/skills/<name>` listed in `managedSkills` | Kit | Replaced per skill; skipped when locally modified. |
| `.agents/skills/<name>` not listed | Project | Never modified or removed. |
| `.claude/skills/<name>` symlink into `.agents/skills/` | Kit | Created and removed with the managed skill. |
| Other `.claude/skills/` entries | Project | Never modified. |

## Consequences

Positive: one edit per skill, all three tools discover skills natively,
selective installs, safe updates.

Tradeoffs: symlinks are required (no Windows support); legacy installs have no
recorded hashes, so edits made before migration are overwritten by the first
`update`.
