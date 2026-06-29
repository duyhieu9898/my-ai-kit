#!/usr/bin/env python3
"""Regression tests for validators shared by the Codex and Gemini templates."""

import importlib.util
import io
import json
import subprocess
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch


REPO_ROOT = Path(__file__).resolve().parents[1]
TARGETS = ("codex", "gemini")


def script_path(target: str, relative_path: str) -> Path:
    if target == "gemini":
        return REPO_ROOT / "templates" / ".agents" / "gemini" / "skills" / relative_path
    return REPO_ROOT / "templates" / ".agents" / "skills" / relative_path


def agent_script_path(target: str, script_name: str) -> Path:
    return REPO_ROOT / "templates" / ".agents" / "scripts" / script_name


def load_module(target: str, name: str, relative_path: str):
    path = script_path(target, relative_path)
    spec = importlib.util.spec_from_file_location(f"{target}_{name}", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def load_agent_script(target: str, name: str, script_name: str):
    path = agent_script_path(target, script_name)
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
                self.assertEqual(result["stats"]["untyped_functions"], 1)
                self.assertEqual(result["stats"]["inferred_react_components"], 1)
                self.assertEqual(result["stats"]["total_functions"], 2)

    def test_type_coverage_recognizes_contextual_and_inferred_react_types(self):
        for target in TARGETS:
            with self.subTest(target=target), tempfile.TemporaryDirectory() as temp_dir:
                project = Path(temp_dir) / "project"
                source = project / "components.tsx"
                source.parent.mkdir(parents=True)
                source.write_text(
                    "type Props = { label: string }\n"
                    "export const Card: React.FC<Props> = ({ label }) => <div>{label}</div>\n"
                    "export const Badge = ({ label }: Props) => <span>{label}</span>\n"
                    "export const identity = <T,>(value: T): T => value\n"
                    "const formatter: (value: number) => string = (value) => String(value)\n"
                    "export default function Page() { return <main>Hello</main> }\n"
                    "const helper = () => 1\n",
                    encoding="utf-8",
                )
                module = load_module(
                    target,
                    "type_coverage_contextual",
                    "lint-and-validate/scripts/type_coverage.py",
                )

                result = module.check_typescript_coverage(project)
                messages = "\n".join(result["passed"] + result["issues"])

                self.assertEqual(result["stats"]["total_functions"], 6)
                self.assertEqual(result["stats"]["annotated_functions"], 3)
                self.assertEqual(result["stats"]["inferred_react_components"], 2)
                self.assertEqual(result["stats"]["untyped_functions"], 1)
                self.assertIn("Explicit/contextual annotation coverage: 83%", messages)
                self.assertNotIn("Type coverage:", messages)

    def test_low_typescript_annotation_coverage_is_advisory(self):
        for target in TARGETS:
            with self.subTest(target=target), tempfile.TemporaryDirectory() as temp_dir:
                project = Path(temp_dir) / "project"
                source = project / "helpers.ts"
                source.parent.mkdir(parents=True)
                source.write_text(
                    "export function first() { return 1 }\n"
                    "export function second() { return 2 }\n",
                    encoding="utf-8",
                )
                checker = script_path(
                    target,
                    "lint-and-validate/scripts/type_coverage.py",
                )

                result = subprocess.run(
                    ["python3", str(checker), str(project)],
                    check=False,
                    capture_output=True,
                    text=True,
                )

                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                self.assertIn(
                    "[!] Explicit/contextual annotation coverage: 0%",
                    result.stdout,
                )
                self.assertNotIn("[X] Type coverage", result.stdout)

    def test_unsafe_any_usage_remains_a_critical_signal(self):
        for target in TARGETS:
            with self.subTest(target=target), tempfile.TemporaryDirectory() as temp_dir:
                project = Path(temp_dir) / "project"
                source = project / "unsafe.ts"
                source.parent.mkdir(parents=True)
                source.write_text(
                    "\n".join(
                        f"export const value{index}: any = {index}"
                        for index in range(6)
                    ),
                    encoding="utf-8",
                )
                checker = script_path(
                    target,
                    "lint-and-validate/scripts/type_coverage.py",
                )

                result = subprocess.run(
                    ["python3", str(checker), str(project)],
                    check=False,
                    capture_output=True,
                    text=True,
                )

                self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
                self.assertIn("[X] 6 'any' types found", result.stdout)

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

    def test_page_scanners_ignore_agent_virtualenv_content(self):
        for target in TARGETS:
            with self.subTest(target=target), tempfile.TemporaryDirectory() as temp_dir:
                project = Path(temp_dir) / "project"
                app_page = project / "app" / "page.tsx"
                agent_page = project / ".agents" / ".venv" / "app" / "page.tsx"
                app_page.parent.mkdir(parents=True)
                agent_page.parent.mkdir(parents=True)
                app_page.write_text(
                    "export default function Page() { return <main>App</main> }\n",
                    encoding="utf-8",
                )
                agent_page.write_text(
                    "export default function Page() { return <main>Tooling</main> }\n",
                    encoding="utf-8",
                )

                accessibility = load_module(
                    target,
                    "accessibility_skips",
                    "frontend-design/scripts/accessibility_checker.py",
                )
                seo = load_module(
                    target,
                    "seo_skips",
                    "seo-fundamentals/scripts/seo_checker.py",
                )

                self.assertEqual(accessibility.find_html_files(project), [app_page])
                self.assertEqual(seo.find_pages(project), [app_page])

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

    def test_verify_all_help_does_not_bootstrap_playwright(self):
        for target in TARGETS:
            with self.subTest(target=target):
                result = subprocess.run(
                    ["python3", str(agent_script_path(target, "verify_all.py")), "--help"],
                    check=False,
                    capture_output=True,
                    text=True,
                )

                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                self.assertIn("--verbose", result.stdout)
                self.assertNotIn("Initializing isolated environment", result.stdout)

    def test_verify_all_bootstraps_playwright_with_uv_in_target_venv(self):
        for target in TARGETS:
            with self.subTest(target=target), tempfile.TemporaryDirectory() as temp_dir:
                project = Path(temp_dir)
                venv_dir = project / ".agents" / ".venv"
                venv_python = venv_dir / "bin" / "python"
                venv_python.parent.mkdir(parents=True)
                venv_python.touch()
                verify_all = load_agent_script(
                    target,
                    "verify_all_bootstrap",
                    "verify_all.py",
                )

                with (
                    patch.object(verify_all.shutil, "which", return_value="/usr/bin/uv"),
                    patch.object(
                        verify_all.subprocess,
                        "run",
                        side_effect=[
                            subprocess.CompletedProcess([], 1),
                            subprocess.CompletedProcess([], 0),
                            subprocess.CompletedProcess([], 1),
                            subprocess.CompletedProcess([], 0),
                            subprocess.CompletedProcess([], 0),
                        ],
                    ) as run,
                ):
                    result = verify_all.check_and_bootstrap_venv(project)

                commands = [call.args[0] for call in run.call_args_list]
                self.assertEqual(result, venv_python)
                self.assertIn(
                    [
                        "/usr/bin/uv",
                        "pip",
                        "install",
                        "--python",
                        str(venv_python),
                        "playwright",
                    ],
                    commands,
                )
                self.assertIn(
                    [
                        str(venv_python),
                        "-m",
                        "playwright",
                        "install",
                        "chromium",
                    ],
                    commands,
                )
                self.assertIn(
                    [
                        str(venv_python),
                        "-m",
                        "playwright",
                        "install-deps",
                        "--dry-run",
                        "chromium",
                    ],
                    commands,
                )

    def test_verify_all_missing_required_script_fails(self):
        for target in TARGETS:
            with self.subTest(target=target), tempfile.TemporaryDirectory() as temp_dir:
                verify_all = load_agent_script(
                    target,
                    "verify_all_required",
                    "verify_all.py",
                )

                result = verify_all.run_script(
                    "Required Check",
                    Path(temp_dir) / "missing.py",
                    temp_dir,
                    required=True,
                )

                self.assertFalse(result["passed"])
                self.assertFalse(result["skipped"])
                self.assertIn("Required script not found", result["error"])

    def test_verify_all_uses_custom_python_only_for_selected_check(self):
        for target in TARGETS:
            with self.subTest(target=target), tempfile.TemporaryDirectory() as temp_dir:
                project = Path(temp_dir)
                script = project / "check.py"
                script.touch()
                verify_all = load_agent_script(
                    target,
                    "verify_all_interpreter",
                    "verify_all.py",
                )

                with patch.object(
                    verify_all.subprocess,
                    "run",
                    return_value=subprocess.CompletedProcess([], 0, "", ""),
                ) as run:
                    verify_all.run_script(
                        "Playwright Check",
                        script,
                        str(project),
                        python_executable=Path("/isolated/python"),
                    )
                    verify_all.run_script(
                        "Regular Check",
                        script,
                        str(project),
                    )

                self.assertEqual(run.call_args_list[0].args[0][0], "/isolated/python")
                self.assertEqual(run.call_args_list[1].args[0][0], verify_all.sys.executable)

    def test_verify_all_prints_stdout_and_stderr_for_failed_checks(self):
        for target in TARGETS:
            with self.subTest(target=target), tempfile.TemporaryDirectory() as temp_dir:
                project = Path(temp_dir)
                failing_script = project / "failing_check.py"
                failing_script.write_text(
                    "import sys\n"
                    "print('actionable stdout detail')\n"
                    "print('actionable stderr detail', file=sys.stderr)\n"
                    "raise SystemExit(1)\n",
                    encoding="utf-8",
                )
                verify_all = load_agent_script(
                    target,
                    "verify_all",
                    "verify_all.py",
                )
                output = io.StringIO()

                with redirect_stdout(output):
                    result = verify_all.run_script(
                        "Failing Check",
                        failing_script,
                        str(project),
                    )

                rendered = output.getvalue()
                self.assertFalse(result["passed"])
                self.assertIn("actionable stdout detail", rendered)
                self.assertIn("actionable stderr detail", rendered)


if __name__ == "__main__":
    unittest.main(verbosity=2)
