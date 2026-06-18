#!/usr/bin/env python3
"""
Skill: performance-profiling
Script: lighthouse_audit.py
Purpose: Run Lighthouse performance audit on a URL
Usage: python3 lighthouse_audit.py https://example.com
Output: JSON with performance scores
Note: Runs via npx -y lighthouse@12.8.2 (requires Node.js >=18.16)
"""
import subprocess
import json
import sys
import os
import tempfile
import argparse

def run_lighthouse(url: str) -> dict:
    """Run Lighthouse audit on URL."""
    output_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as f:
            output_path = f.name

        result = subprocess.run(
            [
                "npx",
                "-y",
                "lighthouse@12.8.2",
                url,
                "--output=json",
                f"--output-path={output_path}",
                "--chrome-flags=--headless",
                "--only-categories=performance,accessibility,best-practices,seo"
            ],
            capture_output=True,
            text=True,
            timeout=120
        )

        if result.returncode != 0:
            return {"error": "Lighthouse command failed", "stderr": result.stderr[:500]}

        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            with open(output_path, 'r') as f:
                report = json.load(f)

            categories = report.get("categories", {})
            return {
                "url": url,
                "scores": {
                    "performance": int(categories.get("performance", {}).get("score", 0) * 100),
                    "accessibility": int(categories.get("accessibility", {}).get("score", 0) * 100),
                    "best_practices": int(categories.get("best-practices", {}).get("score", 0) * 100),
                    "seo": int(categories.get("seo", {}).get("score", 0) * 100)
                },
                "summary": get_summary(categories)
            }
        else:
            return {"error": "Lighthouse failed to generate report", "stderr": result.stderr[:500]}

    except subprocess.TimeoutExpired:
        return {"error": "Lighthouse audit timed out"}
    except FileNotFoundError:
        return {"error": "npx command not found. Please install Node.js."}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}
    finally:
        if output_path and os.path.exists(output_path):
            try:
                os.unlink(output_path)
            except Exception:
                pass

def get_summary(categories: dict) -> str:
    """Generate summary based on scores."""
    perf = categories.get("performance", {}).get("score", 0) * 100
    if perf >= 90:
        return "[OK] Excellent performance"
    elif perf >= 50:
        return "[!] Needs improvement"
    else:
        return "[X] Poor performance"

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Lighthouse performance audit on a URL")
    parser.add_argument("args", nargs="+", help="Positional arguments: [project_path] <url>")

    parsed_args = parser.parse_args()

    url = next(
        (arg for arg in parsed_args.args if arg.startswith(("http://", "https://"))),
        None,
    )
    if url is None:
        parser.error("a URL starting with http:// or https:// is required")

    result = run_lighthouse(url)
    print(json.dumps(result, indent=2))
    if "error" in result:
        sys.exit(1)
