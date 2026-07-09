# KIT-016 Reliable Playwright Bootstrap

## Status

implemented

## Lane

normal

## Product Contract

The bundled `verify_all.py` creates an isolated Python environment for
Playwright E2E checks on Debian/Ubuntu-compatible systems and shows actionable
stdout and stderr when any verification check fails.

## Relevant Product Docs

- `docs/product/toolkits.md`
- `templates/.agents/scripts/verify_all.py`
- Equivalent Gemini template path.

## Acceptance Criteria

- Playwright installs into `.agents/.venv` through `uv` when available, with
  the standard-library `venv` module as fallback.
- Bootstrap runs only when a URL-backed E2E check is requested, so imports,
  `--help`, and non-E2E verification do not install dependencies.
- Only the Playwright check uses the isolated interpreter; project validators
  and Python tests retain the caller's original Python environment.
- Missing required validator scripts fail verification instead of producing an
  all-skipped success.
- Bootstrap validates the Playwright import and Chromium executable rather than
  relying on a marker file, and warns when Linux system dependencies are
  missing.
- Failed checks display both stdout and stderr directly, with bounded default
  output and complete output under `--verbose`.
- SEO and accessibility scans ignore `.agents`, `.venv`, and `venv` content.
- Codex and Gemini behavior remains aligned.

## Design Notes

- Commands: `python3 scripts/test-validator-regressions.py`,
  `npm run check:templates`.
- The isolated environment is runtime state and must not be packaged.
- Browser installation uses `python -m playwright` for cross-platform virtual
  environment path handling.
- Linux dependency detection uses Playwright's non-mutating
  `install-deps --dry-run chromium`; privileged installation remains explicit.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Temporary fixtures cover scanner exclusions, required-script failure, interpreter isolation, bootstrap checks, and failed-check output. |
| Integration | Both shipped targets run through the same regression suite. |
| E2E | Bootstrap command construction is covered; a live browser download is not required in repository tests. |
| Platform | Python compilation, template consistency, and package dry-run pass. |
| Release | Not required. |

## Harness Delta

Extends the shared validator regression suite with direct coverage for the
Playwright setup boundary and user-visible failure diagnostics.

## Evidence

- `python3 scripts/test-validator-regressions.py` passed 16 tests against both
  Codex and Gemini, including bootstrap command construction, no-bootstrap
  `--help`, scanner exclusions, required-script failure, interpreter isolation,
  and failed-check stdout/stderr.
- Changed Python files passed `python3 -m py_compile`.
- `npm run check:templates` passed 322 template consistency checks.
- `npm pack --dry-run --json` included all six changed runtime template files
  among 501 package entries and contained no Python cache artifacts.
- Codex/Gemini runtime files remained byte-for-byte aligned and
  `git diff --check` passed.
