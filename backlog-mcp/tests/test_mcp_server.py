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


def test_create_issue_is_dry_run_by_default():
    expected_result = CallToolResult(
        content=[TextContent(type="text", text="dryRun")],
        structuredContent={"dryRun": True}
    )
    with mock.patch.object(server, "_invoke", return_value=expected_result) as invoke:
        result = server.create_issue("Summary", issue_type="Bug")

    assert result == expected_result
    args = invoke.call_args.args[0]
    assert args[:3] == ["issue", "create", "Summary"]
    assert "--issue-type" in args
    assert "--apply" not in args


def test_resolve_bug_requires_explicit_apply():
    expected_result = CallToolResult(
        content=[TextContent(type="text", text="{}")],
        structuredContent={}
    )
    with mock.patch.object(server, "_invoke", return_value=expected_result) as invoke:
        server.resolve_bug("AQM-1", mode="apply")

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
            project="AQM",
            query="payment",
            issue_types=("Bug",),
            limit=25,
            offset=50,
            sort="updated",
            order="desc",
            fields=("issueKey", "summary"),
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
    assert kwargs["fields"] == ("issueKey", "summary")
    assert kwargs["paginated"] is True


def test_invoke_returns_stable_success_envelope_with_pagination():
    command_result = SimpleNamespace(
        data=[{"issueKey": "AQM-1", "summary": "Fix it", "status": "Open"}],
        text='[{"issueKey":"AQM-1"}]',
    )
    with mock.patch.object(server, "execute", return_value=command_result):
        result = server._invoke(
            ["issue", "list", "--limit", "1", "--offset", "0"],
            list_key="issues",
            fields=("issueKey", "summary"),
            limit=1,
            offset=0,
            paginated=True,
        )

    assert result.isError is False
    assert result.structuredContent == {
        "ok": True,
        "data": {"issues": [{"issueKey": "AQM-1", "summary": "Fix it"}]},
        "metadata": {
            "command": "issue:list",
            "full": False,
            "fields": ["issueKey", "summary"],
            "resourceUris": ["backlog://issue/AQM-1"],
        },
        "pagination": {
            "limit": 1,
            "offset": 0,
            "returned": 1,
            "hasMore": True,
            "nextOffset": 1,
        },
        "error": {"code": "", "message": "", "details": {}},
    }


def test_invoke_returns_structured_error_without_raising():
    with mock.patch.object(server, "execute", side_effect=ValueError("bad field")):
        result = server._invoke(["issue", "update", "AQM-1"])

    assert result.isError is True
    assert result.structuredContent["ok"] is False
    assert result.structuredContent["error"]["code"] == "ValueError"
    assert result.structuredContent["error"]["message"] == "bad field"


def test_tool_schema_exposes_enums_and_use_when_descriptions():
    async def load_tools():
        return await server.mcp.list_tools()

    tools = {tool.name: tool for tool in anyio.run(load_tools)}
    get_issues = tools["get_issues"]
    create_issue = tools["create_issue"]

    assert "Use when" in get_issues.description
    assert "Do not use" in get_issues.description
    assert get_issues.inputSchema["properties"]["view"]["enum"] == ["compact", "story"]
    assert create_issue.inputSchema["properties"]["mode"]["enum"] == ["preview", "apply"]
    assert create_issue.inputSchema["properties"]["project"]["default"] == ""


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


