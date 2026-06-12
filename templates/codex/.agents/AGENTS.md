# Shared Agent Toolkit

These instructions apply when modifying files under `.agents/`. Repository-wide workflow rules remain in the root `AGENTS.md`.

## Source Of Truth

- Treat `.agents/` as an installed runtime copy.
- When `templates/.codex/` exists, make durable toolkit changes there first and then refresh `.agents/`.
- Modify only `.agents/` when the user explicitly requests a project-local customization.
- Update the source `ARCHITECTURE.md` when toolkit structure or discovery behavior changes.

## Toolkit Maintenance

- Preserve each skill's `SKILL.md` metadata and directory conventions.
- Keep domain procedures in the relevant skill instead of duplicating them here.
- Read only the references needed for the toolkit change.
- Prefer updating an existing skill or shared resource over creating overlapping guidance.
- Keep relative links and script paths valid.
- Do not add credentials, session data, personal memory, generated reports, caches, or other runtime artifacts.
- Preserve managed memory templates and directory structure when they are part of the toolkit source.

## Verification

- Validate changed Python scripts with `python3 -m py_compile <files>`.
- Validate changed JSON and YAML with an available structured parser.
- Check `SKILL.md` frontmatter, directory-name alignment, Markdown references, and executable paths.
- Run the narrowest relevant toolkit script before broader verification.
