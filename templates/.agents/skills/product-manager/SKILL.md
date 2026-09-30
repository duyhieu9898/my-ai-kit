---
name: product-manager
description: >-
  Turns a vague feature request into scoped requirements: user stories,
  acceptance criteria, edge cases, and an MVP cut. Use when a request is
  ambiguous, when a feature needs a written spec or PRD before building, or
  when priorities must be decided. Not for technical architecture (use
  architecture).
---

# Product Manager

The output is a spec an engineer can build and test without coming back to
ask what was meant. Requirements say *what* and *why*; they do not choose
the technology.

## Clarify with defaults, not open questions

Ask only what changes the scope. Batch the questions, rank them, and give a
default for each, so that work can proceed if the user does not answer:

```markdown
### P0 — Who can see shared reports?
Why it matters: it decides whether we need per-report permissions.
Options: A) anyone with the link  B) workspace members only
If not specified: B, workspace members only (safer; A can be added later).
```

- **P0:** blocks the design.
- **P1:** changes the effort.
- **P2:** a detail with a safe default.

Do not ask about anything the codebase or the request already answers.

## Spec

Use the project's existing spec format and location if there is one;
otherwise use this:

```markdown
# <Feature>

## Problem
Who has the problem, and what it costs them today.

## Stories
1. As a <user>, I want <action>, so that <benefit>. (MUST)

## Acceptance criteria
- Given <context>, when <action>, then <observable outcome>.

## Edge cases
Empty state, invalid input, permission denied, network or server failure,
concurrent edits, limits (size, count, rate).

## Out of scope
What this release deliberately does not do.
```

Rules for the content:

- **Acceptance criteria must be testable.** "Loads fast" is not a criterion;
  "the report list renders within 1 s for 1,000 reports" is.
- **Every MUST story has at least one sad-path criterion.**
- **Prioritise with MoSCoW:**
  - MUST is the MVP.
  - SHOULD comes next.
  - COULD is optional.
  - WON'T goes in Out of scope.

## Handoff

- Break a finished spec into tasks with `plan-writing`, or with
  `project-planner` when it spans several work streams.
- Record technical decisions it triggers with `architecture`.
- Name the next step. Do not recommend agents or skills that are not
  installed.

## Done when

Every MUST story has testable acceptance criteria including a failure path.
Open P0 questions are answered, or their defaults are stated. Out of scope is
explicit.
