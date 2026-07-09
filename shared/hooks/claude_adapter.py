#!/usr/bin/env python3
"""Claude Code lifecycle adapter for the shared Harness guard policy."""

from __future__ import annotations

import json
import sys
from typing import Any

from harness_guard import evaluate


def main() -> int:
    event = sys.argv[1] if len(sys.argv) > 1 else "unknown"
    payload = read_payload()
    warnings = evaluate(event, payload)
    if warnings:
        hook_event_name = payload.get("hook_event_name") if isinstance(payload, dict) else None
        print(
            json.dumps(
                {
                    "hookSpecificOutput": {
                        "hookEventName": hook_event_name or claude_event_name(event),
                        "additionalContext": "\n".join(
                            f"[harness-guard] {warning}" for warning in warnings
                        ),
                    }
                }
            )
        )
    return 0


def read_payload() -> Any:
    raw = sys.stdin.read()
    if not raw.strip():
        return {}
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"raw": raw}


def claude_event_name(event: str) -> str:
    return {
        "pre-tool": "PreToolUse",
        "post-tool": "PostToolUse",
    }.get(event, event)


if __name__ == "__main__":
    raise SystemExit(main())
