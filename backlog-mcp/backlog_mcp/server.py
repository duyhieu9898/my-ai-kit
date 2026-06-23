#!/usr/bin/env python3
"""Stdio MCP server exposing the Backlog integration to every local project."""

import json
from typing import Annotated, Any, Literal, Sequence

from pydantic import Field
from mcp.server.fastmcp import FastMCP
from mcp.types import CallToolResult, TextContent

from backlog_tool.cli import execute
from backlog_tool.settings import load_config, project_keys, summarize_metrics


SERVER_INSTRUCTIONS = (
    "Use this server for configured Backlog projects. Read before mutating. "
    "Issue creation/update and bug create/resolve are dry runs unless mode='apply'. "
    "When a project is omitted, use only the configured default project; never enumerate "
    "other projects unless the user explicitly requests one. Never expose API keys or full "
    "request URLs containing query strings."
)

IssueView = Literal["compact", "story"]
MutationMode = Literal["preview", "apply"]
SortOrder = Literal["asc", "desc"]
SortOrderOrDefault = Literal["asc", "desc", ""]
IssueSort = Literal[
    "issueType",
    "category",
    "version",
    "milestone",
    "summary",
    "status",
    "priority",
    "attachment",
    "sharedFile",
    "created",
    "createdUser",
    "updated",
    "updatedUser",
    "assignee",
    "startDate",
    "dueDate",
    "estimatedHours",
    "actualHours",
    "childIssue",
]
IssueSortOrDefault = Literal[
    "",
    "issueType",
    "category",
    "version",
    "milestone",
    "summary",
    "status",
    "priority",
    "attachment",
    "sharedFile",
    "created",
    "createdUser",
    "updated",
    "updatedUser",
    "assignee",
    "startDate",
    "dueDate",
    "estimatedHours",
    "actualHours",
    "childIssue",
]

mcp = FastMCP(
    name="Backlog Local",
    instructions=SERVER_INSTRUCTIONS,
    json_response=True,
)


def _append(args: list[str], flag: str, value: Any) -> None:
    if value not in (None, ""):
        args.extend((flag, str(value)))


def _append_many(args: list[str], flag: str, values: Sequence[str] | None) -> None:
    for value in values or []:
        if value:
            args.extend((flag, value))


def _append_custom_fields(args: list[str], custom_fields: dict[str, str] | None) -> None:
    for key, value in (custom_fields or {}).items():
        if value not in (None, ""):
            args.extend(("--custom", f"{key}={value}"))


def _append_list_controls(
    args: list[str],
    *,
    limit: int,
    offset: int,
    sort: str,
    order: str,
) -> None:
    args.extend(("--limit", str(limit), "--offset", str(offset)))
    _append(args, "--sort", sort)
    _append(args, "--order", order)


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


def _select_fields(data: Any, fields: Sequence[str]) -> Any:
    if not fields:
        return data
    if isinstance(data, list):
        return [_select_fields(item, fields) for item in data]
    if isinstance(data, dict):
        return {field: data.get(field) for field in fields}
    return data


def _item_count(data: Any) -> int:
    if isinstance(data, list):
        return len(data)
    if data in (None, "", [], {}):
        return 0
    return 1


def _pagination(limit: int, offset: int, returned: int, enabled: bool) -> dict[str, Any]:
    has_more = bool(enabled and limit > 0 and returned >= limit)
    return {
        "limit": limit if enabled else 0,
        "offset": offset if enabled else 0,
        "returned": returned,
        "hasMore": has_more,
        "nextOffset": offset + returned if has_more else 0,
    }


def _resource_uris(data: Any) -> list[str]:
    items = data if isinstance(data, list) else [data]
    uris = []
    for item in items:
        if isinstance(item, dict):
            issue_key = item.get("issueKey") or item.get("issue")
            if issue_key:
                uris.append(f"backlog://issue/{issue_key}")
    return sorted(set(uris))


def _envelope(
    *,
    ok: bool,
    data: Any,
    list_key: str | None,
    full: bool,
    fields: Sequence[str],
    limit: int,
    offset: int,
    paginated: bool,
    args: Sequence[str],
    error: dict[str, Any] | None = None,
) -> dict[str, Any]:
    selected_data = _select_fields(data, fields)
    result_data = {list_key or "items": selected_data} if isinstance(selected_data, list) else selected_data
    returned = _item_count(selected_data)
    return {
        "ok": ok,
        "data": result_data if result_data is not None else {},
        "metadata": {
            "command": ":".join(args[:2]) if len(args) >= 2 else ":".join(args),
            "full": full,
            "fields": list(fields),
            "resourceUris": _resource_uris(selected_data),
        },
        "pagination": _pagination(limit, offset, returned, paginated),
        "error": error or {"code": "", "message": "", "details": {}},
    }


def _error_result(args: Sequence[str], error: Exception) -> CallToolResult:
    error_payload = {
        "code": type(error).__name__,
        "message": str(error),
        "details": {"command": ":".join(args[:2]) if len(args) >= 2 else ":".join(args)},
    }
    structured = _envelope(
        ok=False,
        data={},
        list_key=None,
        full=False,
        fields=(),
        limit=0,
        offset=0,
        paginated=False,
        args=args,
        error=error_payload,
    )
    return CallToolResult(
        content=[TextContent(type="text", text=f"Error: {error_payload['message']}")],
        structuredContent=structured,
        isError=True,
    )


def _invoke(
    args: list[str],
    list_key: str | None = None,
    full: bool = False,
    fields: Sequence[str] = (),
    limit: int = 0,
    offset: int = 0,
    paginated: bool = False,
) -> CallToolResult:
    if full:
        if "--json-full" not in args:
            args.append("--json-full")
    try:
        res = execute(args)
    except Exception as error:
        return _error_result(args, error)
    data = res.data
    text = res.text

    # Avoid JSON stringify inside text field of CallToolResult
    if text.strip().startswith(("{", "[")):
        text = _to_markdown(data)

    structured = _envelope(
        ok=True,
        data=data,
        list_key=list_key,
        full=full,
        fields=fields,
        limit=limit,
        offset=offset,
        paginated=paginated,
        args=args,
    )

    return CallToolResult(
        content=[TextContent(type="text", text=text)],
        structuredContent=structured
    )


@mcp.tool()
def get_issue(
    issue_id: Annotated[str, Field(description="Issue key (e.g., 'PROJ-123') or numeric ID")],
    fields: Annotated[tuple[str, ...], Field(description="Optional response fields to include in structured data. Omit for the default compact issue fields.")] = (),
    full: Annotated[bool, Field(description="Set true only when the compact issue fields are insufficient and raw Backlog fields are needed.")] = False,
) -> CallToolResult:
    """Get one Backlog issue by key or numeric ID.

    Use when the user names a specific Backlog issue and you need its current details.
    Do not use when you need to discover multiple issues; use get_issues instead.
    """
    return _invoke(["issue", "get", issue_id], full=full, fields=fields)


@mcp.tool()
def get_issues(
    project: Annotated[str, Field(description="Project key (e.g., 'PRJ'). Omit or pass an empty string to use the configured default project.")] = "",
    query: Annotated[str, Field(description="Search keyword for issue summary or description. Omit or pass an empty string for no keyword filter.")] = "",
    issue_types: Annotated[tuple[str, ...], Field(description="Issue type names to include, e.g. ('Bug', 'Story'). Omit for all issue types.")] = (),
    include_closed: Annotated[bool, Field(description="Set true to include Closed issues; false returns open issues only.")] = False,
    view: Annotated[IssueView, Field(description="Structured presentation: compact for general triage, story for deadline fields.")] = "compact",
    limit: Annotated[int, Field(description="Maximum issues to return, from 1 to 100.", ge=1, le=100)] = 50,
    offset: Annotated[int, Field(description="Zero-based issue offset for pagination.", ge=0)] = 0,
    sort: Annotated[IssueSortOrDefault, Field(description="Backlog issue sort field, e.g. updated, dueDate, priority. Omit for Backlog default ordering.")] = "",
    order: Annotated[SortOrderOrDefault, Field(description="Sort order: asc or desc. Omit for Backlog default ordering.")] = "",
    fields: Annotated[tuple[str, ...], Field(description="Optional response fields for each issue in structured data. Omit for the default compact fields.")] = (),
    full: Annotated[bool, Field(description="Set true only when compact issue fields are insufficient and raw Backlog fields are needed.")] = False,
) -> CallToolResult:
    """List issues assigned to the configured user in one project.

    Use when you need a paginated, filterable issue search across types.
    Do not use when the user asks specifically for open personal bugs; use get_my_open_bugs.
    """
    args = ["issue", "list"]
    _append_list_controls(args, limit=limit, offset=offset, sort=sort, order=order)
    _append(args, "--project", project)
    _append(args, "--query", query)
    _append_many(args, "--type", issue_types)
    _append(args, "--view", view)
    if include_closed:
        args.append("--all")
    return _invoke(args, list_key="issues", full=full, fields=fields, limit=limit, offset=offset, paginated=True)


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
    custom_fields: dict[str, str] | None,
) -> None:
    _append(args, "--desc", description)
    _append(args, "--priority", priority)
    _append(args, "--assignee", assignee)
    _append(args, "--category", category)
    _append(args, "--start-date", start_date)
    _append(args, "--due-date", due_date)
    _append(args, "--estimated-hours", estimated_hours)
    _append(args, "--actual-hours", actual_hours)
    _append_custom_fields(args, custom_fields)


@mcp.tool()
def create_issue(
    summary: Annotated[str, Field(description="Issue summary title")],
    project: Annotated[str, Field(description="Project key (e.g., 'PRJ'). Omit or pass an empty string to use the configured default project.")] = "",
    issue_type: Annotated[str, Field(description="Issue type name or ID (e.g., 'Bug', 'Task', 'Story'). Required by Backlog for creation.")] = "",
    parent: Annotated[str, Field(description="Parent issue key (e.g., 'PRJ-123'). Omit or pass an empty string for no parent.")] = "",
    description: Annotated[str, Field(description="Issue description detail text. Omit or pass an empty string for no description.")] = "",
    priority: Annotated[str, Field(description="Priority name or ID (e.g., 'High', 'Normal', 'Low'). Omit for project default.")] = "",
    assignee: Annotated[str, Field(description="Assignee user reference from config.users or raw user ID. Omit for project default.")] = "",
    category: Annotated[str, Field(description="Category name or ID. Omit for no category.")] = "",
    start_date: Annotated[str, Field(description="Start date in YYYY-MM-DD format. Omit for no start date.")] = "",
    due_date: Annotated[str, Field(description="Due date in YYYY-MM-DD format. Omit for no due date.")] = "",
    estimated_hours: Annotated[float | None, Field(description="Estimated hours. Omit when unknown.")] = None,
    actual_hours: Annotated[float | None, Field(description="Actual hours. Omit when unknown.")] = None,
    custom_fields: Annotated[dict[str, str], Field(description="Custom field values keyed by configured custom field key, e.g. {'qc_activity':'Unit Test'}.")] = {},
    mode: Annotated[MutationMode, Field(description="preview returns a dry-run payload; apply writes the issue to Backlog.")] = "preview",
) -> CallToolResult:
    """Create or preview creation of a Backlog issue.

    Use when the user asks to create a generic Backlog issue and has supplied the issue type.
    Do not use when the user asks for the opinionated Unit Test bug workflow; use create_ut_bug.
    """
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
    if mode == "apply":
        args.append("--apply")
    return _invoke(args)


@mcp.tool()
def update_issue(
    issue_id: Annotated[str, Field(description="Issue key (e.g., 'PROJ-123') or numeric ID")],
    project: Annotated[str, Field(description="Project key (e.g., 'PRJ'). Omit or pass an empty string to infer from issue key/default project.")] = "",
    summary: Annotated[str, Field(description="New issue summary title. Omit or pass an empty string to keep current summary.")] = "",
    status: Annotated[str, Field(description="Status name or ID to transition to. Omit to keep current status.")] = "",
    comment: Annotated[str, Field(description="Comment text to add to the update. Omit for no comment.")] = "",
    description: Annotated[str, Field(description="New description detail text. Omit to keep current description.")] = "",
    priority: Annotated[str, Field(description="New priority name or ID. Omit to keep current priority.")] = "",
    assignee: Annotated[str, Field(description="New assignee user reference or raw user ID. Omit to keep current assignee.")] = "",
    category: Annotated[str, Field(description="New category name or ID. Omit to keep current categories.")] = "",
    start_date: Annotated[str, Field(description="New start date in YYYY-MM-DD format. Omit to keep current start date.")] = "",
    due_date: Annotated[str, Field(description="New due date in YYYY-MM-DD format. Omit to keep current due date.")] = "",
    estimated_hours: Annotated[float | None, Field(description="New estimated hours. Omit to keep current value.")] = None,
    actual_hours: Annotated[float | None, Field(description="New actual hours. Omit to keep current value.")] = None,
    custom_fields: Annotated[dict[str, str], Field(description="Custom field updates keyed by configured custom field key.")] = {},
    mode: Annotated[MutationMode, Field(description="preview returns a dry-run payload; apply writes the update to Backlog.")] = "preview",
) -> CallToolResult:
    """Update or preview update of a Backlog issue.

    Use when the user asks to change fields on an existing issue.
    Do not use when the user asks to complete the bug resolution workflow; use resolve_bug.
    """
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
    if mode == "apply":
        args.append("--apply")
    return _invoke(args)


@mcp.tool()
def get_my_open_bugs(
    project: Annotated[str, Field(description="Project key (e.g., 'PRJ'). Omit or pass an empty string to use the configured default project.")] = "",
    query: Annotated[str, Field(description="Search keyword for bug summary or description. Omit or pass an empty string for no keyword filter.")] = "",
    limit: Annotated[int, Field(description="Maximum bugs to return, from 1 to 100.", ge=1, le=100)] = 50,
    offset: Annotated[int, Field(description="Zero-based issue offset for pagination.", ge=0)] = 0,
    sort: Annotated[IssueSortOrDefault, Field(description="Backlog issue sort field, e.g. updated, dueDate, priority. Omit for Backlog default ordering.")] = "",
    order: Annotated[SortOrderOrDefault, Field(description="Sort order: asc or desc. Omit for Backlog default ordering.")] = "",
    fields: Annotated[tuple[str, ...], Field(description="Optional response fields for each bug in structured data. Omit for the default compact fields.")] = (),
    full: Annotated[bool, Field(description="Set true only when compact bug fields are insufficient and raw Backlog fields are needed.")] = False,
) -> CallToolResult:
    """List open bugs assigned to the configured user in one project.

    Use when the user asks for their current open bugs or bug triage queue.
    Do not use for generic issue search across issue types; use get_issues.
    """
    args = ["bug", "list"]
    _append_list_controls(args, limit=limit, offset=offset, sort=sort, order=order)
    _append(args, "--project", project)
    _append(args, "--query", query)
    return _invoke(args, list_key="bugs", full=full, fields=fields, limit=limit, offset=offset, paginated=True)


@mcp.tool()
def get_bug_context(
    issue_key: Annotated[str, Field(description="Bug issue key (e.g., 'PRJ-123') to analyze")]
) -> CallToolResult:
    """Get structured bug context, including current assignee and reporter.

    Use when preparing to resolve or discuss a specific bug.
    Do not use for listing bugs; use get_my_open_bugs.
    """
    return _invoke(["bug", "context", issue_key])


@mcp.tool()
def resolve_bug(
    issue_key: Annotated[str, Field(description="Bug issue key to resolve (e.g., 'PRJ-123')")],
    status: Annotated[str, Field(description="Target status name or ID. Omit to use the configured resolved/closed status.")] = "",
    actual_hours: Annotated[float | None, Field(description="Actual hours spent fixing the bug. Omit when unknown.")] = None,
    estimated_hours: Annotated[float | None, Field(description="Estimated hours. Omit when unknown.")] = None,
    qc_activity: Annotated[str, Field(description="Quality control activity name where bug was found, e.g. 'Unit Test'.")] = "",
    cause_category: Annotated[str, Field(description="Cause category name, e.g. 'COD_Coding Logic'.")] = "",
    bug_origin: Annotated[str, Field(description="Bug origin category name.")] = "",
    impacted: Annotated[str, Field(description="Impacted component/module name.")] = "",
    resolution: Annotated[str, Field(description="Resolution details or type.")] = "",
    comment: Annotated[str, Field(description="Resolve comment text.")] = "",
    commit: Annotated[str, Field(description="Git commit hash/ref related to the fix.")] = "",
    fix_description: Annotated[str, Field(description="Corrective action or fix description text.")] = "",
    mode: Annotated[MutationMode, Field(description="preview returns a dry-run payload; apply transitions the bug in Backlog.")] = "preview",
) -> CallToolResult:
    """Resolve or preview resolution of a bug with workflow defaults.

    Use when the user asks to resolve/close a bug and wants project workflow fields filled.
    Do not use for generic issue updates unrelated to bug resolution; use update_issue.
    """
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
    if mode == "apply":
        args.append("--apply")
    return _invoke(args)


@mcp.tool()
def create_ut_bug(
    parent_key: Annotated[str, Field(description="Parent issue key (e.g., 'PRJ-123') to attach the UT bug to")],
    module: Annotated[str, Field(description="Name of the module or file with the failing unit test")],
    description: Annotated[str, Field(description="Unit test failure description details")],
    project: Annotated[str, Field(description="Project key (e.g., 'PRJ'). Omit or pass an empty string to use the configured default project.")] = "",
    mode: Annotated[MutationMode, Field(description="preview returns a dry-run payload; apply creates the Unit Test bug in Backlog.")] = "preview",
) -> CallToolResult:
    """Create or preview a Unit Test sub-task bug under a parent issue.

    Use when the user asks to create a UT bug with the configured workflow defaults.
    Do not use for generic bugs or tasks; use create_issue.
    """
    args = ["bug", "create-ut", parent_key, module, description]
    _append(args, "--project", project)
    if mode == "apply":
        args.append("--apply")
    return _invoke(args)


@mcp.tool()
def get_bug_rules(
    project: Annotated[str, Field(description="Project key (e.g., 'PRJ'). Omit or pass an empty string to use the configured default project.")] = ""
) -> CallToolResult:
    """Get current resolve-bug workflow rules for one project.

    Use when preparing a bug resolution and you need required workflow defaults.
    Do not use for issue data; use get_bug_context or get_issue.
    """
    args = ["bug", "rules"]
    _append(args, "--project", project)
    return _invoke(args)


@mcp.tool()
def get_bug_fields(
    field: Annotated[str, Field(description="Field name to get guidance for, e.g. qc_activity, bug_origin, cause_category. Omit for all fields.")] = "",
    project: Annotated[str, Field(description="Project key (e.g., 'PRJ'). Omit or pass an empty string to use the configured default project.")] = "",
) -> CallToolResult:
    """Get configured guidance for bug workflow fields.

    Use when you need allowed values or guidance for resolve_bug fields.
    Do not use to update an issue; use resolve_bug or update_issue.
    """
    args = ["bug", "fields"]
    if field:
        args.append(field)
    _append(args, "--project", project)
    return _invoke(args)


@mcp.tool()
def get_story_overview(
    project: Annotated[str, Field(description="Project key (e.g., 'PRJ'). Omit or pass an empty string to use the configured default project.")] = "",
    query: Annotated[str, Field(description="Search keyword for story/task summary or description. Omit or pass an empty string for no keyword filter.")] = "",
    limit: Annotated[int, Field(description="Maximum stories/tasks to return, from 1 to 100.", ge=1, le=100)] = 50,
    offset: Annotated[int, Field(description="Zero-based issue offset for pagination.", ge=0)] = 0,
    sort: Annotated[IssueSortOrDefault, Field(description="Backlog issue sort field, e.g. dueDate, updated, priority. Omit for Backlog default ordering.")] = "",
    order: Annotated[SortOrderOrDefault, Field(description="Sort order: asc or desc. Omit for Backlog default ordering.")] = "",
    fields: Annotated[tuple[str, ...], Field(description="Optional response fields for each story/task in structured data. Omit for workflow default fields.")] = (),
) -> CallToolResult:
    """Get Story and Task deadlines assigned to the configured user.

    Use when the user asks for assigned stories/tasks, due dates, or project status.
    Do not use for generic issue search or bug triage; use get_issues or get_my_open_bugs.
    """
    args = ["story", "overview"]
    _append_list_controls(args, limit=limit, offset=offset, sort=sort, order=order)
    _append(args, "--project", project)
    _append(args, "--query", query)
    return _invoke(args, list_key="stories", fields=fields, limit=limit, offset=offset, paginated=True)


@mcp.tool()
def list_configured_projects() -> CallToolResult:
    """List configured Backlog projects without querying every project.

    Use when choosing or confirming a project key.
    Do not use to fetch live project metadata; use inspect_project for one explicit project.
    """
    return _invoke(["config", "list-projects"], list_key="projects")


@mcp.tool()
def get_config() -> CallToolResult:
    """Get local Backlog configuration settings with credentials excluded.

    Use when diagnosing local MCP configuration or defaults.
    Do not use to retrieve secrets; credentials are intentionally excluded.
    """
    return _invoke(["config", "show"])


@mcp.tool()
def audit_config_workflows() -> CallToolResult:
    """Validate workflow config, policies, and project catalogs for drift.

    Use when configuration behavior looks wrong or before relying on workflow defaults.
    Do not use for issue search or project status summaries.
    """
    return _invoke(["config", "audit-workflows"])


@mcp.tool()
def inspect_project(
    project_key: Annotated[str, Field(description="Project key to inspect (e.g., 'PRJ')")],
    mode: Annotated[Literal["read", "refresh_catalog"], Field(description="read fetches metadata without writing; refresh_catalog writes the local project catalog.")] = "read",
) -> CallToolResult:
    """Fetch project metadata or refresh one local project catalog.

    Use when the user names one project and needs its metadata or catalog refreshed.
    Do not use to enumerate every project; use list_configured_projects.
    """
    args = ["project", "inspect", project_key]
    if mode == "read":
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
        f"4. Propose a resolve action using `resolve_bug` with mode='preview'.\n"
        f"5. Once I review the assignment changes and dry-run output, apply the resolution with mode='apply'."
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
        f"2. Draft the UT bug details and use `create_ut_bug` with mode='preview' to dry-run and preview the payload.\n"
        f"3. After I confirm, execute `create_ut_bug` with mode='apply' to create the task on Backlog."
    )


@mcp.prompt()
def project_status_prompt(
    project: Annotated[str, Field(description="Project key. Omit or pass an empty string to use the configured default project.")] = ""
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


@mcp.resource(
    "backlog://config",
    mime_type="application/json",
    meta={"kind": "config", "scope": "workstation"},
)
def config_resource() -> str:
    """Read the workstation-wide Backlog configuration as JSON."""
    return json.dumps(load_config(), indent=2, ensure_ascii=False)


@mcp.resource(
    "backlog://metrics",
    mime_type="application/json",
    meta={"kind": "metrics", "scope": "workstation"},
)
def metrics_resource() -> str:
    """Read aggregated local MCP usage metrics as JSON."""
    return json.dumps(summarize_metrics(), indent=2, ensure_ascii=False)


@mcp.resource(
    "backlog://issue/{issue_key}",
    mime_type="application/json",
    meta={"kind": "issue", "scope": "project"},
)
def issue_resource(issue_key: str) -> str:
    """Read one Backlog issue as JSON by issue key."""
    result = _invoke(["issue", "get", issue_key], full=True)
    return json.dumps(result.structuredContent, indent=2, ensure_ascii=False)


def main() -> None:
    """Run the workstation-local server over stdio."""
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
