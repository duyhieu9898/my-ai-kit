# Backlog Local MCP

One local stdio MCP server serves every project on this workstation. Source,
configuration, credentials, project catalogs, logs, metrics, and session traces
all live under this directory; the AI kit templates do not contain a Backlog
skill.

## Setup

Prerequisites: Python 3.10+ and [uv](https://docs.astral.sh/uv/).

```bash
cd /absolute/path/to/hieund-ai-kit-cli/backlog-mcp
cp .env.example .env
# Set BACKLOG_API_KEY in .env, then install the locked project environment.
uv sync --extra dev
```

This checkout already preserves the local `.env` migrated from the former
skill. Never commit it.

## Register Once

Use the absolute path to this directory. Codex stores user-scoped MCP servers
in `~/.codex/config.toml`, shared by its CLI and IDE extension:

```bash
codex mcp add backlog -- uv --directory /absolute/path/to/hieund-ai-kit-cli/backlog-mcp run backlog-mcp-server
```

Equivalent `config.toml`:

```toml
[mcp_servers.backlog]
command = "uv"
args = [
  "--directory",
  "/absolute/path/to/hieund-ai-kit-cli/backlog-mcp",
  "run",
  "backlog-mcp-server",
]
startup_timeout_sec = 20
tool_timeout_sec = 60
```

For Gemini or another MCP client, register the same stdio command globally:

```json
{
  "command": "uv",
  "args": [
    "--directory",
    "/absolute/path/to/hieund-ai-kit-cli/backlog-mcp",
    "run",
    "backlog-mcp-server"
  ]
}
```

Restart the client after registration. The process is started on demand; no
daemon or remote server is required.

## Safety

- `create_issue`, `update_issue`, `create_ut_bug`, and `resolve_bug` are dry
  runs unless `mode="apply"`.
- `inspect_project` only prints fetched metadata unless `mode="refresh_catalog"`.
- Generic queries use only `config.default_project_key`; tools never loop over
  all projects implicitly.
- API keys and full request URLs containing query strings are never logged.

## Local State

```text
backlog-mcp/
├── .env                 # credential, ignored
├── config/              # shared workstation config and catalogs
└── logs/                # operational logs, metrics, sessions, ignored
```

Historical logs from removed skill copies are retained under `logs/legacy/`.

## Development

```bash
uv run --extra dev pytest
uv run backlog-cli config audit-workflows
uv run backlog-mcp-server
```

The last command speaks MCP over stdio; use an MCP client or Inspector rather
than typing into it manually.
