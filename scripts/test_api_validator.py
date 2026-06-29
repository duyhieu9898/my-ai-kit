#!/usr/bin/env python3
"""Regression tests for both shipped API validator copies."""

import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
VALIDATORS = (
    ROOT / "templates/.agents/skills/api-patterns/scripts/api_validator.py",
    ROOT / "templates/.agents/gemini/skills/api-patterns/scripts/api_validator.py",
)


def load_validator(path: Path):
    spec = importlib.util.spec_from_file_location(f"api_validator_{path.parts[-5]}", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


class ApiValidatorTests(unittest.TestCase):
    def test_validator_copies_match(self):
        self.assertEqual(VALIDATORS[0].read_text(), VALIDATORS[1].read_text())

    def test_valid_openapi_passes_for_both_targets(self):
        document = {
            "openapi": "3.1.0",
            "info": {"title": "Example", "version": "1.0.0"},
            "paths": {
                "/users": {
                    "get": {
                        "summary": "List users",
                        "responses": {"200": {"description": "OK"}},
                    }
                }
            },
        }
        for validator in VALIDATORS:
            with self.subTest(validator=validator):
                completed = self.run_validator(validator, {"openapi.json": json.dumps(document)})
                self.assertEqual(completed.returncode, 0, completed.stderr + completed.stdout)

    def test_invalid_openapi_fails_for_both_targets(self):
        for validator in VALIDATORS:
            with self.subTest(validator=validator):
                completed = self.run_validator(validator, {"openapi.json": "{}"})
                self.assertEqual(completed.returncode, 1)
                self.assertIn("OpenAPI/Swagger version missing", completed.stdout)
                self.assertIn("Paths section missing or invalid", completed.stdout)

    def test_missing_and_empty_targets_fail(self):
        for validator in VALIDATORS:
            with self.subTest(validator=validator):
                missing = subprocess.run(
                    [sys.executable, str(validator), "/definitely/missing/api-validator-target"],
                    capture_output=True,
                    text=True,
                    check=False,
                )
                self.assertEqual(missing.returncode, 2)

                empty = self.run_validator(validator, {})
                self.assertEqual(empty.returncode, 2)
                self.assertIn("No API source or OpenAPI files found", empty.stderr)

    def test_file_discovery_excludes_tests_and_unrelated_api_names(self):
        for validator in VALIDATORS:
            module = load_validator(validator)
            with self.subTest(validator=validator), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                self.write_files(
                    root,
                    {
                        "src/routes/users.py": "def list_users(): pass",
                        "tests/routes/test_users.py": "def test_users(): pass",
                        "src/happy_api_client.py": "class Client: pass",
                    },
                )
                found = [path.relative_to(root).as_posix() for path in module.find_api_files(root)]
                self.assertEqual(found, ["src/routes/users.py"])

    @staticmethod
    def write_files(root: Path, files: dict[str, str]) -> None:
        for relative_path, content in files.items():
            path = root / relative_path
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")

    def run_validator(self, validator: Path, files: dict[str, str]) -> subprocess.CompletedProcess:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.write_files(root, files)
            return subprocess.run(
                [sys.executable, str(validator), str(root)],
                capture_output=True,
                text=True,
                check=False,
            )


if __name__ == "__main__":
    unittest.main()
