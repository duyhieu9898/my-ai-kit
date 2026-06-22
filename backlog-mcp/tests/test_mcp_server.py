import os
from unittest import mock

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
        server.resolve_bug("AQM-1", apply=True)

    assert invoke.call_args.args[0][-1] == "--apply"


def test_inspect_project_does_not_write_by_default():
    expected_result = CallToolResult(
        content=[TextContent(type="text", text="{}")],
        structuredContent={}
    )
    with mock.patch.object(server, "_invoke", return_value=expected_result) as invoke:
        server.inspect_project("AQM")

    assert invoke.call_args.args[0] == ["project", "inspect", "AQM", "--stdout"]



