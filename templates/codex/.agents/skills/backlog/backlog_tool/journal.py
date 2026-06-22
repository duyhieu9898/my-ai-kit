#!/usr/bin/env python3
"""Session logger for CLI outputs.

Each CLI run appends one JSONL entry to a date+command file under
logs/sessions/<YYYY-MM-DD>_<command>.jsonl

This gives a durable trace per command per day, easy to compare across runs.
"""
import json
import os
from datetime import datetime, timezone

from .settings import LOG_DIR

SESSIONS_DIR = os.path.join(LOG_DIR, "sessions")


def _now():
    return datetime.now(timezone.utc).astimezone()


def _safe_command(command):
    """Turn 'bug:my-open' into 'bug_my-open' for filename."""
    return command.replace(":", "_").replace("/", "_").replace(" ", "_")


def session_path(command, project=None, ts=None):
    ts = ts or _now()
    date_str = ts.strftime("%Y-%m-%d")
    safe_cmd = _safe_command(command)
    if project:
        safe_project = _safe_command(project)
        return os.path.join(SESSIONS_DIR, safe_project, f"{date_str}_{safe_cmd}.jsonl")
    return os.path.join(SESSIONS_DIR, f"{date_str}_{safe_cmd}.jsonl")


def log_cli(command, cli_output, project=None, issue_key=None):
    """Log a CLI execution. Called automatically by cli.py after each run."""
    ts = _now()
    path = session_path(command, project, ts)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    record = {
        "ts": ts.isoformat(timespec="seconds"),
        "step": "cli",
        "command": command,
        "project": project,
        "issueKey": issue_key,
        "cliOutput": cli_output,
    }
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


def log_ai(command, user_request, ai_response, project=None, issue_key=None):
    """Log an AI interaction. Called by hook after tool use."""
    ts = _now()
    path = session_path(command, project, ts)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    record = {
        "ts": ts.isoformat(timespec="seconds"),
        "step": "ai",
        "command": command,
        "project": project,
        "issueKey": issue_key,
        "userRequest": user_request,
        "aiResponse": ai_response,
    }
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


def list_sessions():
    """List available session files recursively."""
    if not os.path.isdir(SESSIONS_DIR):
        return []
    files = []
    for root, _, filenames in os.walk(SESSIONS_DIR):
        for f in filenames:
            if f.endswith(".jsonl"):
                rel_path = os.path.relpath(os.path.join(root, f), SESSIONS_DIR)
                files.append(rel_path)
    return sorted(files)


def read_session(filename):
    """Read all entries from a session file."""
    path = os.path.join(SESSIONS_DIR, filename)
    if not os.path.exists(path):
        return []
    entries = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return entries
