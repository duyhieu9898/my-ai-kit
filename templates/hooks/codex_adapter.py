#!/usr/bin/env python3
"""Codex lifecycle adapter for the shared Harness guard policy."""

from __future__ import annotations

import json
import sys
from typing import Any

from harness_guard import evaluate


def main() -> int:
    event = sys.argv[1] if len(sys.argv) > 1 else "unknown"
    warnings = evaluate(event, read_payload())
    if warnings:
        message = "\n".join(f"[harness-guard] {warning}" for warning in warnings)
        print(json.dumps({"systemMessage": message}))
    return 0


def read_payload() -> Any:
    raw = sys.stdin.read()
    if not raw.strip():
        return {}
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"raw": raw}


if __name__ == "__main__":
    raise SystemExit(main())
