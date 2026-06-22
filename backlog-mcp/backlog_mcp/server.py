#!/usr/bin/env python3
"""Stdio MCP server exposing the Backlog integration to every local project."""

import json
from typing import Annotated, Any

from pydantic import Field
from mcp.server.fastmcp import FastMCP
from mcp.types import CallToolResult, TextContent

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


def _to_markdown(data: Any) -> str:
    if not data:
        return "No data."
    if isinstance(data, list):
        if all(isinstance(x, dict) for x in data):
            lines = []
            for i, item in enumerate(data):
                item_key = item.get("issueKey") or item.get("key") or f"Item {i+1}"
                lines.append(f"### {item_key}:")
                for k, v in item.items():
                    if k in ("issueKey", "key"):
                        continue
                    if isinstance(v, dict):
                        lines.append(f"  - **{k}**:")
                        for nk, nv in v.items():
                            lines.append(f"    - **{nk}**: {nv}")
                    elif isinstance(v, list):
                        lines.append(f"  - **{k}**:")
                        for lv in v:
                            lines.append(f"    - {lv}")
                    else:
                        lines.append(f"  - **{k}**: {v}")
            return "\n".join(lines)
        else:
            return "\n".join(f"- {x}" for x in data)
    elif isinstance(data, dict):
        lines = []
        for k, v in data.items():
            if isinstance(v, dict):
                lines.append(f"- **{k}**:")
                for nk, nv in v.items():
                    lines.append(f"  - **{nk}**: {nv}")
            elif isinstance(v, list):
                lines.append(f"- **{k}**:")
                for item in v:
                    lines.append(f"  - {item}")
            else:
                lines.append(f"- **{k}**: {v}")
        return "\n".join(lines)
    return str(data)


def _invoke(args: list[str], list_key: str | None = None, full: bool = False) -> CallToolResult:
    if full:
        if "--json-full" not in args:
            args.append("--json-full")
    res = execute(args)
    data = res.data
    text = res.text

    if isinstance(data, list):
        key = list_key or "items"
        structured = {key: data}
    elif isinstance(data, dict):
        structured = data
    else:
        structured = {"result": data}

    # Avoid JSON stringify inside text field of CallToolResult
    if text.strip().startswith(("{", "[")):
        text = _to_markdown(data)

    return CallToolResult(
        content=[TextContent(type="text", text=text)],
        structuredContent=structured
    )


@mcp.tool()
def get_issue(
    issue_id: Annotated[str, Field(description="Issue key (e.g., 'PROJ-123') or numeric ID")],
    full: Annotated[bool, Field(description="If True, fetches full issue details instead of compact fields")] = False,
) -> CallToolResult:
    """Get one Backlog issue by key or numeric ID."""
    return _invoke(["issue", "get", issue_id], full=full)


@mcp.tool()
def get_issues(
    project: Annotated[str | None, Field(description="Project key (e.g., 'PRJ'). Uses default project key if omitted.")] = None,
    query: Annotated[str | None, Field(description="Optional search text keyword to filter issues by summary or description")] = None,
    issue_types: Annotated[list[str] | None, Field(description="List of issue type names to filter (e.g., ['Bug', 'Story'])")] = None,
    include_closed: Annotated[bool, Field(description="If True, includes Closed issues. Defaults to False (open only)")] = False,
    view: Annotated[str, Field(description="Presentation view: 'compact' (general triage table) or 'story' (due dates & alert warnings)")] = "compact",
    full: Annotated[bool, Field(description="If True, fetches full issue details instead of compact fields")] = False,
) -> CallToolResult:
    """List issues assigned to the configured user, scoped to one project."""
    args = ["issue", "list"]
    _append(args, "--project", project)
    _append(args, "--query", query)
    _append_many(args, "--type", issue_types)
    _append(args, "--view", view)
    if include_closed:
        args.append("--all")
    return _invoke(args, list_key="issues", full=full)


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
def create_issue(
    summary: Annotated[str, Field(description="Issue summary title")],
    project: Annotated[str | None, Field(description="Project key (e.g., 'PRJ'). Uses default project key if omitted.")] = None,
    issue_type: Annotated[str | None, Field(description="Issue type name or ID (e.g., 'Bug', 'Task', 'Story')")] = None,
    parent: Annotated[str | None, Field(description="Parent issue key (e.g., 'PRJ-123')")] = None,
    description: Annotated[str | None, Field(description="Issue description detail text")] = None,
    priority: Annotated[str | None, Field(description="Priority name or ID (e.g., 'High', 'Normal', 'Low')")] = None,
    assignee: Annotated[str | None, Field(description="Assignee user reference from config.users or raw user ID")] = None,
    category: Annotated[str | None, Field(description="Category name or ID")] = None,
    start_date: Annotated[str | None, Field(description="Start date in YYYY-MM-DD format")] = None,
    due_date: Annotated[str | None, Field(description="Due date in YYYY-MM-DD format")] = None,
    estimated_hours: Annotated[float | None, Field(description="Estimated hours")] = None,
    actual_hours: Annotated[float | None, Field(description="Actual hours")] = None,
    custom_fields: Annotated[list[str] | None, Field(description="Custom field key/value pairs in 'KEY=VALUE' format (e.g., ['qc_activity=Unit Test', 'bug_origin=COD_Coding Logic'])")] = None,
    apply: Annotated[bool, Field(description="Set to True to actually create the issue. Defaults to False (dry-run)")] = False,
) -> CallToolResult:
    """Create or preview creation of a Backlog issue (dry-run unless apply=True)."""
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
    issue_id: Annotated[str, Field(description="Issue key (e.g., 'PROJ-123') or numeric ID")],
    project: Annotated[str | None, Field(description="Project key (e.g., 'PRJ'). Uses default project key if omitted.")] = None,
    summary: Annotated[str | None, Field(description="New issue summary title")] = None,
    status: Annotated[str | None, Field(description="Status name or ID to transition to")] = None,
    comment: Annotated[str | None, Field(description="Comment text to add to the update")] = None,
    description: Annotated[str | None, Field(description="New description detail text")] = None,
    priority: Annotated[str | None, Field(description="New priority name or ID")] = None,
    assignee: Annotated[str | None, Field(description="New assignee user reference or raw user ID")] = None,
    category: Annotated[str | None, Field(description="New category name or ID")] = None,
    start_date: Annotated[str | None, Field(description="New start date in YYYY-MM-DD format")] = None,
    due_date: Annotated[str | None, Field(description="New due date in YYYY-MM-DD format")] = None,
    estimated_hours: Annotated[float | None, Field(description="New estimated hours")] = None,
    actual_hours: Annotated[float | None, Field(description="New actual hours")] = None,
    custom_fields: Annotated[list[str] | None, Field(description="Custom field updates in 'KEY=VALUE' format (e.g., ['qc_activity=Unit Test', 'bug_origin=COD_Coding Logic'])")] = None,
    apply: Annotated[bool, Field(description="Set to True to actually apply the updates. Defaults to False (dry-run)")] = False,
) -> CallToolResult:
    """Update or preview update of a Backlog issue (dry-run unless apply=True)."""
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
def get_my_open_bugs(
    project: Annotated[str | None, Field(description="Project key (e.g., 'PRJ'). Uses default project key if omitted.")] = None,
    query: Annotated[str | None, Field(description="Optional query keyword to search in bug summary or description")] = None,
    full: Annotated[bool, Field(description="If True, fetches full bug details instead of compact fields")] = False,
) -> CallToolResult:
    """List open bugs assigned to the configured user in one project."""
    args = ["bug", "list"]
    _append(args, "--project", project)
    _append(args, "--query", query)
    return _invoke(args, list_key="bugs", full=full)


@mcp.tool()
def get_bug_context(
    issue_key: Annotated[str, Field(description="Bug issue key (e.g., 'PRJ-123') to analyze")]
) -> CallToolResult:
    """Get structured bug context, including current assignee and reporter."""
    return _invoke(["bug", "context", issue_key])


@mcp.tool()
def resolve_bug(
    issue_key: Annotated[str, Field(description="Bug issue key to resolve (e.g., 'PRJ-123')")],
    status: Annotated[str | None, Field(description="Target status name or ID to transition to (defaults to Resolved/Closed states)")] = None,
    actual_hours: Annotated[float | None, Field(description="Actual hours spent fixing the bug")] = None,
    estimated_hours: Annotated[float | None, Field(description="Estimated hours")] = None,
    qc_activity: Annotated[str | None, Field(description="Quality control activity name where bug was found (e.g., 'Unit Test')")] = None,
    cause_category: Annotated[str | None, Field(description="Cause category name (e.g., 'COD_Coding Logic')")] = None,
    bug_origin: Annotated[str | None, Field(description="Bug origin category name")] = None,
    impacted: Annotated[str | None, Field(description="Impacted component/module name")] = None,
    resolution: Annotated[str | None, Field(description="Resolution details or type")] = None,
    comment: Annotated[str | None, Field(description="Resolve comment text")] = None,
    commit: Annotated[str | None, Field(description="Git commit hash/ref related to the fix")] = None,
    fix_description: Annotated[str | None, Field(description="Corrective action or fix description text")] = None,
    apply: Annotated[bool, Field(description="Set to True to actually transition the bug. Defaults to False (dry-run)")] = False,
) -> CallToolResult:
    """Resolve or preview resolution of a bug (dry-run unless apply=True)."""
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
def create_ut_bug(
    parent_key: Annotated[str, Field(description="Parent issue key (e.g., 'PRJ-123') to attach the UT bug to")],
    module: Annotated[str, Field(description="Name of the module or file with the failing unit test")],
    description: Annotated[str, Field(description="Unit test failure description details")],
    project: Annotated[str | None, Field(description="Project key (e.g., 'PRJ'). Uses default project key if omitted.")] = None,
    apply: Annotated[bool, Field(description="Set to True to actually create the UT bug. Defaults to False (dry-run)")] = False,
) -> CallToolResult:
    """Create or preview creation of a Unit Test sub-task bug (dry-run unless apply=True)."""
    args = ["bug", "create-ut", parent_key, module, description]
    _append(args, "--project", project)
    if apply:
        args.append("--apply")
    return _invoke(args)


@mcp.tool()
def get_bug_rules(
    project: Annotated[str | None, Field(description="Project key (e.g., 'PRJ'). Uses default project key if omitted.")] = None
) -> CallToolResult:
    """Get current resolve-bug workflow rules for one project."""
    args = ["bug", "rules"]
    _append(args, "--project", project)
    return _invoke(args)


@mcp.tool()
def get_bug_fields(
    field: Annotated[str | None, Field(description="Field name to get guidance for (e.g., 'qc_activity', 'bug_origin', 'cause_category')")] = None,
    project: Annotated[str | None, Field(description="Project key (e.g., 'PRJ'). Uses default project key if omitted.")] = None,
) -> CallToolResult:
    """Get configured guidance for bug workflow fields."""
    args = ["bug", "fields"]
    if field is not None:
        args.append(field)
    _append(args, "--project", project)
    return _invoke(args)


@mcp.tool()
def get_story_overview(
    project: Annotated[str | None, Field(description="Project key (e.g., 'PRJ'). Uses default project key if omitted.")] = None,
    query: Annotated[str | None, Field(description="Optional query text to filter stories")] = None,
) -> CallToolResult:
    """Get Story and Task deadlines assigned to the configured user."""
    args = ["story", "overview"]
    _append(args, "--project", project)
    _append(args, "--query", query)
    return _invoke(args, list_key="stories")


@mcp.tool()
def list_configured_projects() -> CallToolResult:
    """List configured Backlog projects without querying every project."""
    return _invoke(["config", "list-projects"], list_key="projects")


@mcp.tool()
def get_config() -> CallToolResult:
    """Get local Backlog configuration settings (credentials are excluded)."""
    return _invoke(["config", "show"])


@mcp.tool()
def audit_config_workflows() -> CallToolResult:
    """Validate workflow config, policies, and project catalogs for drift."""
    return _invoke(["config", "audit-workflows"])


@mcp.tool()
def inspect_project(
    project_key: Annotated[str, Field(description="Project key to inspect (e.g., 'PRJ')")],
    write: Annotated[bool, Field(description="Set to True to refresh/write the local catalog file, False to print to console")] = False,
) -> CallToolResult:
    """Fetch project metadata; set write=true to refresh the local catalog."""
    args = ["project", "inspect", project_key]
    if not write:
        args.append("--stdout")
    return _invoke(args)


@mcp.prompt()
def resolve_bug_prompt(
    issue_key: Annotated[str, Field(description="The key of the bug issue to resolve (e.g., 'PRJ-123')")]
) -> str:
    """Guide the agent to resolve a bug following project workflow policies."""
    return (
        f"Please guide me to resolve the bug {issue_key} following our project's workflow rules.\n\n"
        f"Steps to take:\n"
        f"1. Fetch the bug context using `get_bug_context` for {issue_key}.\n"
        f"2. Fetch the resolve-bug rules using `get_bug_rules` for the project.\n"
        f"3. Retrieve guidelines for any required guided fields using `get_bug_fields`.\n"
        f"4. Propose a resolve action using `resolve_bug` (first as a dry-run with apply=False).\n"
        f"5. Once I review the assignment changes and dry-run output, apply the resolution with apply=True."
    )


@mcp.prompt()
def create_ut_bugs_prompt(
    parent_key: Annotated[str, Field(description="The parent issue key (e.g., 'PRJ-123')")],
    module: Annotated[str, Field(description="The name of the module or component under test")]
) -> str:
    """Guide the agent to create a Unit Test sub-task bug under a parent issue."""
    return (
        f"I need to create a Unit Test (UT) child bug for the parent issue {parent_key} and module {module}.\n\n"
        f"Steps to take:\n"
        f"1. Inspect the parent issue context using `get_issue` for {parent_key}.\n"
        f"2. Draft the UT bug details and use `create_ut_bug` with apply=False to dry-run and preview the payload.\n"
        f"3. After I confirm, execute `create_ut_bug` with apply=True to create the task on Backlog."
    )


@mcp.prompt()
def project_status_prompt(
    project: Annotated[str | None, Field(description="Project key. Uses the configured default project if omitted.")] = None
) -> str:
    """Guide the agent to check the current project status overview."""
    proj_desc = f"project '{project}'" if project else "the default project"
    return (
        f"Please check and summarize the current status of {proj_desc}.\n\n"
        f"Steps to take:\n"
        f"1. Retrieve story and task deadlines using `get_story_overview`.\n"
        f"2. List open bugs assigned to me using `get_my_open_bugs`.\n"
        f"3. Present a clear, consolidated status report highlighting any overdue deadlines or critical bugs."
    )


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
