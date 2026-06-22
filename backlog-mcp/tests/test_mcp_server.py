import os
from unittest import mock

from backlog_mcp import server
from backlog_tool import settings


def test_runtime_state_is_rooted_in_local_mcp_directory():
    assert settings.ENV_PATH == os.path.join(settings.MCP_ROOT, ".env")
    assert settings.LOG_DIR == os.path.join(settings.MCP_ROOT, "logs")
    assert settings.CONFIG_PATH == os.path.join(settings.MCP_ROOT, "config", "backlog.json")


def test_issue_create_is_dry_run_by_default():
    with mock.patch.object(server, "_invoke", return_value={"dryRun": True}) as invoke:
        result = server.issue_create("Summary", issue_type="Bug")

    assert result == {"dryRun": True}
    args = invoke.call_args.args[0]
    assert args[:3] == ["issue", "create", "Summary"]
    assert "--issue-type" in args
    assert "--apply" not in args


def test_bug_resolve_requires_explicit_apply():
    with mock.patch.object(server, "_invoke", return_value={}) as invoke:
        server.bug_resolve("AQM-1", apply=True)

    assert invoke.call_args.args[0][-1] == "--apply"


def test_project_inspect_does_not_write_by_default():
    with mock.patch.object(server, "_invoke", return_value={}) as invoke:
        server.project_inspect("AQM")

    assert invoke.call_args.args[0] == ["project", "inspect", "AQM", "--stdout"]


def test_config_set_default_is_dry_run_by_default():
    config = {"projects": ["AQM", "OOP"], "default_project_key": "AQM"}
    with mock.patch.object(server, "load_config", return_value=config), mock.patch.object(
        server, "_invoke"
    ) as invoke:
        result = server.config_set_default("OOP")

    assert result == {
        "dryRun": True,
        "currentDefaultProjectKey": "AQM",
        "proposedDefaultProjectKey": "OOP",
    }
    invoke.assert_not_called()
