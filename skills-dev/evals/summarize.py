#!/usr/bin/env python3
"""Summarize trigger results: per query, how often each of our skills loaded."""
import json
import sys
from collections import defaultdict
from pathlib import Path

OURS = ["ambiguity-decisions", "structural-refactor", "codebase-health-scan"]
SHORT = {"ambiguity-decisions": "AD", "structural-refactor": "SR", "codebase-health-scan": "CH"}


def main(results_dir: str, queries_file: str) -> None:
    queries = json.loads(Path(queries_file).read_text())
    for harness in ("codex", "claude"):
        runs = defaultdict(list)
        for f in Path(results_dir, harness).glob("*/result.json"):
            r = json.loads(f.read_text())
            runs[r["id"]].append(r)
        if not runs:
            continue
        print(f"\n## {harness}")
        print("| Query | Expect | AD | SR | CH | Other skills loaded | Pass |")
        print("|---|---|---|---|---|---|---|")
        totals = defaultdict(lambda: [0, 0])
        for q in queries:
            rs = runs.get(q["id"], [])
            n = len(rs)
            if not n:
                continue
            counts = {s: sum(s in r["skills"] for r in rs) for s in OURS}
            others = sorted({s for r in rs for s in r["skills"] if s not in OURS})
            ok = True
            for s in OURS:
                hits = counts[s]
                if q["expect"] == s:
                    ok &= hits * 3 >= 2 * n          # loads in at least 2 of 3
                else:
                    ok &= hits * 3 <= n              # loads in at most 1 of 3
            totals["should" if q["expect"] else "should-not"][0] += ok
            totals["should" if q["expect"] else "should-not"][1] += 1
            cells = " | ".join(f"{counts[s]}/{n}" for s in OURS)
            expect = SHORT.get(q["expect"], "none")
            print(f"| {q['id']} {q['text'][:60]} | {expect} | {cells} | {', '.join(others)} | {'yes' if ok else 'NO'} |")
        for k, (ok, n) in totals.items():
            print(f"\n{harness} {k}: {ok}/{n} queries pass")
        stops = defaultdict(int)
        for rs in runs.values():
            for r in rs:
                stops[r["stop"]] += 1
        print(f"stops: {dict(stops)}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
