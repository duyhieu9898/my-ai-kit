# doc-distill status

Development notes. Delete this file before shipping: the skill standard allows
no README or notes inside a skill folder.

## Scope

Built from three needs: track changes between document versions, keep a shared
glossary, and give every rule a permanent ID with a source cell reference.

Deferred until asked: Q&A sheets back to the client, ticket/code/test
traceability, Excel test-spec output, image extraction, redaction before sending
to an external model, a second-pass completeness check, and a `docs/specs/INDEX.md`.

## Review fixes (2026-10-15)

A review found 12 problems; all are fixed and covered by tests:

- The baseline moved from the gitignored cache to `docs/specs/<slug>/.distill.json`,
  written only by a passing `check`. Re-syncs and lost caches no longer drop
  pending changes or the deleted-ID guard.
- `check` fails when a rule that was not edited cites rows whose content
  changed (`--accept ID` keeps it), and when `changes.md` has no entry for the
  current version.
- `sync` marks rules affected by rows inserted inside or at the edge of a
  cited range, keeps the column span of moved refs, prints the 8-character
  hash, and puts added sheets' content in `diff.md`.
- Excel reading: read-only mode (no huge grid for far styled cells), number
  formats applied (percent, separators, decimals, currency and unit literals;
  dates as ISO; fractions and scientific fall back to General), empty sheets,
  and sheet names with parentheses or commas in refs.

## Tests

`uv run skills-dev/doc-distill/tests/test_distill.py` runs 19 tests on
generated workbooks (under 20 s). One test converts an `.html` page with
MarkItDown and is skipped without `uvx`. Move the tests next to the repo's
other Python tests (or drop them) before shipping, because a skill folder
should not carry them.

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
- [ ] Not decided: a command that runs the model step through `gemini -p`, so
      the whole flow is one CLI call.
- [ ] Ship target: probably `templates/.agent/skills/` (Gemini only), because
      the cheap agent runs the distillation. Add `agents/openai.yaml` if shared.
