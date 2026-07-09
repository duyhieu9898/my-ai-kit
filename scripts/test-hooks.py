#!/usr/bin/env python3
"""Regression tests for the shared Harness guard and runtime adapters."""

from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CORE_PATH = ROOT / "shared/hooks/harness_guard.py"

spec = importlib.util.spec_from_file_location("harness_guard", CORE_PATH)
assert spec and spec.loader
harness_guard = importlib.util.module_from_spec(spec)
spec.loader.exec_module(harness_guard)


class HarnessGuardTests(unittest.TestCase):
    def test_destructive_codex_command_warns(self) -> None:
        payload = {
            "tool_name": "exec_command",
            "tool_input": {"command": "rm -rf .agents"},
        }
        warnings = harness_guard.evaluate("pre-tool", payload)
        self.assertTrue(any("Destructive command" in warning for warning in warnings))

    def test_destructive_antigravity_command_warns(self) -> None:
        payload = {
            "toolCall": {
                "name": "run_command",
                "args": {"CommandLine": "git reset --hard"},
            },
        }
        warnings = harness_guard.evaluate("pre-tool", payload)
        self.assertTrue(any("Destructive command" in warning for warning in warnings))

    def test_antigravity_large_native_read_warns(self) -> None:
        payload = {
            "toolCall": {
                "name": "view_file",
                "args": {"AbsolutePath": "docs/HARNESS.md"},
            },
        }
        warnings = harness_guard.evaluate("post-tool", payload)
        self.assertTrue(any("Large read of docs/HARNESS.md" in warning for warning in warnings))

    def test_targeted_native_read_does_not_warn(self) -> None:
        payload = {
            "toolCall": {
                "name": "view_file",
                "args": {
                    "AbsolutePath": "docs/HARNESS.md",
                    "StartLine": 10,
                    "EndLine": 40,
                },
            },
        }
        self.assertEqual(harness_guard.evaluate("post-tool", payload), [])

    def test_high_risk_native_read_is_not_misclassified_as_edit(self) -> None:
        payload = {
            "toolCall": {
                "name": "view_file",
                "args": {"AbsolutePath": "scripts/schema/001-init.sql"},
            },
        }
        self.assertEqual(harness_guard.evaluate("pre-tool", payload), [])

    def test_antigravity_secret_file_read_warns(self) -> None:
        payload = {
            "toolCall": {
                "name": "view_file",
                "args": {"AbsolutePath": ".env"},
            },
        }
        warnings = harness_guard.evaluate("pre-tool", payload)
        self.assertTrue(any("secret-bearing" in warning for warning in warnings))

    def test_claude_large_native_read_warns(self) -> None:
        payload = {
            "tool_name": "Read",
            "tool_input": {"file_path": "docs/HARNESS.md"},
        }
        warnings = harness_guard.evaluate("post-tool", payload)
        self.assertTrue(any("Large read of docs/HARNESS.md" in warning for warning in warnings))

    def test_codex_adapter_surfaces_system_message(self) -> None:
        response = run_adapter(
            ROOT / "shared/hooks/codex_adapter.py",
            {"tool_name": "exec_command", "tool_input": {"command": "rm -rf build"}},
        )
        self.assertIn("systemMessage", response)

    def test_gemini_adapter_remains_warning_only(self) -> None:
        response = run_adapter(
            ROOT / "shared/hooks/gemini_adapter.py",
            {
                "toolCall": {
                    "name": "run_command",
                    "args": {"CommandLine": "rm -rf build"},
                },
            },
        )
        self.assertEqual(response["decision"], "allow")
        self.assertIn("reason", response)

    def test_gemini_adapter_warns_on_large_read_before_tool_use(self) -> None:
        response = run_adapter(
            ROOT / "shared/hooks/gemini_adapter.py",
            {
                "toolCall": {
                    "name": "view_file",
                    "args": {"AbsolutePath": "docs/HARNESS.md"},
                },
            },
        )
        self.assertEqual(response["decision"], "allow")
        self.assertIn("Large read of docs/HARNESS.md", response["reason"])

    def test_claude_adapter_injects_warning_context(self) -> None:
        response = run_adapter(
            ROOT / "shared/hooks/claude_adapter.py",
            {
                "hook_event_name": "PreToolUse",
                "tool_name": "Bash",
                "tool_input": {"command": "rm -rf build"},
            },
        )
        output = response["hookSpecificOutput"]
        self.assertEqual(output["hookEventName"], "PreToolUse")
        self.assertIn("Destructive command", output["additionalContext"])


def run_adapter(path: Path, payload: dict[str, object]) -> dict[str, object]:
    result = subprocess.run(
        [sys.executable, str(path), "pre-tool"],
        input=json.dumps(payload),
        text=True,
        capture_output=True,
        check=True,
    )
    return json.loads(result.stdout)


if __name__ == "__main__":
    unittest.main()
