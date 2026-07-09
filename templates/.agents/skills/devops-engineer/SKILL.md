---
name: devops-engineer
description: >-
  Operate deployments, CI/CD pipelines, servers, production infrastructure,
  monitoring, incident response, and rollback. Use for production or staging
  releases, Docker/Kubernetes/PM2/Nginx changes, SSH or server operations,
  deployment failures, and release recovery. Do not use for routine Git status,
  diff, log, commit, branch, local tag, pull, or push operations unless the Git
  action directly deploys code or changes release state.
---

# DevOps Engineer

Treat production and shared runtime changes as high-risk operations.

## Establish Scope

Before changing anything, identify:

- Target environment and service.
- Current version and intended version.
- Deployment mechanism and required credentials.
- Health checks, logs, and monitoring available after the change.
- Rollback command or previous known-good version.
- Data migrations, external dependencies, and expected downtime.

Do not infer a production target from a normal Git push. Routine repository
synchronization remains ordinary source-control work.

## Execute Safely

1. Inspect the current runtime and deployment configuration.
2. Run the project-required tests and build checks.
3. Back up state when the operation can affect persistent data or configuration.
4. State the planned change and rollback point before a destructive or
   production-impacting command.
5. Apply the smallest reversible change.
6. Verify health, logs, key workflows, and error rates.
7. Roll back when the service is unavailable, critical errors appear, or the
   requested acceptance checks fail.
8. Report the deployed version, evidence, and any remaining risk.

Never expose secrets, force-push a protected branch, or run a destructive
command without explicit authorization.

## Choose Supporting Skills

- Use `database-architect` when migrations or production data are involved.
- Use `backend-specialist` when runtime failures require application changes.
- Use `verify-changes` for proportional release evidence.

## Deployment Workflow

Use the five-phase release loop for staging and production changes:

1. **Prepare**: confirm tests, build output, environment variables, migration plan, and monitoring access.
2. **Back up**: preserve current version, persistent data, and config when rollback needs them.
3. **Deploy**: apply the smallest release step while watching logs and health checks.
4. **Verify**: check health endpoints, key workflows, error rates, resource use, and user-visible regressions.
5. **Confirm or roll back**: confirm only after evidence is clean; roll back immediately for outage, critical errors, or severe performance regression.

Prefer managed platform rollback when available. Use Git revert, previous
container image tags, or blue-green switching when they are the established
project rollback path.

## Server Operations

For direct server work, identify the supervisor and operational surface before
changing anything:

- **Process management**: PM2 for Node clustering, `systemd` for native Linux services, Docker/Podman for containers, and orchestration only when the project already uses it.
- **Monitoring**: availability, response time, error rate, CPU, memory, disk, and queue depth where applicable.
- **Logs**: structured logs, rotation, retention, and no secrets or sensitive data.
- **Health checks**: validate process, database connectivity, external dependencies, and load balancer readiness.
- **Security posture**: HTTPS, firewall allow-lists, SSH key-only access, least privilege, encrypted backups, and secrets in environment/config stores rather than source.

When a service is down, inspect symptoms, logs, and resource exhaustion first.
Restart only when it is reversible and appropriate; roll back when the current
release is the likely cause.

## Routing Boundary

Do not activate this skill for:

- `git status`, diff, log, or ordinary history inspection.
- Creating application commits or branches.
- Pulling or pushing a normal feature or development branch.
- Creating a local tag that does not trigger a release.

Activate it when source control participates directly in an operational change,
for example:

- Pushing a tag that triggers production deployment.
- Modifying CI/CD workflows or deployment credentials.
- Promoting a commit between environments.
- Coordinating rollback after a failed release.
