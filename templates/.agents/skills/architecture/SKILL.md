---
name: architecture
description: >-
  Compares architecture options against the project's real constraints and
  records the decision as an ADR in docs/decisions/. Use when choosing
  between approaches with lasting cost, such as a service split, a data
  store, or a sync or async boundary, or when writing an ADR. Not for API
  contract design (use api-patterns).
---

# Architecture

Make a decision the team can live with and leave a record of why. The record
matters as much as the choice: the next person needs to know which
constraints the decision depended on, so they know when it stops being right.

## Defaults

- **ADR location:** use the project's existing decision folder (look for
  `docs/decisions/`, `docs/adr/`, `docs/architecture/decisions/`, or ADRs
  linked from the README). If there is none, use
  `docs/decisions/NNNN-short-title.md`, numbered with the next free
  four-digit number and a kebab-case title.
- **One decision per ADR.** Never rewrite an accepted ADR to change the
  decision; write a new one and mark the old one `Superseded by NNNN`.
- **Harness:** when the project has `scripts/bin/harness-cli`, also register
  the ADR with
  `scripts/bin/harness-cli decision add --id <id> --title <text> --doc docs/decisions/<file>.md`.
- **Bias:** prefer the option that is simplest to operate today and cheapest
  to reverse, unless a stated constraint rules it out.

## Procedure

1. **Establish context from evidence.** Read the code, current dependencies,
   deployment setup, and existing ADRs before proposing anything. Take
   scale, team size, deadlines, and compliance from the request or the repo;
   ask only for a constraint that would change the answer, and otherwise
   state it as an assumption.
2. **Frame the decision** in one sentence: what must be decided, and what
   happens if nothing is decided.
3. **List two or three real options,** including the simplest one (often
   "keep the current approach"). An option nobody would pick is padding.
4. **Compare against the constraints,** not against a generic pros and cons
   list: operational cost, reversibility, effect on existing code, what the
   team already runs, and failure modes. For a structural pattern, read
   `references/pattern-selection.md` for the conditions under which each
   pattern pays off.
5. **Decide and write the ADR** with the template below. Name what is being
   given up and the trigger that should make someone revisit it.
6. **Hand off** implementation work to `plan-writing` (or `project-planner`
   when it spans several work streams). Schema detail goes to
   `database-design`, API contracts to `api-patterns`.

## ADR template

```markdown
# NNNN. <Decision title>

Status: Proposed | Accepted | Superseded by NNNN
Date: YYYY-MM-DD

## Context
The problem, the constraints that matter, and what forces a decision now.

## Options
- **A. <option>:** what it is; main cost; main benefit.
- **B. <option>:** ...

## Decision
The chosen option, stated specifically enough to implement.

## Consequences
- Gained: ...
- Given up / accepted risk: ...
- Follow-up work: ...

## Revisit when
The measurable condition that should reopen this decision.
```

Use the project's ADR format instead if it already has one. Use the actual
date the ADR is written.

## Pitfalls

- Choosing a pattern for a scale the project has not measured.
- Presenting a decision already made in code as a fresh option set; document
  it as the status quo and evaluate change against it.
- Options that differ only in library names; the decision is usually one
  level up (managed vs self-hosted, sync vs async).
- An ADR with no "given up" section was not a trade-off, or it was not
  written honestly.

## Done when

The decision is stated, the options were compared against named
constraints, and an ADR exists in the project's decision folder (default
`docs/decisions/`) with status, consequences, and a revisit trigger.
