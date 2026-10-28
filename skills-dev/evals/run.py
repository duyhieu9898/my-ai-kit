#!/usr/bin/env python3
"""Run every prepared Codex run under a folder, a few at a time."""
import argparse
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path


def run_one(run: Path, timeout: int) -> str:
    log = run / "log.txt"
    with open(run / "prompt.txt") as stdin, open(log, "w") as out:
        try:
            res = subprocess.run(
                ["codex", "exec", "-C", str(run / "repo"), "-s", "workspace-write", "--ephemeral",
                 "-o", str(run / "final.md"), "-"],
                stdin=stdin, stdout=out, stderr=subprocess.STDOUT, timeout=timeout, check=False)
            code = res.returncode
        except subprocess.TimeoutExpired:
            code = "timeout"
    with open(log, "a") as out:
        out.write(f"\nexit={code}\n")
    return f"{run.name}: exit={code}"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("runs_dir")
    ap.add_argument("--parallel", type=int, default=6)
    ap.add_argument("--timeout", type=int, default=900)
    args = ap.parse_args()
    runs = sorted(p for p in Path(args.runs_dir).iterdir() if (p / "prompt.txt").exists()
                  and not (p / "final.md").exists())
    with ThreadPoolExecutor(args.parallel) as pool:
        for line in pool.map(lambda r: run_one(r, args.timeout), runs):
            print(line, flush=True)
    print("ALL_DONE", flush=True)


if __name__ == "__main__":
    main()
