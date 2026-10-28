#!/usr/bin/env python3
"""
Skill: performance-profiling
Script: lighthouse_audit.py
Purpose: Run Lighthouse performance audit on a URL
Usage: python3 lighthouse_audit.py https://example.com
Output: JSON with category scores, lab metrics (LCP, TBT, CLS...), and top opportunities
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

            return summarize_report(report, url)
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

LAB_METRICS = {
    "lcp_ms": "largest-contentful-paint",
    "tbt_ms": "total-blocking-time",
    "fcp_ms": "first-contentful-paint",
    "speed_index_ms": "speed-index",
}
LAB_NOTE = (
    "Lab run: INP cannot be measured here; TBT is its lab proxy. "
    "Confirm INP with field data (CrUX, RUM) or a recorded interaction trace."
)


def category_score(categories: dict, key: str):
    """Return a 0-100 score, or None when Lighthouse could not score the category."""
    score = categories.get(key, {}).get("score")
    return None if score is None else round(score * 100)


def summarize_report(report: dict, url: str) -> dict:
    """Reduce a Lighthouse JSON report to scores, lab metrics, and the top opportunities."""
    categories = report.get("categories", {})
    audits = report.get("audits", {})

    metrics = {
        key: round(audits[audit_id]["numericValue"])
        for key, audit_id in LAB_METRICS.items()
        if audits.get(audit_id, {}).get("numericValue") is not None
    }
    cls = audits.get("cumulative-layout-shift", {}).get("numericValue")
    if cls is not None:
        metrics["cls"] = round(cls, 3)

    opportunities = sorted(
        (
            {"id": audit_id, "title": audit.get("title", audit_id),
             "savings_ms": round(audit["details"]["overallSavingsMs"])}
            for audit_id, audit in audits.items()
            if audit.get("details", {}).get("type") == "opportunity"
            and audit["details"].get("overallSavingsMs", 0) > 0
        ),
        key=lambda item: item["savings_ms"],
        reverse=True,
    )[:5]

    return {
        "url": url,
        "scores": {
            "performance": category_score(categories, "performance"),
            "accessibility": category_score(categories, "accessibility"),
            "best_practices": category_score(categories, "best-practices"),
            "seo": category_score(categories, "seo"),
        },
        "metrics": metrics,
        "opportunities": opportunities,
        "summary": get_summary(categories),
        "note": LAB_NOTE,
    }


def get_summary(categories: dict) -> str:
    """Generate summary based on scores."""
    perf = (categories.get("performance", {}).get("score") or 0) * 100
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
