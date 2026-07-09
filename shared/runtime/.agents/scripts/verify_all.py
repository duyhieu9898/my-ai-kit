#!/usr/bin/env python3
"""
Full Verification Suite - AG Kit
==========================================

Runs COMPLETE validation including all checks + performance + E2E.
Use this before deployment or major releases.

Usage:
    python3 scripts/verify_all.py . --url <URL>

Includes ALL checks:
    ✅ Security Scan (OWASP, secrets, dependencies)
    ✅ Lint & Type Coverage
    ✅ Schema Validation
    ✅ Test Suite (unit + integration)
    ✅ UX Audit (psychology, accessibility)
    ✅ SEO Check
    ✅ Lighthouse (Core Web Vitals)
    ✅ Playwright E2E
    ✅ Bundle Analysis (if applicable)
"""

import os
import shutil
import sys
import argparse
import subprocess
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime


def get_venv_python(venv_dir: Path) -> Path:
    """Return the virtualenv Python path for the current platform."""
    if os.name == "nt":
        return venv_dir / "Scripts" / "python.exe"
    return venv_dir / "bin" / "python"


def check_and_bootstrap_venv(project_root: Path) -> Optional[Path]:
    """Prepare an isolated Playwright environment and return its Python."""
    venv_dir = project_root / ".agents" / ".venv"
    venv_python = get_venv_python(venv_dir)
    uv_path = shutil.which("uv")

    try:
        if not venv_python.exists():
            print(f"Initializing isolated environment ({venv_dir.relative_to(project_root)})...")
            if uv_path:
                subprocess.run([uv_path, "venv", str(venv_dir)], check=True)
            else:
                subprocess.run(
                    [sys.executable, "-m", "venv", str(venv_dir)],
                    check=True,
                )

        playwright_check = subprocess.run(
            [str(venv_python), "-c", "import playwright"],
            capture_output=True,
            text=True,
        )
        if playwright_check.returncode != 0:
            if uv_path:
                subprocess.run(
                    [uv_path, "pip", "install", "--python", str(venv_python), "playwright"],
                    check=True,
                )
            else:
                subprocess.run(
                    [str(venv_python), "-m", "pip", "install", "playwright"],
                    check=True,
                )

        browser_check = subprocess.run(
            [
                str(venv_python),
                "-c",
                (
                    "from pathlib import Path; "
                    "from playwright.sync_api import sync_playwright; "
                    "p = sync_playwright().start(); "
                    "path = Path(p.chromium.executable_path); "
                    "p.stop(); "
                    "raise SystemExit(0 if path.exists() else 1)"
                ),
            ],
            capture_output=True,
            text=True,
        )
        if browser_check.returncode != 0:
            subprocess.run(
                [str(venv_python), "-m", "playwright", "install", "chromium"],
                check=True,
            )

        if sys.platform.startswith("linux"):
            deps_check = subprocess.run(
                [
                    str(venv_python),
                    "-m",
                    "playwright",
                    "install-deps",
                    "--dry-run",
                    "chromium",
                ],
                capture_output=True,
                text=True,
            )
            if deps_check.returncode != 0:
                print_warning("Chromium system dependencies may be missing.")
                print(
                    "  Run with sudo: "
                    f"{venv_python} -m playwright install-deps chromium"
                )

        return venv_python
    except (OSError, subprocess.CalledProcessError) as error:
        print_error(f"Playwright environment setup failed: {error}")
        print(
            "  Debian/Ubuntu: install uv, or run "
            "`sudo apt install python3-venv` and retry."
        )
        return None

# ANSI colors
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_header(text: str):
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*70}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.CYAN}{text.center(70)}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'='*70}{Colors.ENDC}\n")

def print_step(text: str):
    print(f"{Colors.BOLD}{Colors.BLUE}🔄 {text}{Colors.ENDC}")

def print_success(text: str):
    print(f"{Colors.GREEN}✅ {text}{Colors.ENDC}")

def print_warning(text: str):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.ENDC}")

def print_error(text: str):
    print(f"{Colors.RED}❌ {text}{Colors.ENDC}")

# Complete verification suite
VERIFICATION_SUITE = [
    # P0: Security (CRITICAL)
    {
        "category": "Security",
        "checks": [
            ("Security Scan", ".agents/skills/security-auditor/scripts/security_scan.py", True),
        ]
    },
    
    # P1: Code Quality (CRITICAL)
    {
        "category": "Code Quality",
        "checks": [
            ("Lint Check", ".agents/skills/lint-and-validate/scripts/lint_runner.py", True),
            ("Type Coverage", ".agents/skills/lint-and-validate/scripts/type_coverage.py", False),
        ]
    },
    
    # P2: Data Layer
    {
        "category": "Data Layer",
        "checks": [
            ("Schema Validation", ".agents/skills/database-design/scripts/schema_validator.py", False),
        ]
    },
    
    # P3: Testing
    {
        "category": "Testing",
        "checks": [
            ("Test Suite", ".agents/skills/testing-patterns/scripts/test_runner.py", False),
        ]
    },
    
    # P4: UX & Accessibility
    {
        "category": "UX & Accessibility",
        "checks": [
            ("UX Audit", ".agents/skills/frontend-design/scripts/ux_audit.py", False),
            ("Accessibility Check", ".agents/skills/frontend-design/scripts/accessibility_checker.py", False),
        ]
    },
    
    # P5: SEO & Content
    {
        "category": "SEO & Content",
        "checks": [
            ("SEO Check", ".agents/skills/seo-fundamentals/scripts/seo_checker.py", False),
        ]
    },
    
    # P6: Performance (requires URL)
    {
        "category": "Performance",
        "requires_url": True,
        "checks": [
            ("Lighthouse Audit", ".agents/skills/performance-profiling/scripts/lighthouse_audit.py", True),
        ]
    },
    
    # P7: E2E Testing (requires URL)
    {
        "category": "E2E Testing",
        "requires_url": True,
        "checks": [
            ("Playwright E2E", ".agents/skills/webapp-testing/scripts/playwright_runner.py", False),
        ]
    },

    
    # P9: Internationalization
    {
        "category": "Internationalization",
        "checks": [
            ("i18n Check", ".agents/skills/i18n-localization/scripts/i18n_checker.py", False),
        ]
    },
]

def run_script(
    name: str,
    script_path: Path,
    project_path: str,
    url: Optional[str] = None,
    verbose: bool = False,
    required: bool = False,
    python_executable: Optional[Path] = None,
) -> dict:
    """Run validation script"""
    if not script_path.exists():
        if required:
            error = f"Required script not found: {script_path}"
            print_error(f"{name}: {error}")
            return {
                "name": name,
                "passed": False,
                "skipped": False,
                "duration": 0,
                "error": error,
            }
        print_warning(f"{name}: Script not found, skipping")
        return {"name": name, "passed": True, "skipped": True, "duration": 0}
    
    print_step(f"Running: {name}")
    start_time = datetime.now()
    
    # Build command
    cmd = [str(python_executable or sys.executable), str(script_path), project_path]
    if url and ("lighthouse" in script_path.name.lower() or "playwright" in script_path.name.lower()):
        cmd.append(url)
    
    # Run
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=600  # 10 minute timeout for slow checks
        )
        
        duration = (datetime.now() - start_time).total_seconds()
        passed = result.returncode == 0
        
        if passed:
            print_success(f"{name}: PASSED ({duration:.1f}s)")
        else:
            print_error(f"{name}: FAILED ({duration:.1f}s)")
            error_msg = ""
            if result.stderr:
                error_msg += result.stderr
            if result.stdout:
                if result.stdout.strip() not in error_msg:
                    error_msg += "\n" + result.stdout
            if error_msg.strip():
                if verbose:
                    print(f"  --- ERROR LOGS ---")
                    print(f"  " + "\n  ".join(error_msg.strip().splitlines()))
                    print(f"  ------------------")
                else:
                    lines = error_msg.strip().splitlines()
                    preview = "\n  ".join(lines[:10])
                    if len(lines) > 10:
                        preview += f"\n  ... (and {len(lines) - 10} more lines, run with --verbose to see full logs)"
                    print(f"  Error details:\n  {preview}")
        
        return {
            "name": name,
            "passed": passed,
            "output": result.stdout,
            "error": result.stderr,
            "skipped": False,
            "duration": duration
        }
    
    except subprocess.TimeoutExpired:
        duration = (datetime.now() - start_time).total_seconds()
        print_error(f"{name}: TIMEOUT (>{duration:.0f}s)")
        return {"name": name, "passed": False, "skipped": False, "duration": duration, "error": "Timeout"}
    
    except Exception as e:
        duration = (datetime.now() - start_time).total_seconds()
        print_error(f"{name}: ERROR - {str(e)}")
        return {"name": name, "passed": False, "skipped": False, "duration": duration, "error": str(e)}

def print_final_report(results: List[dict], start_time: datetime, verbose: bool = False):
    """Print comprehensive final report"""
    total_duration = (datetime.now() - start_time).total_seconds()
    
    print_header("📊 FULL VERIFICATION REPORT")
    
    # Statistics
    total = len(results)
    passed = sum(1 for r in results if r["passed"] and not r.get("skipped"))
    failed = sum(1 for r in results if not r["passed"] and not r.get("skipped"))
    skipped = sum(1 for r in results if r.get("skipped"))
    
    print(f"Total Duration: {total_duration:.1f}s")
    print(f"Total Checks: {total}")
    print(f"{Colors.GREEN}✅ Passed: {passed}{Colors.ENDC}")
    print(f"{Colors.RED}❌ Failed: {failed}{Colors.ENDC}")
    print(f"{Colors.YELLOW}⏭️  Skipped: {skipped}{Colors.ENDC}")
    print()
    
    # Category breakdown
    print(f"{Colors.BOLD}Results by Category:{Colors.ENDC}")
    current_category = None
    for r in results:
        # Print category header if changed
        if r.get("category") and r["category"] != current_category:
            current_category = r["category"]
            print(f"\n{Colors.BOLD}{Colors.CYAN}{current_category}:{Colors.ENDC}")
        
        # Print result
        if r.get("skipped"):
            status = f"{Colors.YELLOW}⏭️ {Colors.ENDC}"
        elif r["passed"]:
            status = f"{Colors.GREEN}✅{Colors.ENDC}"
        else:
            status = f"{Colors.RED}❌{Colors.ENDC}"
        
        duration_str = f"({r.get('duration', 0):.1f}s)" if not r.get("skipped") else ""
        print(f"  {status} {r['name']} {duration_str}")
    
    print()
    
    # Failed checks detail
    if failed > 0:
        print(f"{Colors.BOLD}{Colors.RED}❌ FAILED CHECKS:{Colors.ENDC}")
        for r in results:
            if not r["passed"] and not r.get("skipped"):
                print(f"\n{Colors.RED}✗ {r['name']}{Colors.ENDC}")
                error_msg = ""
                if r.get("error"):
                    error_msg += r["error"]
                if r.get("output"):
                    if r["output"].strip() not in error_msg:
                        error_msg += "\n" + r["output"]
                if error_msg.strip():
                    lines = error_msg.strip().splitlines()
                    if verbose:
                        detail = "\n  ".join(lines)
                    else:
                        detail = "\n  ".join(lines[:15])
                        if len(lines) > 15:
                            detail += f"\n  ... (run with --verbose to see full logs)"
                    print(f"  Logs:\n  {detail}")
        print()
    
    # Final verdict
    if failed > 0:
        print_error(f"VERIFICATION FAILED - {failed} check(s) need attention")
        print(f"\n{Colors.YELLOW}💡 Tip: Fix critical (security, lint) issues first{Colors.ENDC}")
        return False
    else:
        print_success("✨ ALL CHECKS PASSED - Ready for deployment! ✨")
        return True

def main():
    parser = argparse.ArgumentParser(
        description="Run complete AG Kit verification suite",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 scripts/verify_all.py . --url http://localhost:3000
  python3 scripts/verify_all.py . --url https://staging.example.com --no-e2e
        """
    )
    parser.add_argument("project", help="Project path to validate")
    parser.add_argument("--url", help="URL for performance & E2E checks")
    parser.add_argument("--no-e2e", action="store_true", help="Skip E2E tests")
    parser.add_argument("--stop-on-fail", action="store_true", help="Stop on first failure")
    parser.add_argument("--verbose", action="store_true", help="Print verbose details of failed checks")
    
    args = parser.parse_args()
    
    project_path = Path(args.project).resolve()
    
    if not project_path.exists():
        print_error(f"Project path does not exist: {project_path}")
        sys.exit(1)

    playwright_python = None
    if args.url and not args.no_e2e:
        playwright_python = check_and_bootstrap_venv(project_path)
    
    print_header("🚀 ANTIGRAVITY KIT - FULL VERIFICATION SUITE")
    print(f"Project: {project_path}")
    print(f"URL: {args.url if args.url else 'Not provided (skipping E2E and performance checks)'}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    start_time = datetime.now()
    results = []
    
    # Run all verification categories
    for suite in VERIFICATION_SUITE:
        category = suite["category"]
        requires_url = suite.get("requires_url", False)
        
        # Skip if requires URL and not provided
        if requires_url and not args.url:
            continue
        
        # Skip E2E if flag set
        if args.no_e2e and category == "E2E Testing":
            continue
        
        print_header(f"📋 {category.upper()}")
        
        for name, script_path, required in suite["checks"]:
            script = project_path / script_path
            is_playwright = script.name == "playwright_runner.py"
            if is_playwright and playwright_python is None:
                result = {
                    "name": name,
                    "passed": False,
                    "skipped": False,
                    "duration": 0,
                    "error": "Playwright environment is unavailable",
                }
                print_error(f"{name}: Playwright environment is unavailable")
            else:
                result = run_script(
                    name,
                    script,
                    str(project_path),
                    args.url,
                    args.verbose,
                    required,
                    playwright_python if is_playwright else None,
                )
            result["category"] = category
            results.append(result)
            
            # Stop on critical failure if flag set
            if args.stop_on_fail and required and not result["passed"] and not result.get("skipped"):
                print_error(f"CRITICAL: {name} failed. Stopping verification.")
                print_final_report(results, start_time, args.verbose)
                sys.exit(1)
    
    # Print final report
    all_passed = print_final_report(results, start_time, args.verbose)
    
    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()
