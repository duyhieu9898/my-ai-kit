#!/usr/bin/env python3
"""Regression tests for validators shared by the Codex and Gemini templates."""

import importlib.util
import json
import subprocess
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
TARGETS = ("codex", "gemini")


def script_path(target: str, relative_path: str) -> Path:
    return REPO_ROOT / "templates" / target / ".agents" / "skills" / relative_path


def load_module(target: str, name: str, relative_path: str):
    path = script_path(target, relative_path)
    spec = importlib.util.spec_from_file_location(f"{target}_{name}", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class ValidatorRegressionTests(unittest.TestCase):
    def test_type_coverage_counts_zero_argument_functions_and_safe_paths(self):
        for target in TARGETS:
            with self.subTest(target=target), tempfile.TemporaryDirectory() as temp_dir:
                project = Path(temp_dir) / "build-tools-app"
                source = project / "app" / "page.tsx"
                source.parent.mkdir(parents=True)
                source.write_text(
                    "export default function Page() { return <main>Hello</main> }\n"
                    "const helper = () => 1\n",
                    encoding="utf-8",
                )

                module = load_module(
                    target,
                    "type_coverage",
                    "lint-and-validate/scripts/type_coverage.py",
                )
                result = module.check_typescript_coverage(project)

                self.assertEqual(result["files"], 1)
                self.assertEqual(result["stats"]["untyped_functions"], 2)
                self.assertEqual(result["stats"]["total_functions"], 2)

    def test_ux_audit_loads_project_config_and_scans_css(self):
        for target in TARGETS:
            with self.subTest(target=target), tempfile.TemporaryDirectory() as temp_dir:
                project = Path(temp_dir) / "project"
                config = project / ".agents" / "ux_audit.json"
                stylesheet = project / "app" / "globals.css"
                config.parent.mkdir(parents=True)
                stylesheet.parent.mkdir(parents=True)
                config.write_text(
                    json.dumps({
                        "banned_colors": ["chartreuse"],
                        "max_nav_items": 7,
                        "max_font_families": 3,
                    }),
                    encoding="utf-8",
                )
                stylesheet.write_text(
                    ".hero { color: chartreuse; will-change: width; }\n",
                    encoding="utf-8",
                )

                module = load_module(
                    target,
                    "ux_audit",
                    "frontend-design/scripts/ux_audit.py",
                )
                auditor = module.UXAuditor(project)
                auditor.audit_directory(str(project))
                warnings = "\n".join(auditor.warnings)

                self.assertEqual(auditor.files_checked, 1)
                self.assertIn("Banned color detected ('chartreuse')", warnings)
                self.assertIn("will-change on 'width'", warnings)

                single_file_auditor = module.UXAuditor(
                    module.find_project_root(stylesheet)
                )
                single_file_auditor.audit_file(str(stylesheet))
                self.assertIn(
                    "Banned color detected ('chartreuse')",
                    "\n".join(single_file_auditor.warnings),
                )

    def test_accessibility_checks_each_non_interactive_click_target(self):
        for target in TARGETS:
            with self.subTest(target=target), tempfile.TemporaryDirectory() as temp_dir:
                source = Path(temp_dir) / "card.tsx"
                source.write_text(
                    "export function Card() {\n"
                    "  return <><section onClick={() => open()}>Open</section>"
                    "<div onKeyDown={() => close()}>Other</div></>\n"
                    "}\n",
                    encoding="utf-8",
                )
                module = load_module(
                    target,
                    "accessibility",
                    "frontend-design/scripts/accessibility_checker.py",
                )

                issues = module.check_accessibility(source)

                self.assertIn(
                    "onClick on non-interactive element without keyboard handler",
                    issues,
                )
                self.assertEqual(
                    len([issue for issue in issues if "onClick" in issue]),
                    1,
                )

    def test_accessibility_allows_native_interactive_elements(self):
        for target in TARGETS:
            with self.subTest(target=target), tempfile.TemporaryDirectory() as temp_dir:
                source = Path(temp_dir) / "buttons.tsx"
                source.write_text(
                    "export function Actions() {\n"
                    "  return <><button onClick={() => save()}>Save</button>"
                    "<a href=\"/help\" onClick={() => track()}>Help</a></>\n"
                    "}\n",
                    encoding="utf-8",
                )
                module = load_module(
                    target,
                    "accessibility_native",
                    "frontend-design/scripts/accessibility_checker.py",
                )

                issues = module.check_accessibility(source)

                self.assertNotIn(
                    "onClick on non-interactive element without keyboard handler",
                    issues,
                )

    def test_seo_checks_static_next_metadata_fields(self):
        for target in TARGETS:
            with self.subTest(target=target), tempfile.TemporaryDirectory() as temp_dir:
                module = load_module(
                    target,
                    "seo",
                    "seo-fundamentals/scripts/seo_checker.py",
                )
                empty_metadata = Path(temp_dir) / "empty-layout.tsx"
                empty_metadata.write_text(
                    "export const metadata = {}\n"
                    "export default function Layout() { return <html><body /></html> }\n",
                    encoding="utf-8",
                )
                complete_metadata = Path(temp_dir) / "complete-layout.tsx"
                complete_metadata.write_text(
                    "export const metadata = {\n"
                    "  title: 'Example',\n"
                    "  description: 'Example description',\n"
                    "  openGraph: { title: 'Example' },\n"
                    "}\n"
                    "export default function Layout() { return <html><body /></html> }\n",
                    encoding="utf-8",
                )

                empty_result = module.check_page(empty_metadata)
                complete_result = module.check_page(complete_metadata)

                self.assertIn("Missing metadata title", empty_result["issues"])
                self.assertIn("Missing metadata description", empty_result["issues"])
                self.assertIn(
                    "Missing metadata Open Graph configuration",
                    empty_result["warnings"],
                )
                self.assertEqual(complete_result["issues"], [])
                self.assertEqual(complete_result["warnings"], [])

    def test_seo_marks_dynamic_next_metadata_for_runtime_verification(self):
        for target in TARGETS:
            with self.subTest(target=target), tempfile.TemporaryDirectory() as temp_dir:
                source = Path(temp_dir) / "page.tsx"
                source.write_text(
                    "export async function generateMetadata() { return getMetadata() }\n"
                    "export default function Page() { return <main>Hello</main> }\n",
                    encoding="utf-8",
                )
                module = load_module(
                    target,
                    "seo_dynamic",
                    "seo-fundamentals/scripts/seo_checker.py",
                )

                result = module.check_page(source)

                self.assertEqual(result["issues"], [])
                self.assertIn(
                    "Dynamic metadata detected; verify title, description, and Open Graph output",
                    result["warnings"],
                )

    def test_monolingual_i18n_scan_is_non_blocking(self):
        for target in TARGETS:
            with self.subTest(target=target), tempfile.TemporaryDirectory() as temp_dir:
                project = Path(temp_dir) / "project"
                source = project / "app" / "page.tsx"
                source.parent.mkdir(parents=True)
                source.write_text(
                    "export default function Page() { return <h1>Hello World</h1> }\n",
                    encoding="utf-8",
                )
                checker = script_path(
                    target,
                    "i18n-localization/scripts/i18n_checker.py",
                )

                result = subprocess.run(
                    ["python3", str(checker), str(project)],
                    check=False,
                    capture_output=True,
                    text=True,
                )

                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                self.assertIn("[!] 1 files may have hardcoded strings", result.stdout)


if __name__ == "__main__":
    unittest.main(verbosity=2)
