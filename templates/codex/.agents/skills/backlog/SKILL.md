---
name: backlog
description: Manage Backlog projects through the bundled CLI, including listing and searching issues, inspecting project metadata, creating or updating issues, creating UT bugs, resolving bugs, reviewing Story/Task deadlines, and reading local metrics or session traces. Use when a user asks Codex to inspect or modify configured Backlog tickets or project workflows.
---

# Backlog

Use the bundled CLI instead of calling the Backlog API directly.

## Run The CLI

Run commands from this skill directory:

```bash
python3 scripts/backlog.py --help
```

Load `BACKLOG_API_KEY` from the environment or copy `.env.example` to `.env`.
Never print the API key or a full request URL containing its query string.

## Select A Command

| Intent | Command |
|:---|:---|
| List or search work | `issue list [--query TEXT] [--type TYPE] [--project KEY]` |
| Read an issue | `issue get ISSUE_KEY` |
| List open bugs assigned to the configured user | `bug my-open [--project KEY]` |
| Analyze a bug | `bug context ISSUE_KEY` |
| Review Story/Task deadlines | `story overview [--project KEY]` |
| Create or update an issue | `issue create` or `issue update` |
| Create a UT child bug | `bug create-ut` |
| Resolve a bug | `bug resolve ISSUE_KEY` |
| Refresh project metadata | `project inspect PROJECT_KEY` |
| Inspect workflow rules or fields | `bug rules` or `bug fields [FIELD]` |
| Audit workflow/config consistency | `config audit-workflows` |

Use `config current` and `config list-projects` when project selection is unclear.
Pass `--project KEY` for one-off project selection; do not change the default project for a single command.

## Execute Safely

1. Resolve the user's intent, issue key, and project.
2. Run a read command before constructing a mutation.
3. Refresh the project catalog with `project inspect` when metadata is missing or stale.
4. Run mutations without `--apply` and inspect the payload or diff.
5. Add `--apply` only after the requested values and required fields are unambiguous.
6. Report the resulting issue key or the API error without guessing the outcome.

For `bug resolve`, confirm the dry-run `assignment.to` reporter is the intended
QC. Use `--commit <hash-or-ref>` to attach the implementation reference to the
comment. `bug fields` only documents `qc_activity`, `bug_origin`, and
`cause_category`; inspect workflow-managed fields in the resolve dry-run.

Treat `issue create`, `issue update`, `bug create-ut`, and `bug resolve` as dry runs unless `--apply` is present. Do not change status, assignee, categories, or custom fields unless the request or configured workflow requires it.

Use compact output by default. Add global `--json-full` only when raw API data is necessary.

## Read-Only Fast Path

For `issue list`, `issue get`, `bug my-open`, `bug context`,
`story overview`, `config current`, and `config list-projects`, run the command
after reading this skill. These reporting-only requests skip Harness intake,
proof-matrix queries, and traces.

Do not use the fast path for `project inspect`, config changes, issue
mutations, bug resolution, repository edits, implementation analysis, or any
request that grows beyond reporting the CLI result.

## Load References As Needed

- Read [references/cli.md](references/cli.md) for complete command syntax.
- Read [references/workflows.md](references/workflows.md) before creating UT bugs or resolving bugs.
- Read [references/logs.md](references/logs.md) to understand how to locate, read, and analyze execution logs and session traces.

Prefer `bug rules` and `bug fields` over static prose when current workflow defaults or field options are needed.
Run `config audit-workflows` after changing workflow JSON, policy constants,
field guidance, project catalogs, or workflow output fields.
