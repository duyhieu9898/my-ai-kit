#!/usr/bin/env python3
"""Shared warning-only Harness context and safety policy."""

from __future__ import annotations

import re
from typing import Any, Iterable


HARNESS_DOCS = {
    "README.md",
    "docs/HARNESS.md",
    "docs/FEATURE_INTAKE.md",
    "docs/ARCHITECTURE.md",
    "docs/CONTEXT_RULES.md",
    "docs/TRACE_SPEC.md",
    "docs/TEST_MATRIX.md",
    "docs/HARNESS_COMPONENTS.md",
    "docs/HARNESS_MATURITY.md",
    "docs/HARNESS_BACKLOG.md",
}

HIGH_RISK_PATHS = (
    "scripts/schema/",
    "docs/decisions/",
    "docs/templates/high-risk-story/",
    "crates/harness-cli/",
)

HIGH_RISK_TERMS = (
    "auth",
    "authorization",
    "migration",
    "migrate",
    "schema",
    "token",
    "secret",
    "provider",
    "webhook",
    "payment",
)

SECRET_PATTERNS = (
    re.compile(r"\b[A-Za-z_]*(API|TOKEN|SECRET|PASSWORD|PRIVATE)[A-Za-z_]*\b", re.I),
    re.compile(r"\.env(\.|$|\s)"),
)

COMMAND_KEYS = {
    "args",
    "arguments",
    "cmd",
    "command",
    "commandline",
    "input",
    "params",
    "patch",
    "script",
    "tool_args",
    "tool_input",
}

SHELL_TOOL_NAMES = {
    "bash",
    "exec_command",
    "functions.exec_command",
    "run_command",
    "run_shell_command",
    "shell",
}

FILE_READ_TOOL_NAMES = {
    "read_file",
    "view_file",
}

FILE_EDIT_TOOL_NAMES = {
    "apply_patch",
    "delete_file",
    "edit",
    "multi_replace_file_content",
    "replace_file_content",
    "write",
    "write_file",
    "write_to_file",
}

PATH_KEYS = {
    "absolutepath",
    "file",
    "file_path",
    "filepath",
    "path",
}


def evaluate(event: str, payload: Any) -> list[str]:
    """Return warnings for a normalized pre-tool or post-tool event."""
    text = extract_relevant_text(payload)
    tool_name = find_tool_name(payload).lower()

    warnings: list[str] = []
    if event == "pre-tool":
        warnings.extend(check_destructive_or_secret_command(text))
        if tool_name in FILE_READ_TOOL_NAMES:
            warnings.extend(check_sensitive_native_read(text))
        if tool_name in FILE_EDIT_TOOL_NAMES:
            warnings.extend(check_high_risk_edit(text))
    elif event == "post-tool":
        warnings.extend(check_broad_context_read(text, payload, tool_name))

    return dedupe(warnings)


def extract_strings(value: Any) -> Iterable[str]:
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for key, item in value.items():
            yield str(key)
            yield from extract_strings(item)
    elif isinstance(value, list):
        for item in value:
            yield from extract_strings(item)
    elif value is not None:
        yield str(value)


def extract_relevant_text(payload: Any) -> str:
    command_parts = list(extract_command_strings(payload))
    if command_parts:
        return "\n".join(command_parts)
    return "\n".join(extract_strings(payload))


def extract_command_strings(value: Any, *, in_command_field: bool = False) -> Iterable[str]:
    if isinstance(value, str):
        if in_command_field:
            yield value
    elif isinstance(value, dict):
        for key, item in value.items():
            key_is_command = str(key).lower() in COMMAND_KEYS
            yield from extract_command_strings(
                item,
                in_command_field=in_command_field or key_is_command,
            )
    elif isinstance(value, list):
        for item in value:
            yield from extract_command_strings(item, in_command_field=in_command_field)


def find_tool_name(value: Any) -> str:
    if not isinstance(value, dict):
        return ""
    for key in ("tool", "tool_name", "name"):
        item = value.get(key)
        if isinstance(item, str):
            return item
    for item in value.values():
        if isinstance(item, dict):
            nested = find_tool_name(item)
            if nested:
                return nested
    return ""


def check_destructive_or_secret_command(text: str) -> list[str]:
    warnings: list[str] = []
    destructive = (
        r"\brm\s+-[A-Za-z]*r[A-Za-z]*f[A-Za-z]*\b",
        r"\brm\s+-[A-Za-z]*f[A-Za-z]*r[A-Za-z]*\b",
        r"\bgit\s+reset\s+--hard\b",
        r"\bgit\s+checkout\s+--(?:\s|$)",
        r"\bgit\s+clean\s+-",
    )
    if any(re.search(pattern, text) for pattern in destructive):
        warnings.append(
            "Destructive command pattern detected. Confirm the user explicitly requested it before proceeding."
        )

    if ("cat " in text or "sed " in text or "rg " in text) and any(
        pattern.search(text) for pattern in SECRET_PATTERNS
    ):
        warnings.append(
            "Possible secret-bearing file or variable read detected. Avoid exposing credentials in the conversation."
        )

    return warnings


def check_high_risk_edit(text: str) -> list[str]:
    lower = text.lower()
    touches_high_risk_path = any(path in text for path in HIGH_RISK_PATHS)
    touches_high_risk_term = any(term in lower for term in HIGH_RISK_TERMS)
    if touches_high_risk_path or touches_high_risk_term:
        return [
            "Potential high-risk surface detected. Re-check FEATURE_INTAKE risk flags and read the relevant high-risk context before editing."
        ]
    return []


def check_sensitive_native_read(text: str) -> list[str]:
    if any(pattern.search(text) for pattern in SECRET_PATTERNS):
        return [
            "Possible secret-bearing file or variable read detected. Avoid exposing credentials in the conversation."
        ]
    return []


def check_broad_context_read(text: str, payload: Any, tool_name: str) -> list[str]:
    warnings: list[str] = []
    normalized_text = normalize_paths(text)
    docs_read = [doc for doc in HARNESS_DOCS if doc in normalized_text]
    content_read_docs = [doc for doc in docs_read if reads_file_content(normalized_text, doc)]

    native_read = native_file_read(payload) if tool_name in FILE_READ_TOOL_NAMES else None
    if native_read:
        path, start, end = native_read
        normalized_path = normalize_paths(path)
        native_doc = next((doc for doc in HARNESS_DOCS if doc in normalized_path), None)
        if native_doc and (start is None or end is None or end - start + 1 > 180):
            content_read_docs.append(native_doc)
            docs_read.append(native_doc)

    if len(set(docs_read)) >= 4 and content_read_docs:
        warnings.append(
            "Bulk Harness document read detected. For tiny/question work, prefer AGENTS.md, FEATURE_INTAKE, matrix, and targeted rg/sed sections."
        )

    for doc in dedupe(content_read_docs):
        warnings.append(
            f"Large read of {doc} detected. Use the smallest section that answers the current phase/lane question."
        )

    return warnings


def native_file_read(payload: Any) -> tuple[str, int | None, int | None] | None:
    args = find_mapping(payload, ("tool_args", "tool_input", "arguments", "args"))
    if not args:
        return None

    normalized = {str(key).lower(): value for key, value in args.items()}
    path = next(
        (value for key, value in normalized.items() if key in PATH_KEYS and isinstance(value, str)),
        None,
    )
    if not path:
        return None

    start = parse_int(normalized.get("startline") or normalized.get("start_line"))
    end = parse_int(normalized.get("endline") or normalized.get("end_line"))
    return path, start, end


def find_mapping(value: Any, keys: tuple[str, ...]) -> dict[str, Any] | None:
    if not isinstance(value, dict):
        return None
    for key in keys:
        item = value.get(key)
        if isinstance(item, dict):
            return item
    for item in value.values():
        if isinstance(item, dict):
            nested = find_mapping(item, keys)
            if nested:
                return nested
    return None


def parse_int(value: Any) -> int | None:
    if isinstance(value, int):
        return value
    if isinstance(value, str) and value.isdigit():
        return int(value)
    return None


def reads_file_content(text: str, doc: str) -> bool:
    return reads_entire_file(text, doc) or reads_large_range(text, doc)


def reads_entire_file(text: str, doc: str) -> bool:
    escaped = re.escape(doc)
    return bool(re.search(rf"\b(cat|less|more|head|tail|nl)\s+(?:-[^\s]+\s+)*{escaped}\b", text))


def reads_large_range(text: str, doc: str) -> bool:
    escaped = re.escape(doc)
    for match in re.finditer(rf"sed\s+-n\s+['\"]?(\d+),(\d+)p['\"]?\s+{escaped}\b", text):
        start = int(match.group(1))
        end = int(match.group(2))
        if end - start + 1 > 180:
            return True
    return False


def normalize_paths(text: str) -> str:
    return re.sub(r"(?<!\S)\./", "", text)


def dedupe(items: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result
