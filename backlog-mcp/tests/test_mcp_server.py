import os
from types import SimpleNamespace
from unittest import mock

import anyio
from mcp.types import CallToolResult, TextContent

from backlog_mcp import server
from backlog_tool import settings


def test_runtime_state_is_rooted_in_local_mcp_directory():
    assert settings.ENV_PATH == os.path.join(settings.MCP_ROOT, ".env")
    assert settings.LOG_DIR == os.path.join(settings.MCP_ROOT, "logs")
    assert settings.CONFIG_PATH == os.path.join(settings.MCP_ROOT, "config", "backlog.json")


def test_create_issue_applies_directly():
    expected_result = CallToolResult(
        content=[TextContent(type="text", text="success")],
        structuredContent={"ok": True}
    )
    with mock.patch.object(server, "_invoke", return_value=expected_result) as invoke:
        result = server.create_issue("Summary", issue_type="Bug")

    assert result == expected_result
    args = invoke.call_args.args[0]
    assert args[:3] == ["issue", "create", "Summary"]
    assert "--issue-type" in args
    assert "--apply" in args


def test_resolve_bug_applies_directly():
    expected_result = CallToolResult(
        content=[TextContent(type="text", text="{}")],
        structuredContent={}
    )
    with mock.patch.object(server, "_invoke", return_value=expected_result) as invoke:
        server.resolve_bug("AQM-1")

    assert invoke.call_args.args[0][-1] == "--apply"


def test_inspect_project_does_not_write_by_default():
    expected_result = CallToolResult(
        content=[TextContent(type="text", text="{}")],
        structuredContent={}
    )
    with mock.patch.object(server, "_invoke", return_value=expected_result) as invoke:
        server.inspect_project("AQM")

    assert invoke.call_args.args[0] == ["project", "inspect", "AQM", "--stdout"]


def test_get_issues_maps_pagination_sort_and_field_selection():
    expected_result = CallToolResult(
        content=[TextContent(type="text", text="issues")],
        structuredContent={"ok": True}
    )
    with mock.patch.object(server, "_invoke", return_value=expected_result) as invoke:
        result = server.get_issues(
            project_key="AQM",
            query="payment",
            issue_types=("Bug",),
            limit=25,
            cursor="50",
            sort="updated",
            order="desc",
        )

    assert result == expected_result
    args = invoke.call_args.args[0]
    kwargs = invoke.call_args.kwargs
    assert args == [
        "issue", "list",
        "--limit", "25",
        "--offset", "50",
        "--sort", "updated",
        "--order", "desc",
        "--project", "AQM",
        "--query", "payment",
        "--type", "Bug",
        "--view", "compact",
    ]
    assert kwargs["paginated"] is True


def test_get_issues_with_invalid_cursor_returns_error():
    result = server.get_issues(cursor="invalid")
    assert result.isError is True
    assert "Invalid cursor format" in result.content[0].text


def test_invoke_returns_stable_success_envelope_with_pagination():
    command_result = SimpleNamespace(
        data=[{"issueKey": "AQM-1", "summary": "Fix it", "status": "Open"}],
        text='[{"issueKey":"AQM-1"}]',
    )
    with mock.patch.object(server, "execute", return_value=command_result):
        result = server._invoke(
            ["issue", "list", "--limit", "1", "--offset", "0"],
            list_key="issues",
            limit=1,
            offset=0,
            paginated=True,
        )

    assert result.isError is False
    assert result.structuredContent == {
        "ok": True,
        "data": {"issues": [{"issueKey": "AQM-1", "summary": "Fix it", "status": "Open"}]},
        "pagination": {
            "limit": 1,
            "nextCursor": "1",
            "hasMore": True,
        },
    }
    assert result.meta == {
        "command": "issue:list",
        "resourceUris": ["backlog://issue/AQM-1"],
    }
    assert "Retrieved 1 items via 'issue:list'." in result.content[0].text


def test_invoke_returns_structured_error_without_raising():
    with mock.patch.object(server, "execute", side_effect=ValueError("bad field")):
        result = server._invoke(["issue", "update", "AQM-1"])

    assert result.isError is True
    assert result.structuredContent is None
    assert "Error: bad field" in result.content[0].text


def test_tool_schema_exposes_enums_and_use_when_descriptions():
    async def load_tools():
        return await server.mcp.list_tools()

    tools = {tool.name: tool for tool in anyio.run(load_tools)}
    get_issues = tools["get_issues"]
    get_issue = tools["get_issue"]
    create_issue = tools["create_issue"]

    assert "Use when" in get_issues.description
    assert "Do not use" in get_issues.description
    assert "view" not in get_issues.inputSchema["properties"]
    assert get_issue.inputSchema["properties"]["view"]["enum"] == ["compact", "full"]
    assert "cursor" in get_issues.inputSchema["properties"]
    assert "offset" not in get_issues.inputSchema["properties"]
    assert get_issues.inputSchema["properties"]["cursor"]["type"] == "string"
    assert "mode" not in create_issue.inputSchema["properties"]
    assert "workspace_path" not in create_issue.inputSchema["properties"]
    assert create_issue.inputSchema["properties"]["project_key"]["default"] == ""


def test_resources_have_json_mime_type_and_issue_template():
    async def load_resources():
        return await server.mcp.list_resources(), await server.mcp.list_resource_templates()

    resources, templates = anyio.run(load_resources)
    resource_by_uri = {str(resource.uri): resource for resource in resources}
    template_by_uri = {template.uriTemplate: template for template in templates}

    assert resource_by_uri["backlog://config"].mimeType == "application/json"
    assert resource_by_uri["backlog://config"].meta == {"kind": "config", "scope": "workstation"}
    assert template_by_uri["backlog://issue/{issue_key}"].mimeType == "application/json"
    assert template_by_uri["backlog://issue/{issue_key}"].meta == {"kind": "issue", "scope": "project"}


def test_to_markdown_formatting():
    # Test formatting list of issues with status
    data_list = [
        {"issueKey": "PROJ-1", "summary": "Fix login issue", "status": "In Progress"},
        {"issueKey": "PROJ-2", "summary": "Design landing page", "status": "Open"}
    ]
    res_list = server._to_markdown(data_list, ["issue", "list"])
    assert "PROJ-1" in res_list
    assert "Fix login issue" in res_list
    assert "[In Progress]" in res_list
    assert "PROJ-2" in res_list
    assert "[Open]" in res_list

    # Test formatting single issue with status
    data_single = {"issueKey": "PROJ-123", "summary": "Database error", "status": "Closed"}
    res_single = server._to_markdown(data_single, ["issue", "get", "PROJ-123"])
    assert "PROJ-123" in res_single
    assert "Database error" in res_single
    assert "[Closed]" in res_single



