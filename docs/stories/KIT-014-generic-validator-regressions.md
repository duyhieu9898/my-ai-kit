# KIT-014 Generic Validator Regressions

## Status

implemented

## Lane

normal

## Product Contract

The bundled Codex and Gemini validators support common Next.js App Router
patterns without hiding actionable type, SEO, accessibility, or stylesheet
findings, and both targets retain identical configuration behavior.

## Relevant Product Docs

- `docs/product/toolkits.md`
- `templates/codex/.agents/skills/frontend-design/scripts/`
- `templates/codex/.agents/skills/lint-and-validate/scripts/type_coverage.py`
- `templates/codex/.agents/skills/seo-fundamentals/scripts/seo_checker.py`
- Equivalent Gemini template paths.

## Acceptance Criteria

- Type coverage counts zero-argument page/layout functions and does not exclude
  projects merely because a parent directory name contains `build` or another
  ignored substring.
- UX audit loads configuration from the target project and scans CSS/SCSS with
  style-specific checks.
- Accessibility checks non-interactive native elements individually while
  allowing buttons and anchors with `href`.
- SEO checks static Next.js metadata fields and reports dynamic metadata as
  requiring runtime verification.
- Monolingual projects keep hardcoded-string findings non-blocking.
- Codex and Gemini behavior and default UX configuration remain aligned.
- Focused regression tests and template consistency checks pass.

## Design Notes

- Commands: `python3 scripts/test-validator-regressions.py`,
  `npm run check:templates`.
- Domain rules: regex validators remain advisory where runtime framework output
  cannot be proven statically.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Temporary fixtures cover each corrected heuristic for both targets. |
| Integration | Both shipped target copies run through the same regression suite. |
| E2E | Not required. |
| Platform | Template consistency, Python compilation, and package dry-run pass. |
| Release | Not required. |

## Harness Delta

Adds direct executable regression coverage for shared validator behavior and a
template check for UX configuration parity.

## Evidence

- `python3 scripts/test-validator-regressions.py` passed seven regression tests
  against both Codex and Gemini validator copies.
- `scripts/bin/harness-cli story verify KIT-014` passed the configured
  regression and template checks.
- `npm run check:templates` passed 322 consistency checks, including UX config
  existence and parity.
- `npm pack --dry-run --json` included both UX configuration files and changed
  validator assets among 501 package entries, with no Python cache artifacts.
- `git diff --check` passed.
