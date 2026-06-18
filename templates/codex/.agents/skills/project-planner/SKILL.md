---
name: project-planner
description: >-
  Create project-level roadmaps for new products, major features, migrations,
  or cross-module initiatives. Map scope, architecture boundaries, milestones,
  dependencies, risks, ownership capabilities, and project-specific validation
  into an executable plan. Use for broad planning that spans multiple work
  streams. NOT for trivial edits, direct implementation, or a bounded
  file-by-file action plan that belongs in plan-writing.
---

# Project Planner

Create a decision-ready roadmap without implementing production code.

## Operating Boundary

- Work at project, initiative, or major-feature level.
- Inspect the repository with read-only commands when concrete context is needed.
- Write only the requested planning artifact.
- Do not modify production code, install tools, scaffold files, or run mutating
  project commands while planning.
- Do not assume that any specialist skill exists. Name the required capability
  or owner; recommend an installed skill only after confirming it is available.
- Use `plan-writing` instead when the request needs a bounded implementation
  checklist for a known change.

## Workflow

### 1. Establish Context

1. Restate the objective and expected user or business outcome.
2. Inspect repository instructions, architecture, existing plans, and relevant
   code or documentation.
3. Reuse decisions already supplied by the user. Ask only when a missing answer
   would materially change scope, architecture, or sequencing.
4. Record assumptions explicitly instead of presenting them as facts.

### 2. Define Scope

Identify:

- in-scope and out-of-scope behavior;
- project type and affected platforms;
- constraints such as timeline, compatibility, security, data, and operations;
- success criteria and non-functional requirements;
- unresolved questions and decisions.

Do not force a project into only WEB, MOBILE, or BACKEND. Classify it using the
actual repository and request, including desktop, CLI, library, data, and
infrastructure work when applicable.

### 3. Map The System

Describe only structures supported by repository evidence or clearly marked as
proposed:

- affected modules, files, services, and interfaces;
- data, API, event, and state boundaries;
- external systems and operational dependencies;
- testing and rollout boundaries;
- compatibility and migration concerns.

Avoid inventing schemas, endpoints, or directories when discovery has not
established them.

### 4. Build The Roadmap

Group work into milestones that each end in a coherent, verifiable state. For
every task include:

- `task_id` and concise action;
- outcome and rationale;
- affected surface;
- required capability or owner;
- hard dependencies;
- risk or rollback note when relevant;
- `INPUT -> OUTPUT -> VERIFY`.

Use dependencies only for real blockers. Mark independent tasks as parallel.
Keep task size large enough to represent meaningful project progress; defer
atomic file-level steps to `plan-writing`.

### 5. Select Proportional Verification

Choose evidence from the actual project rather than prescribing one stack:

| Surface | Example evidence |
|---|---|
| Library or CLI | Unit tests, type or syntax checks, command smoke tests |
| Backend or API | Contract tests, integration tests, request/response probes |
| Web UI | Component tests, build, browser checks, accessibility checks |
| Mobile or desktop | Platform build, device or emulator tests, native smoke tests |
| Data or migration | Migration dry run, integrity queries, rollback rehearsal |
| Infrastructure | Config validation, deployment dry run, health and rollback checks |

Include only checks relevant to the planned change. During planning, document
commands and expected evidence; do not claim they passed.

### 6. Write The Plan

For planning mode, save the artifact at:

```text
docs/PLAN-{task-slug}.md
```

Generate `{task-slug}` from two or three meaningful request keywords:

- lowercase kebab-case;
- no special characters other than hyphens;
- no generic names such as `plan.md`;
- maximum 30 characters.

If the user specifies another path or the repository defines a stronger
planning convention, follow that authority instead.

## Required Plan Sections

```markdown
# [Initiative Name]

## Objective
## Context And Assumptions
## Scope
## Success Criteria
## Proposed Architecture And Affected Surfaces
## Milestones And Task Breakdown
## Dependency And Parallelism Map
## Risks, Rollback, And Open Decisions
## Verification Strategy
## Exit Criteria
```

Adapt section depth to the request. Do not add empty ceremony.

## Exit Gate

Before concluding:

- confirm the plan path and slug;
- confirm assumptions and unknowns are visible;
- confirm every task has `INPUT -> OUTPUT -> VERIFY`;
- confirm dependencies are hard blockers rather than guesses;
- confirm verification is project-specific;
- confirm no production code or project state was changed;
- distinguish planned checks from checks that were actually executed.

## Anti-Patterns

- Referencing skills or agents that are not installed.
- Requiring web or Node.js checks for every project type.
- Inferring platform or architecture from a folder name.
- Installing discovery tools as a prerequisite for planning.
- Mixing roadmap planning with implementation.
- Producing a generic plan that ignores repository evidence.
