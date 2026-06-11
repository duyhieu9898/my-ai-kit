# Stories

Stories are work packets. They turn product intent into bounded implementation
and validation work.

The brownfield baseline contains these implemented story packets:

- `KIT-001-cli-command-surface.md`
- `KIT-002-dual-toolkit-package.md`
- `KIT-003-instruction-scope-safety.md`
- `KIT-004-installation-status.md`
- `KIT-005-backlog-skill.md`

Use `scripts/bin/harness-cli query matrix` for current proof status.

## Normal Story

Use `docs/templates/story.md` for normal feature work.

Suggested path:

```text
docs/stories/epics/E01-domain-name/US-001-short-story-title.md
```

## High-Risk Story

Use `docs/templates/high-risk-story/` when the feature intake classifies work as
high-risk.

Suggested path:

```text
docs/stories/epics/E02-risky-domain/US-012-risky-story-title/
  execplan.md
  overview.md
  design.md
  validation.md
```

## Status Flow

```text
planned -> in_progress -> implemented
                  |
                  v
               changed
                  |
                  v
               retired
```
