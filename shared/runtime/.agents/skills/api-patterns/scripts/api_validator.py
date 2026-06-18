#!/usr/bin/env python3
"""Run lightweight structural checks on API source and OpenAPI documents."""

import argparse
import json
import re
import sys
from pathlib import Path


SOURCE_SUFFIXES = (".ts", ".js", ".py")
SOURCE_PATTERNS = (
    "**/api.ts",
    "**/api.js",
    "**/api.py",
    "**/*.api.ts",
    "**/*.api.js",
    "**/*_api.py",
    "**/route.ts",
    "**/route.js",
)
SOURCE_DIRECTORIES = ("api", "routes", "controllers", "endpoints")
SPEC_PATTERNS = (
    "**/*.openapi.json",
    "**/*.openapi.yaml",
    "**/*.openapi.yml",
    "**/openapi.json",
    "**/openapi.yaml",
    "**/openapi.yml",
    "**/swagger.json",
    "**/swagger.yaml",
    "**/swagger.yml",
)
EXCLUDED_PARTS = {
    ".git",
    ".next",
    ".venv",
    "__pycache__",
    "build",
    "coverage",
    "dist",
    "node_modules",
    "test",
    "tests",
    "vendor",
}
HTTP_METHODS = {"get", "post", "put", "patch", "delete", "options", "head", "trace"}


def is_excluded(path: Path) -> bool:
    """Return whether a path belongs to a non-production or generated area."""
    return any(part.lower() in EXCLUDED_PARTS for part in path.parts)


def find_api_files(project_path: Path) -> list[Path]:
    """Find likely API implementation files and OpenAPI documents."""
    candidates: set[Path] = set()

    for pattern in SOURCE_PATTERNS + SPEC_PATTERNS:
        candidates.update(project_path.glob(pattern))

    for directory_name in SOURCE_DIRECTORIES:
        for directory in project_path.glob(f"**/{directory_name}"):
            if directory.is_dir() and not is_excluded(directory):
                for suffix in SOURCE_SUFFIXES:
                    candidates.update(directory.rglob(f"*{suffix}"))

    this_file = Path(__file__).resolve()
    return sorted(
        path
        for path in candidates
        if path.is_file()
        and not is_excluded(path.relative_to(project_path))
        and path.resolve() != this_file
    )


def result(file_path: Path, passed: list[str], issues: list[str], kind: str) -> dict:
    """Build a consistent validation result."""
    return {
        "file": str(file_path),
        "passed": passed,
        "issues": issues,
        "type": kind,
    }


def check_openapi_json(file_path: Path, content: str) -> dict:
    """Validate required OpenAPI structure in a JSON document."""
    passed: list[str] = []
    issues: list[str] = []

    try:
        spec = json.loads(content)
    except json.JSONDecodeError as error:
        return result(file_path, passed, [f"[X] Invalid JSON: {error}"], "openapi")

    if not isinstance(spec, dict):
        return result(file_path, passed, ["[X] OpenAPI document must be an object"], "openapi")

    if "openapi" in spec or "swagger" in spec:
        passed.append("[OK] OpenAPI/Swagger version defined")
    else:
        issues.append("[X] OpenAPI/Swagger version missing")

    info = spec.get("info")
    if not isinstance(info, dict):
        issues.append("[X] Info section missing")
    else:
        if info.get("title"):
            passed.append("[OK] API title defined")
        else:
            issues.append("[X] API title missing")
        if info.get("version"):
            passed.append("[OK] API version defined")
        else:
            issues.append("[X] API version missing")
        if not info.get("description"):
            issues.append("[!] API description missing")

    paths = spec.get("paths")
    if not isinstance(paths, dict):
        issues.append("[X] Paths section missing or invalid")
    else:
        passed.append(f"[OK] {len(paths)} paths defined")
        check_operations(paths, passed, issues)

    return result(file_path, passed, issues, "openapi")


def check_openapi_yaml(file_path: Path, content: str) -> dict:
    """Validate required root fields in YAML without adding a YAML dependency."""
    passed: list[str] = []
    issues: list[str] = []

    required_fields = {
        "version": r"^(openapi|swagger)\s*:",
        "info": r"^info\s*:",
        "paths": r"^paths\s*:",
    }
    for field, pattern in required_fields.items():
        if re.search(pattern, content, re.MULTILINE):
            passed.append(f"[OK] {field.capitalize()} section defined")
        else:
            issues.append(f"[X] Required {field} field missing")

    return result(file_path, passed, issues, "openapi")


def check_operations(paths: dict, passed: list[str], issues: list[str]) -> None:
    """Check operation-level documentation and response declarations."""
    for path, path_item in paths.items():
        if not isinstance(path_item, dict):
            issues.append(f"[X] {path}: Path item must be an object")
            continue
        for method, details in path_item.items():
            if method.lower() not in HTTP_METHODS:
                continue
            if not isinstance(details, dict):
                issues.append(f"[X] {method.upper()} {path}: Operation must be an object")
                continue
            if "responses" not in details:
                issues.append(f"[X] {method.upper()} {path}: Responses missing")
            if "summary" not in details and "description" not in details:
                issues.append(f"[!] {method.upper()} {path}: Description missing")


def check_openapi_spec(file_path: Path) -> dict:
    """Check an OpenAPI or Swagger document."""
    try:
        content = file_path.read_text(encoding="utf-8")
    except OSError as error:
        return result(file_path, [], [f"[X] Read error: {error}"], "openapi")

    if file_path.suffix.lower() == ".json":
        return check_openapi_json(file_path, content)
    return check_openapi_yaml(file_path, content)


def check_api_code(file_path: Path) -> dict:
    """Run advisory source checks without assuming a specific framework."""
    try:
        content = file_path.read_text(encoding="utf-8")
    except OSError as error:
        return result(file_path, [], [f"[X] Read error: {error}"], "code")

    passed: list[str] = []
    issues: list[str] = []
    checks = (
        ("Error handling detected", r"try\s*[{:]|\.catch\(|except\s+|catch\s*\("),
        ("HTTP status handling detected", r"\.status\(\s*\d{3}|status_code\s*=\s*\d{3}|HttpStatus\."),
        ("Input validation detected", r"\b(validate|schema|zod|joi|yup|pydantic)\b|@(?:Body|Query)\("),
        ("Authentication/authorization detected", r"\b(auth|jwt|bearer|middleware|guard)\b|@Authenticated"),
        ("Rate limiting detected", r"\b(rate.?limit|throttle)\b"),
    )
    for message, pattern in checks:
        if re.search(pattern, content, re.IGNORECASE):
            passed.append(f"[OK] {message}")

    if not passed:
        issues.append("[!] No common API safeguards detected; review framework-level controls")

    return result(file_path, passed, issues, "code")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("project_path", nargs="?", default=".", help="Project directory to scan")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    project_path = Path(args.project_path).expanduser()

    if not project_path.exists():
        print(f"[X] Target does not exist: {project_path}", file=sys.stderr)
        return 2
    if not project_path.is_dir():
        print(f"[X] Target is not a directory: {project_path}", file=sys.stderr)
        return 2

    api_files = find_api_files(project_path)
    if not api_files:
        print("[X] No API source or OpenAPI files found.", file=sys.stderr)
        return 2

    results = [
        check_openapi_spec(path)
        if "openapi" in path.name.lower() or "swagger" in path.name.lower()
        else check_api_code(path)
        for path in api_files
    ]

    critical_issues = 0
    passed_checks = 0
    for validation in results:
        print(f"\n[FILE] {validation['file']} [{validation['type']}]")
        for item in validation["passed"]:
            print(f"   {item}")
            passed_checks += 1
        for item in validation["issues"]:
            print(f"   {item}")
            critical_issues += item.startswith("[X]")

    print(f"\n[RESULTS] {passed_checks} passed, {critical_issues} critical issues")
    return 1 if critical_issues else 0


if __name__ == "__main__":
    raise SystemExit(main())
