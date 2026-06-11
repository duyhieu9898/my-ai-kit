# Shared Agent Toolkit

These instructions apply when modifying files under `.agents/`. Repository-wide workflow rules remain in the root `AGENTS.md`.

## Toolkit Maintenance

- Preserve each skill's `SKILL.md` metadata and directory conventions.
- Keep domain procedures in the relevant skill instead of duplicating them here.
- Read only the references needed for the toolkit change.
- Prefer updating an existing skill or shared resource over creating overlapping guidance.
- Keep relative links and script paths valid.
- Update `.agents/ARCHITECTURE.md` when toolkit structure or discovery behavior changes.
- Do not add credentials, local memory, generated reports, caches, or runtime artifacts.

## Verification

- Validate changed Python scripts with `python3 -m py_compile <files>`.
- Check changed Markdown references and executable paths.
- Run the narrowest relevant toolkit script before broader verification.
