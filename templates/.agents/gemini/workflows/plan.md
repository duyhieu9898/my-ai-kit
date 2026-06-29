---
description: Create a repository-aware initiative roadmap without modifying production code.
---

# /plan - Project Planning

$ARGUMENTS

Use the `project-planner` agent to create a roadmap for the requested project,
major feature, migration, or cross-module initiative.

## Rules

1. Inspect repository context with read-only operations.
2. Reuse decisions already provided by the user.
3. Ask only when missing information materially changes scope or architecture.
4. Do not modify production code, install tools, scaffold files, or run
   mutating project commands.
5. Do not assume specialist agents or skills exist; confirm availability before
   recommending one.
6. Select verification from the actual project and label it as planned evidence.
7. Create the plan at `docs/PLAN-{task-slug}.md`, unless the user or repository
   defines a stronger path convention.

## Required Output

- objective, assumptions, scope, and success criteria;
- proposed architecture and affected surfaces;
- milestone-level tasks with `INPUT -> OUTPUT -> VERIFY`;
- dependency and parallelism map;
- risks, rollback notes, and open decisions;
- project-specific verification strategy and exit criteria;
- exact plan path in the final response.

Use `plan-writing` instead when the request is a bounded implementation plan for
a known change.
