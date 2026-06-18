#!/usr/bin/env python3
"""
SEO Checker - Search Engine Optimization Audit
Checks HTML/JSX/TSX pages for SEO best practices.

PURPOSE:
    - Verify meta tags, titles, descriptions
    - Check Open Graph tags for social sharing
    - Validate heading hierarchy
    - Check image accessibility (alt attributes)

WHAT IT CHECKS:
    - HTML files (actual web pages)
    - JSX/TSX files (React page components)
    - Only files that are likely PUBLIC pages

Usage:
    python3 seo_checker.py <project_path>
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


# Directories to skip
SKIP_DIRS = {
    'node_modules', '.next', 'dist', 'build', '.git', '.github',
    '__pycache__', '.vscode', '.idea', 'coverage', 'test', 'tests',
    '__tests__', 'spec', 'docs', 'documentation', 'examples'
}

# Files to skip (not pages)
SKIP_PATTERNS = [
    'config', 'setup', 'util', 'helper', 'hook', 'context', 'store',
    'service', 'api', 'lib', 'constant', 'type', 'interface', 'mock',
    '.test.', '.spec.', '_test.', '_spec.'
]


def is_page_file(file_path: Path) -> bool:
    """Check if this file is likely a public-facing page."""
    name = file_path.name.lower()
    stem = file_path.stem.lower()

    # Skip utility/config files
    if any(skip in name for skip in SKIP_PATTERNS):
        return False

    # Check path - pages in specific directories are likely pages
    parts = [p.lower() for p in file_path.parts]
    page_dirs = ['pages', 'app', 'routes', 'views', 'screens']

    if any(d in parts for d in page_dirs):
        return True

    # Filename indicators for pages
    page_names = ['page', 'index', 'home', 'about', 'contact', 'blog',
                  'post', 'article', 'product', 'landing', 'layout']

    if any(p in stem for p in page_names):
        return True

    # HTML files are usually pages
    if file_path.suffix.lower() in ['.html', '.htm']:
        return True

    return False


def find_pages(project_path: Path) -> list:
    """Find page files to check."""
    patterns = ['**/*.html', '**/*.htm', '**/*.jsx', '**/*.tsx']

    files = []
    for pattern in patterns:
        for f in project_path.glob(pattern):
            # Skip excluded directories
            if any(skip in f.parts for skip in SKIP_DIRS):
                continue

            # Check if it's likely a page
            if is_page_file(f):
                files.append(f)

    return files[:50]  # Limit to 50 files


def check_page(file_path: Path) -> dict:
    """Check a single page for SEO issues."""
    issues = []
    warnings = []

    try:
        content = file_path.read_text(encoding='utf-8', errors='ignore')
    except Exception as e:
        return {"file": str(file_path.name), "issues": [f"Error: {e}"], "warnings": []}

    # Detect if this is a layout/template file (has Head component or HTML <head>)
    # Use regex to avoid matching component names like <Header>, <Heading>
    is_layout = 'Head>' in content or bool(re.search(r'<head[\s>]', content, re.I))

    # Next.js App Router supports either a static metadata object or a dynamic
    # generateMetadata function. Static metadata can be checked field by field;
    # dynamic metadata needs runtime verification and remains advisory here.
    static_metadata_match = re.search(
        r'export\s+const\s+metadata(?:\s*:\s*[^=]+)?\s*=',
        content,
    )
    has_dynamic_metadata = bool(re.search(
        r'export\s+(?:async\s+)?function\s+generateMetadata\b'
        r'|export\s+const\s+generateMetadata\s*=',
        content,
    ))
    has_other_framework_metadata = bool(re.search(
        r'useHead\s*\('
        r'|useSeoMeta\s*\('
        r'|export\s+(?:const|function)\s+meta\b'
        r'|<svelte:head'
        r'|definePageMeta\s*\(',
        content,
    ))

    if static_metadata_match:
        metadata_source = content[static_metadata_match.end():]
        next_export = re.search(
            r'\nexport\s+(?:default|const|function|async\s+function|class)\b',
            metadata_source,
        )
        if next_export:
            metadata_source = metadata_source[:next_export.start()]

        if not re.search(r'\btitle\s*:', metadata_source):
            issues.append("Missing metadata title")
        if not re.search(r'\bdescription\s*:', metadata_source):
            issues.append("Missing metadata description")
        if not re.search(r'\bopenGraph\s*:', metadata_source):
            warnings.append("Missing metadata Open Graph configuration")
    elif has_dynamic_metadata:
        warnings.append("Dynamic metadata detected; verify title, description, and Open Graph output")
    elif is_layout and not has_other_framework_metadata:
        has_title = '<title' in content.lower() or 'title=' in content or 'Head>' in content
        if not has_title:
            issues.append("Missing <title> tag")

        has_description = (
            'name="description"' in content.lower()
            or "name='description'" in content.lower()
        )
        if not has_description:
            issues.append("Missing meta description")

        has_og = 'og:' in content or 'property="og:' in content.lower()
        if not has_og:
            warnings.append("Missing Open Graph tags")

    # 4. Heading hierarchy - multiple H1s
    h1_matches = re.findall(r'<h1[^>]*>', content, re.I)
    if len(h1_matches) > 1:
        warnings.append(f"Multiple H1 tags ({len(h1_matches)})")

    # 5. Images without alt
    img_pattern = r'<img[^>]+>'
    imgs = re.findall(img_pattern, content, re.I)
    for img in imgs:
        if 'alt=' not in img.lower():
            warnings.append("Image missing alt attribute")
            break
        if 'alt=""' in img or "alt=''" in img:
            warnings.append("Image has empty alt attribute")
            break

    return {
        "file": str(file_path.name),
        "issues": issues,
        "warnings": warnings
    }


def main():
    project_path = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()

    print(f"\n{'='*60}")
    print(f"  SEO CHECKER - Search Engine Optimization Audit")
    print(f"{'='*60}")
    print(f"Project: {project_path}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-"*60)

    # Find pages
    pages = find_pages(project_path)

    if not pages:
        print("\n[!] No page files found.")
        print("    Looking for: HTML, JSX, TSX in pages/app/routes directories")
        output = {"script": "seo_checker", "files_checked": 0, "passed": True}
        print("\n" + json.dumps(output, indent=2))
        sys.exit(0)

    print(f"Found {len(pages)} page files to analyze\n")

    # Check each page
    all_issues = []
    all_warnings = []

    for f in pages:
        result = check_page(f)
        if result["issues"] or result["warnings"]:
            result_file = str(f.relative_to(project_path))
            if result["issues"]:
                all_issues.append({
                    "file": result_file,
                    "issues": result["issues"]
                })
            if result["warnings"]:
                all_warnings.append({
                    "file": result_file,
                    "warnings": result["warnings"]
                })

    # Summary
    print("=" * 60)
    print("SEO ANALYSIS RESULTS")
    print("=" * 60)

    if all_issues:
        print(f"\n[!] CRITICAL ISSUES ({len(all_issues)}):")
        # Group by issue type
        issue_counts = {}
        for item in all_issues:
            for issue in item["issues"]:
                issue_counts[issue] = issue_counts.get(issue, 0) + 1

        for issue, count in sorted(issue_counts.items(), key=lambda x: -x[1]):
            print(f"  [{count}] {issue}")

        print("\nAffected files:")
        for item in all_issues[:10]:
            print(f"  - {item['file']}:")
            for issue in item["issues"]:
                print(f"    * {issue}")

    if all_warnings:
        print(f"\n[*] WARNINGS/GUIDELINES ({len(all_warnings)}):")
        warning_counts = {}
        for item in all_warnings:
            for warning in item["warnings"]:
                warning_counts[warning] = warning_counts.get(warning, 0) + 1

        for warning, count in sorted(warning_counts.items(), key=lambda x: -x[1]):
            print(f"  [{count}] {warning}")

        print("\nAffected files:")
        for item in all_warnings[:10]:
            print(f"  - {item['file']}:")
            for warning in item["warnings"]:
                print(f"    * {warning}")
        if len(all_warnings) > 10:
            print(f"  ... and {len(all_warnings) - 10} more files with warnings")

    if not all_issues and not all_warnings:
        print("\n[OK] No SEO issues or warnings found!")

    total_issues = sum(len(item["issues"]) for item in all_issues)
    passed = total_issues == 0

    output = {
        "script": "seo_checker",
        "project": str(project_path),
        "files_checked": len(pages),
        "files_with_issues": len(all_issues),
        "files_with_warnings": len(all_warnings),
        "issues_found": total_issues,
        "passed": passed
    }

    print("\n" + json.dumps(output, indent=2))

    sys.exit(0 if passed else 1)


if __name__ == "__main__":
    main()
