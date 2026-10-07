<!-- KIT:BEGIN -->
# AGENTS.md - Workspace Rules

- Skills live in `.agents/skills/`. Prefer their bundled scripts, and read
  only the references the task needs.
- Keep changes scoped: no speculative abstractions or unrelated cleanup;
  update affected callers, tests, and contracts in the same task.
- Proceed when intent is clear, including `continue`, `fix it`, or
  `sửa toàn bộ`. State a short plan first for broad or risky work. Ask
  before destructive, credential-related, or security-sensitive actions.
- Reply in the user's language; keep identifiers and code comments in English
  unless the project uses another convention.
- Verify with the narrowest project-native check and report what ran. Toolkit
  check: `python3 .agents/scripts/checklist.py .`. When changing `.agents/`,
  read `.agents/ARCHITECTURE.md` first.
<!-- KIT:END -->
