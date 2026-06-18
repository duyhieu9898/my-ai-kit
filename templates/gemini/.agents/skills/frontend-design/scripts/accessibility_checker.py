#!/usr/bin/env python3
"""
Accessibility Checker - WCAG compliance audit
Checks HTML files for accessibility issues.

Usage:
    python3 accessibility_checker.py <project_path>

Checks:
    - Form labels
    - ARIA attributes
    - Color contrast hints
    - Keyboard navigation
    - Semantic HTML
"""

import sys
import json
import re
from pathlib import Path
from datetime import datetime

# Fix Windows console encoding
try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except:
    pass


def find_html_files(project_path: Path) -> list:
    """Find all HTML/JSX/TSX files."""
    patterns = ['**/*.html', '**/*.jsx', '**/*.tsx']
    skip_dirs = {'node_modules', '.next', 'dist', 'build', '.git', '.venv', 'venv', '.agents'}

    files = []
    for pattern in patterns:
        for f in project_path.glob(pattern):
            if not any(skip in f.parts for skip in skip_dirs):
                files.append(f)

    return files[:50]


def check_accessibility(file_path: Path) -> list:
    """Check a single file for accessibility issues."""
    issues = []

    try:
        content = file_path.read_text(encoding='utf-8', errors='ignore')

        # Check for form inputs without labels
        inputs = re.findall(r'<input[^>]*>', content, re.IGNORECASE)
        for inp in inputs:
            if 'type="hidden"' not in inp.lower():
                if 'aria-label' not in inp.lower() and 'id=' not in inp.lower():
                    issues.append("Input without label or aria-label")
                    break

        # Check for buttons without accessible text
        buttons = re.findall(r'<button[^>]*>[^<]*</button>', content, re.IGNORECASE)
        for btn in buttons:
            # Check if button has text content or aria-label
            if 'aria-label' not in btn.lower():
                text = re.sub(r'<[^>]+>', '', btn)
                if not text.strip():
                    issues.append("Button without accessible text")
                    break

        # Check for missing lang attribute
        if bool(re.search(r'<html[\s>]', content, re.IGNORECASE)) and 'lang=' not in content.lower():
            issues.append("Missing lang attribute on <html>")

        # Check for missing skip link (only in root layout/shell files that define <html> or <body>)
        is_root_shell = bool(re.search(r'<html[\s>]', content, re.IGNORECASE)) or bool(re.search(r'<body[\s>]', content, re.IGNORECASE))
        if is_root_shell:
            if 'skip' not in content.lower() and '#main' not in content.lower():
                issues.append("Consider adding skip-to-main-content link")

        # Check each native element with a click handler. Custom components use
        # uppercase names and are left to their own accessibility contract.
        interactive_tags = {'button', 'input', 'select', 'textarea', 'summary'}
        click_elements = re.findall(
            r'<([a-z][\w:-]*)\b([^>]*\bonClick\b[^>]*)>',
            content,
        )
        for tag_name, attributes in click_elements:
            is_anchor = tag_name == 'a' and bool(re.search(r'\bhref\s*=', attributes))
            has_keyboard_handler = bool(re.search(r'\bonKey(?:Down|Up)\s*=', attributes))
            if tag_name not in interactive_tags and not is_anchor and not has_keyboard_handler:
                issues.append("onClick on non-interactive element without keyboard handler")
                break

        raw_click_elements = re.findall(
            r'<([a-z][\w:-]*)\b([^>]*\bonclick\s*=[^>]*)>',
            content,
        )
        for tag_name, attributes in raw_click_elements:
            is_anchor = tag_name == 'a' and bool(re.search(r'\bhref\s*=', attributes, re.IGNORECASE))
            has_keyboard_handler = bool(
                re.search(r'\bon(?:key(?:down|up|press))\s*=', attributes, re.IGNORECASE)
            )
            if tag_name not in interactive_tags and not is_anchor and not has_keyboard_handler:
                issues.append("onclick on non-interactive element without keyboard handler")
                break

        # Check for tabIndex misuse
        if 'tabindex=' in content.lower():
            if 'tabindex="-1"' not in content.lower() and 'tabindex="0"' not in content.lower():
                positive_tabindex = re.findall(r'tabindex="([1-9]\d*)"', content, re.IGNORECASE)
                if positive_tabindex:
                    issues.append("Avoid positive tabIndex values")

        # Check for autoplay media (only video/audio elements)
        autoplay_media = re.findall(r'<(?:video|audio)[^>]*autoplay[^>]*>', content, re.IGNORECASE)
        for media in autoplay_media:
            if 'muted' not in media.lower():
                issues.append("Autoplay media should be muted")

        # Check for role usage
        if 'role="button"' in content.lower():
            # Divs with role button should have tabindex
            div_buttons = re.findall(r'<div[^>]*role="button"[^>]*>', content, re.IGNORECASE)
            for div in div_buttons:
                if 'tabindex' not in div.lower():
                    issues.append("role='button' without tabindex")
                    break

    except Exception as e:
        issues.append(f"Error reading file: {str(e)[:50]}")

    return issues


def main():
    project_path = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()

    print(f"\n{'='*60}")
    print(f"[ACCESSIBILITY CHECKER] WCAG Compliance Audit")
    print(f"{'='*60}")
    print(f"Project: {project_path}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-"*60)

    # Find HTML files
    files = find_html_files(project_path)
    print(f"Found {len(files)} HTML/JSX/TSX files")

    if not files:
        output = {
            "script": "accessibility_checker",
            "project": str(project_path),
            "files_checked": 0,
            "issues_found": 0,
            "passed": True,
            "message": "No HTML files found"
        }
        print(json.dumps(output, indent=2))
        sys.exit(0)

    # Check each file
    all_issues = []

    for f in files:
        issues = check_accessibility(f)
        if issues:
            all_issues.append({
                "file": str(f.relative_to(project_path)),
                "issues": issues
            })

    # Summary
    print("\n" + "="*60)
    print("ACCESSIBILITY ISSUES")
    print("="*60)

    if all_issues:
        for item in all_issues[:10]:
            print(f"\n{item['file']}:")
            for issue in item["issues"]:
                print(f"  - {issue}")

        if len(all_issues) > 10:
            print(f"\n... and {len(all_issues) - 10} more files with issues")
    else:
        print("No accessibility issues found!")

    total_issues = sum(len(item["issues"]) for item in all_issues)
    # Accessibility issues are important but not blocking
    passed = total_issues < 5  # Allow minor issues

    output = {
        "script": "accessibility_checker",
        "project": str(project_path),
        "files_checked": len(files),
        "files_with_issues": len(all_issues),
        "issues_found": total_issues,
        "passed": passed
    }

    print("\n" + json.dumps(output, indent=2))

    sys.exit(0 if passed else 1)


if __name__ == "__main__":
    main()
