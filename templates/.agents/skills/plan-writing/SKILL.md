---
name: plan-writing
description: >-
  Create bounded implementation plans for known features, bug fixes, and
  multi-file refactors. Produce small file-aware tasks with explicit
  verification criteria. Use after scope and architecture are sufficiently
  understood. NOT for trivial edits, executing an existing plan, new-product
  roadmaps, or cross-workstream initiatives that belong in project-planner.
---

# Plan Writing

Create a concise implementation plan for a bounded, understood change.

## Operating Boundary

- Use for a known feature, bug fix, or multi-file refactor.
- Use when affected files and behavior can be identified.
- Use when each task can have a concrete verification method.
- Do not use for new-product roadmaps or cross-workstream initiatives.
- Do not use for trivial one-step edits or direct execution of an existing plan.
- Use [`project-planner`](../project-planner/SKILL.md) when scope spans multiple
  work streams or still requires project-level architecture decisions.

## Workflow

1. Restate the goal and implementation boundary.
2. Inspect the affected files, callers, tests, and project commands.
3. Identify hard dependencies and tasks that can run in parallel.
4. Break work into five to ten small, independently verifiable tasks.
5. Give every task a specific action and `Verify:` criterion.
6. Select checks from the actual project; do not copy generic commands.
7. Save the plan using the repository's convention or the default path below.

Do not implement tasks or mark checks complete while writing the plan.

## Default Plan Path

Save bounded implementation plans in the project root as:

```text
{task-slug}.md
```

Use lowercase kebab-case derived from the requested change. If the repository or
user specifies another location, follow that stronger authority.

## Task Quality

Each task must:

- name the affected file, module, interface, or command;
- describe one clear outcome;
- identify hard blockers only;
- state how completion will be verified;
- avoid speculative cleanup outside the requested scope.

Prefer:

```markdown
- [ ] Update `src/auth/session.ts` to reject expired refresh tokens.
  Verify: Run the focused auth test and confirm the expired-token case returns
  the expected error.
```

Avoid:

```markdown
- [ ] Improve authentication.
```

## Project-Specific Verification

Choose checks according to the changed surface:

| Surface | Example verification |
|---|---|
| CLI or library | Unit tests, syntax or type checks, command smoke test |
| Backend or API | Contract or integration test, focused request probe |
| Web UI | Component test, build, browser interaction |
| Mobile or desktop | Platform build, emulator or device smoke test |
| Data | Migration dry run, integrity query, rollback check |
| Infrastructure | Config validation, deployment dry run |

Do not require every script for every plan. Document expected checks without
claiming they have already passed.

## Minimal Structure

```markdown
# [Change Name]

## Goal
[One sentence]

## Scope
- In:
- Out:

## Tasks
- [ ] [Specific action]
  Verify: [Executable or observable evidence]

## Done When
- [ ] [Main success criterion]
```

Add risks, rollback, or dependency sections only when they materially help.

## Quality Checklist

- [ ] The change is bounded and understood.
- [ ] Tasks name concrete affected surfaces.
- [ ] Every task has an actionable `Verify:` criterion.
- [ ] Hard dependencies and parallel work are clear.
- [ ] Verification matches the project and changed behavior.
- [ ] The plan stays within the requested scope.
- [ ] No implementation task was executed or marked complete.
