# KIT-013 Self-Contained Project Planner

## Status

implemented

## Lane

normal

## Product Contract

The Codex `project-planner` skill and Gemini `project-planner` agent create
repository-aware initiative roadmaps without depending on removed
capabilities, assuming one platform, or prescribing a web-specific
verification stack.

## Relevant Product Docs

- `templates/codex/.agents/skills/project-planner/SKILL.md`
- `templates/codex/.agents/skills/plan-writing/SKILL.md`
- `templates/codex/.agents/ARCHITECTURE.md`
- `templates/gemini/.agents/agents/project-planner.md`
- `templates/gemini/.agents/skills/plan-writing/SKILL.md`
- `templates/gemini/.agents/workflows/plan.md`
- `templates/gemini/.agents/ARCHITECTURE.md`

## Acceptance Criteria

- `project-planner` contains no links or routing requirements for removed
  specialist skills.
- Project roadmaps and bounded implementation plans have distinct triggers.
- The planner uses one canonical default path: `docs/PLAN-{task-slug}.md`.
- Planning permits read-only discovery but prohibits production mutations.
- Project classification and verification work across web, backend, mobile,
  desktop, CLI, library, data, and infrastructure projects.
- UI metadata contains useful invocation prompts.
- Gemini's `/plan` workflow follows the same roadmap contract.
- Template checks detect regressions in both targets' planner links and
  semantic boundaries.

## Design Notes

- Commands: `npm run check:templates`
- Domain rules: Recommend installed skills only after confirming availability;
  otherwise describe the required capability or owner.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Planner semantic assertions pass for both targets. |
| Integration | Planner, plan-writing, and Gemini `/plan` contracts align. |
| E2E | Not required. |
| Platform | Codex skills pass `quick_validate.py`; Gemini planner frontmatter and Antigravity trigger fields parse and satisfy the target standard. |
| Release | Package dry run includes the changed template files. |

## Harness Delta

Extends template consistency checks with focused cross-target planner link and
semantic regression coverage.

## Evidence

- Both Codex planner skills passed the skill-creator `quick_validate.py` check.
- Gemini planner agent, skill, and workflow frontmatter parsed successfully;
  the skill retains the Antigravity-specific `when_to_use` trigger.
- Both changed `openai.yaml` files parsed successfully and use actionable
  `$skill-name` prompts.
- `npm run check:templates` passed 320 checks, including cross-target planner link and
  semantic assertions.
- `scripts/bin/harness-cli story verify KIT-013` passed.
- `npm pack --dry-run --json` included the changed skills, metadata, and
  template consistency script.
- `git diff --check` passed.
