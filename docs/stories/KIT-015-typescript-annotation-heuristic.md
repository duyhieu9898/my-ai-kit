# KIT-015 TypeScript Annotation Heuristic

## Status

implemented

## Lane

normal

## Product Contract

The bundled TypeScript checker reports an advisory annotation heuristic rather
than presenting regex-based return-type detection as proof of type safety.

## Relevant Product Docs

- `docs/product/toolkits.md`
- `templates/codex/.agents/skills/lint-and-validate/SKILL.md`
- `templates/gemini/.agents/skills/lint-and-validate/SKILL.md`

## Acceptance Criteria

- Next.js and React components using compiler-inferred JSX return types are not
  treated as unsafe or critically untyped.
- `React.FC`, callable variable annotations, generic arrow functions, and
  explicit arrow-function return types count as contextual or explicit
  annotation coverage.
- Low annotation coverage is advisory; unsafe `any` usage remains a separate
  critical signal at the existing threshold.
- Output and skill documentation state that the script is an annotation
  heuristic and not a substitute for `tsc`.
- Codex and Gemini implementations remain identical.
- Focused regression and template consistency checks pass.

## Design Notes

- Commands: `python3 scripts/test-validator-regressions.py`,
  `npm run check:templates`.
- Domain rule: TypeScript compiler inference is valid type information and
  cannot be classified as unsafe solely because a return annotation is absent.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Fixtures cover inferred components, `React.FC`, callable types, generics, and low annotation coverage. |
| Integration | Both shipped target copies run through the same suite. |
| E2E | Not required. |
| Platform | Template consistency and package checks pass. |
| Release | Not required. |

## Harness Delta

Extends the shared validator regression suite with real-world TypeScript and
React annotation patterns.

## Evidence

- `python3 scripts/test-validator-regressions.py` passed ten tests against both
  shipped target copies, including inferred React components, `React.FC`,
  callable variable types, generic arrows, advisory low coverage, and critical
  unsafe `any` usage.
- `scripts/bin/harness-cli story verify KIT-015` passed the configured
  regression suite and 322 template consistency checks.
- A real-world-style fixture reported 75% explicit/contextual annotation
  coverage as advisory and exited successfully.
- `npm pack --dry-run --json` included both checker copies among 501 package
  entries with no Python cache artifacts.
- `git diff --check` passed.
