# doc-distill status

Development notes. Delete this file before shipping: the skill standard allows
no README or notes inside a skill folder.

## Scope

Built from three needs: track changes between document versions, keep a shared
glossary, and give every rule a permanent ID with a source cell reference.

Deferred until asked: Q&A sheets back to the client, ticket/code/test
traceability, Excel test-spec output, image extraction, redaction before sending
to an external model, a second-pass completeness check, and a `docs/specs/INDEX.md`.

## Tested

On generated files only, with `uv run`:

- `.xlsx`: first sync, unchanged hash, changed row (affected rule found),
  inserted rows (moved refs reported), hidden sheet flagged.
- `check`: bad ref, missing ref, duplicate ID, deleted ID.
- `glossary`: filters rows by terms present in the snapshot.
- `.html` through MarkItDown via `uvx`.

## Open

- [ ] Run `sync` on a real client workbook (方眼紙 layout, many merged cells)
      and judge whether the row-line snapshot is readable and compact.
- [ ] Have Antigravity or Gemini CLI follow SKILL.md end to end: write a spec,
      pass `check`, then process a second version from `diff.md` alone.
- [ ] Try `.docx` and `.pdf`; only `.html` went through MarkItDown so far.
- [ ] Decide whether to capture cell comments; clients often put changes there.
- [ ] Decide whether `sync` should rewrite moved refs itself instead of only
      reporting them.
- [ ] `.xls` loses cell refs (goes through MarkItDown); document "save as .xlsx"
      or convert it first.
- [ ] Ship target: probably `templates/.agent/skills/` (Gemini only), because
      the cheap agent runs the distillation. Add `agents/openai.yaml` if shared.
