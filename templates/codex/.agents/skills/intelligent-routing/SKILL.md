---
name: intelligent-routing
description: >-
  Design, review, or modify automated routing rules for developer requests,
  specialist selection, multi-agent workspaces, router middleware, domain
  detection, complexity thresholds, and explicit overrides. Use when the task
  is about how requests should be classified or delegated. Do not use merely
  because an ordinary request needs one specialist; follow the repository's
  existing routing rules directly for those tasks.
---

# Intelligent Routing

Create routing rules that select the smallest sufficient skill set without
turning every request into orchestration.

## Establish Authority

Apply routing sources in this order:

1. System and repository instructions.
2. Explicit user skill or agent selection.
3. Nearest scoped routing rules.
4. Skill metadata and domain heuristics.
5. Direct response when no specialist adds value.

Do not let a generic keyword override a more specific negative boundary.

## Define A Route

For each request class:

1. Identify the user intent and expected action.
2. Select the primary domain from the requested outcome, not isolated words.
3. Add another skill only when it owns an independent part of the work.
4. Use orchestration only when multiple domains require separate coordination.
5. Define exclusions for common false positives.
6. Specify what happens when intent is ambiguous.
7. Add positive and negative example prompts.

Prefer one clear owner for simple tasks. Do not route generic questions,
routine shell commands, or ordinary repository operations to a specialist
without a domain-specific reason.

## Complexity Rules

| Shape | Route |
|---|---|
| Direct question with stable answer | Answer directly |
| Clear single-domain task | One relevant skill |
| Two dependent concerns handled sequentially | Minimal ordered skill set |
| Independent multi-domain work | Orchestrator |
| Ambiguous or risky target | Clarify before mutation |

File count alone does not determine complexity.

## Core Domain Signals

Use these as supporting evidence, not standalone triggers:

| Domain | Strong signals |
|---|---|
| Frontend | React, component, CSS, responsive UI |
| Backend | Endpoint, server logic, API implementation |
| Database | Schema, migration, indexing, SQL |
| Testing | Unit, integration, E2E, coverage |
| Security | Threat model, vulnerability, authorization review |
| Debugging | Reproduction, root cause, crash, regression |
| DevOps | Deployment, CI/CD, production server, rollback |
| Mobile | React Native, Flutter, iOS, Android |

## Source-Control Boundary

Routine Git operations are not DevOps by themselves:

- Status, diff, log, commit, branch, pull, and ordinary push.
- Local tags that do not trigger a release.

Route to `devops-engineer` only when source control directly changes deployment
or release state, such as a production deployment tag, CI/CD modification,
environment promotion, or rollback.

## Validate Routing Changes

Test each rule with:

- A positive prompt that must select the target skill.
- A near-match that must not select it.
- An explicit user override.
- An ambiguous prompt requiring clarification.
- A multi-domain prompt that proves whether orchestration is necessary.

Minimum source-control checks:

```text
"Commit these changes and push the current branch"
Expected: routine repository work; no devops-engineer

"Push the production deployment tag and monitor rollout"
Expected: devops-engineer
```

Keep routing documentation concise. Put domain procedures in the selected
specialist skill rather than duplicating them here.
