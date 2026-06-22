#!/usr/bin/env python3
"""Stdio MCP server exposing the Backlog integration to every local project."""

import json
from typing import Any

from mcp.server.fastmcp import FastMCP

from backlog_tool.cli import execute
from backlog_tool.settings import load_config, project_keys, summarize_metrics


SERVER_INSTRUCTIONS = (
    "Use this server for configured Backlog projects. Read before mutating. "
    "Issue creation/update and bug create/resolve are dry runs unless apply=true. "
    "When a project is omitted, use only the configured default project; never enumerate "
    "other projects unless the user explicitly requests one. Never expose API keys or full "
    "request URLs containing query strings."
)

mcp = FastMCP(
    name="Backlog Local",
    instructions=SERVER_INSTRUCTIONS,
    json_response=True,
)


def _append(args: list[str], flag: str, value: Any) -> None:
    if value is not None:
        args.extend((flag, str(value)))


def _append_many(args: list[str], flag: str, values: list[str] | None) -> None:
    for value in values or []:
        args.extend((flag, value))


def _invoke(args: list[str], full: bool = False) -> Any:
    if full:
        args.append("--json-full")
    return execute(args).data


@mcp.tool()
def get_issue(issue_id: str, full: bool = False) -> Any:
    """Get one Backlog issue by key or numeric ID."""
    return _invoke(["issue", "get", issue_id], full)


@mcp.tool()
def get_issues(
    project: str | None = None,
    query: str | None = None,
    issue_types: list[str] | None = None,
    include_closed: bool = False,
    view: str = "compact",
    full: bool = False,
) -> Any:
    """List issues assigned to the configured user, scoped to one project."""
    args = ["issue", "list"]
    _append(args, "--project", project)
    _append(args, "--query", query)
    _append_many(args, "--type", issue_types)
    _append(args, "--view", view)
    if include_closed:
        args.append("--all")
    return _invoke(args, full)


def _append_issue_fields(
    args: list[str],
    *,
    description: str | None,
    priority: str | None,
    assignee: str | None,
    category: str | None,
    start_date: str | None,
    due_date: str | None,
    estimated_hours: float | None,
    actual_hours: float | None,
    custom_fields: list[str] | None,
) -> None:
    _append(args, "--desc", description)
    _append(args, "--priority", priority)
    _append(args, "--assignee", assignee)
    _append(args, "--category", category)
    _append(args, "--start-date", start_date)
    _append(args, "--due-date", due_date)
    _append(args, "--estimated-hours", estimated_hours)
    _append(args, "--actual-hours", actual_hours)
    _append_many(args, "--custom", custom_fields)


@mcp.tool()
def add_issue(
    summary: str,
    project: str | None = None,
    issue_type: str | None = None,
    parent: str | None = None,
    description: str | None = None,
    priority: str | None = None,
    assignee: str | None = None,
    category: str | None = None,
    start_date: str | None = None,
    due_date: str | None = None,
    estimated_hours: float | None = None,
    actual_hours: float | None = None,
    custom_fields: list[str] | None = None,
    apply: bool = False,
) -> Any:
    """Build an issue creation payload; set apply=true only to create it."""
    args = ["issue", "create", summary]
    _append(args, "--project", project)
    _append(args, "--issue-type", issue_type)
    _append(args, "--parent", parent)
    _append_issue_fields(
        args,
        description=description,
        priority=priority,
        assignee=assignee,
        category=category,
        start_date=start_date,
        due_date=due_date,
        estimated_hours=estimated_hours,
        actual_hours=actual_hours,
        custom_fields=custom_fields,
    )
    if apply:
        args.append("--apply")
    return _invoke(args)


@mcp.tool()
def update_issue(
    issue_id: str,
    project: str | None = None,
    summary: str | None = None,
    status: str | None = None,
    comment: str | None = None,
    description: str | None = None,
    priority: str | None = None,
    assignee: str | None = None,
    category: str | None = None,
    start_date: str | None = None,
    due_date: str | None = None,
    estimated_hours: float | None = None,
    actual_hours: float | None = None,
    custom_fields: list[str] | None = None,
    apply: bool = False,
) -> Any:
    """Build an issue update payload; set apply=true only to submit it."""
    args = ["issue", "update", issue_id]
    _append(args, "--project", project)
    _append(args, "--summary", summary)
    _append(args, "--status", status)
    _append(args, "--comment", comment)
    _append_issue_fields(
        args,
        description=description,
        priority=priority,
        assignee=assignee,
        category=category,
        start_date=start_date,
        due_date=due_date,
        estimated_hours=estimated_hours,
        actual_hours=actual_hours,
        custom_fields=custom_fields,
    )
    if apply:
        args.append("--apply")
    return _invoke(args)


@mcp.tool()
def get_my_open_bugs(project: str | None = None, query: str | None = None, full: bool = False) -> Any:
    """List open bugs assigned to the configured user in one project."""
    args = ["bug", "my-open"]
    _append(args, "--project", project)
    _append(args, "--query", query)
    return _invoke(args, full)


@mcp.tool()
def get_bug_context(issue_key: str) -> Any:
    """Get structured bug context, including current assignee and reporter."""
    return _invoke(["bug", "context", issue_key])


@mcp.tool()
def resolve_bug(
    issue_key: str,
    status: str | None = None,
    actual_hours: float | None = None,
    estimated_hours: float | None = None,
    qc_activity: str | None = None,
    cause_category: str | None = None,
    bug_origin: str | None = None,
    impacted: str | None = None,
    resolution: str | None = None,
    comment: str | None = None,
    commit: str | None = None,
    fix_description: str | None = None,
    apply: bool = False,
) -> Any:
    """Build a resolve-bug transition; set apply=true only after reviewing its assignment and changes."""
    args = ["bug", "resolve", issue_key]
    for flag, value in (
        ("--status", status),
        ("--actual-hours", actual_hours),
        ("--estimated-hours", estimated_hours),
        ("--qc-activity", qc_activity),
        ("--cause-category", cause_category),
        ("--bug-origin", bug_origin),
        ("--impacted", impacted),
        ("--resolution", resolution),
        ("--comment", comment),
        ("--commit", commit),
        ("--fix-description", fix_description),
    ):
        _append(args, flag, value)
    if apply:
        args.append("--apply")
    return _invoke(args)


@mcp.tool()
def add_ut_bug(
    parent_key: str,
    module: str,
    description: str,
    project: str | None = None,
    apply: bool = False,
) -> Any:
    """Build a UT child-bug payload; set apply=true only to create it."""
    args = ["bug", "create-ut", parent_key, module, description]
    _append(args, "--project", project)
    if apply:
        args.append("--apply")
    return _invoke(args)


@mcp.tool()
def get_bug_rules(project: str | None = None) -> Any:
    """Return current resolve-bug workflow rules for one project."""
    args = ["bug", "rules"]
    _append(args, "--project", project)
    return _invoke(args)


@mcp.tool()
def get_bug_fields(field: str | None = None, project: str | None = None) -> Any:
    """Return configured guidance for bug workflow fields."""
    args = ["bug", "fields"]
    if field is not None:
        args.append(field)
    _append(args, "--project", project)
    return _invoke(args)


@mcp.tool()
def get_story_overview(project: str | None = None, query: str | None = None) -> Any:
    """Return Story and Task deadlines assigned to the configured user."""
    args = ["story", "overview"]
    _append(args, "--project", project)
    _append(args, "--query", query)
    return _invoke(args)


@mcp.tool()
def get_config_project_list() -> Any:
    """List configured Backlog projects without querying every project."""
    return _invoke(["config", "list-projects"])


@mcp.tool()
def get_config_current_project() -> Any:
    """Return the default project used when a tool omits project."""
    return _invoke(["config", "current"])


@mcp.tool()
def get_config() -> Any:
    """Return the local Backlog configuration; credentials are never included."""
    return _invoke(["config", "show"])


@mcp.tool()
def audit_config_workflows() -> Any:
    """Validate workflow config, policies, and project catalogs for drift."""
    return _invoke(["config", "audit-workflows"])


@mcp.tool()
def set_config_default_project(project_key: str, apply: bool = False) -> Any:
    """Preview or apply a change to the workstation-wide default project."""
    config = load_config()
    if project_key not in project_keys(config):
        available = ", ".join(sorted(project_keys(config)))
        raise ValueError(f"Unknown project '{project_key}'. Available: {available}")
    if not apply:
        return {
            "dryRun": True,
            "currentDefaultProjectKey": config.get("default_project_key", ""),
            "proposedDefaultProjectKey": project_key,
        }
    return _invoke(["config", "set-default", project_key])


@mcp.tool()
def inspect_project(project_key: str, write: bool = False) -> Any:
    """Fetch project metadata; set write=true to refresh the local catalog."""
    args = ["project", "inspect", project_key]
    if not write:
        args.append("--stdout")
    return _invoke(args)


@mcp.resource("backlog://config")
def config_resource() -> str:
    """Read the workstation-wide Backlog configuration as JSON."""
    return json.dumps(load_config(), indent=2, ensure_ascii=False)


@mcp.resource("backlog://metrics")
def metrics_resource() -> str:
    """Read aggregated local MCP usage metrics as JSON."""
    return json.dumps(summarize_metrics(), indent=2, ensure_ascii=False)


def main() -> None:
    """Run the workstation-local server over stdio."""
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
