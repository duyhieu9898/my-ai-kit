---
name: clean-code
description: >-
  Keeps code changes scoped, readable, and consistent with the repository,
  including when to simplify existing code and when to leave it alone. Use
  when writing, editing, or refactoring code. Not for choosing checks or tests
  (use verify-changes).
---

# Clean Code

Improve readability and maintainability without expanding the requested scope.

## Authority

Apply guidance in this order:

1. Repository instructions and established local conventions.
2. Existing module boundaries, public contracts, and neighboring patterns.
3. This skill's heuristics.

Do not perform unrelated cleanup. A better design that changes extra behavior,
files, or contracts is not a scoped implementation.

## Workflow

### 1. Understand The Change

- Identify the requested behavior and the smallest affected surface.
- Inspect callers, imports, tests, interfaces, and nearby implementations.
- Preserve unrelated user changes and existing compatible patterns.

### 2. Implement Simply

- Prefer direct code over speculative layers or configuration.
- Add an abstraction when it removes meaningful duplication, isolates a real
  concept, or matches an established repository pattern.
- Keep related behavior together. Split code when responsibilities or change
  reasons are genuinely independent.
- Use guard clauses when they clarify control flow, not as a mechanical rule.
- Avoid hidden global mutation and surprising input mutation.

### 3. Name And Explain

- Choose names that communicate domain intent at the point of use.
- Follow the language and repository naming conventions.
- Use comments for non-obvious constraints, tradeoffs, or external behavior.
- Do not narrate syntax or duplicate what the code already states.
- Replace unexplained literals with named values when the name adds meaning.

### 4. Control Scope

- Update dependent files required by a changed signature or contract.
- Do not rename, reformat, or reorganize unrelated code.
- Do not introduce utilities, factories, wrappers, or base classes for a
  single hypothetical reuse case.
- Leave existing complexity alone when changing it is unnecessary or risky.

### 5. Hand Off Verification

`clean-code` governs implementation quality, not test selection or result
reporting. Use repository instructions, Harness proof requirements, and
`verify-changes` to choose proportional executable evidence.

## Heuristics, Not Quotas

Function length, parameter count, nesting depth, and file size are review
signals. They are not universal pass/fail limits.

Refactor when structure obscures intent, mixes responsibilities, duplicates
meaningful logic, or makes changes unsafe. Keep cohesive code together when
splitting it would add indirection without improving understanding.

## Reducing Existing Complexity

When the task is to simplify code, remove indirection that has no current
reason to exist: a wrapper that only forwards, a configuration option with one
value, a layer that adds no rule of its own. Keep complexity that pays for
itself:

| Keep it when | Why |
|---|---|
| It sits on a measured hot path | The plain version was slower |
| A framework or library requires the shape | External contract |
| The user or repository chose the pattern | Explicit decision |
| An interface exists for tests or injection | Removing it breaks the seam |

If an abstraction looks unjustified but its reason is unclear, ask before
removing it.

## Checklist

- [ ] The change implements only the requested behavior.
- [ ] Local conventions and ownership boundaries are preserved.
- [ ] Callers, imports, tests, and contracts were considered.
- [ ] Names and control flow make the intent clear.
- [ ] Abstractions solve current complexity rather than hypothetical reuse.
- [ ] Comments explain only information the code cannot express clearly.
- [ ] Required dependent changes are included; unrelated cleanup is excluded.
