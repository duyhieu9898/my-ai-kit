# KIT-007 Scoped Clean Code Guidance

## Status

implemented

## Lane

normal

## Product Contract

The `clean-code` skill must guide scoped implementation quality without owning
validation workflow, imposing universal complexity quotas, or triggering for
planning and documentation-only work.

## Relevant Product Docs

- `docs/HARNESS.md`
- `docs/FEATURE_INTAKE.md`
- `docs/TEST_MATRIX.md`
- `templates/root/AGENTS.md`

## Acceptance Criteria

- Repository conventions and existing module boundaries precede generic advice.
- Function length, parameter count, and nesting are heuristics rather than limits.
- Unrelated cleanup and speculative abstractions are explicitly discouraged.
- Validation selection and reporting are delegated to `verify-changes`.
- Codex, Antigravity, and the installed runtime share the same skill contract.
- Planning, product, documentation, discovery, and orchestration agents do not
  force-load `clean-code`.
- Both skill variants use standard frontmatter.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Frontmatter and skill structure validation |
| Integration | Cross-template and agent-routing assertions |
| E2E | Not applicable |
| Platform | Antigravity global rule alignment |
| Release | Package contents include updated skills and agent definitions |

## Harness Delta

Separates implementation-quality guidance from validation policy and reduces
unnecessary skill context for non-implementation agents.

## Evidence

- Standard skill validator passes for both toolkit variants.
- Source assertions confirm scoped heuristics, validation handoff, and routing.
- npm package dry-run contains all changed template files.
