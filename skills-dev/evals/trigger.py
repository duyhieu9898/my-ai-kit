#!/usr/bin/env python3
"""Trigger test: which skills does an agent load for each query? Stops a run at its first edit."""
import argparse
import json
import os
import re
import shutil
import signal
import subprocess
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

OURS = ["ambiguity-decisions", "structural-refactor", "codebase-health-scan"]
SKILL_PATH_RE = re.compile(r"\.(?:agents|claude)/skills/([a-z0-9-]+)/SKILL\.md")
EDIT_TOOLS = {"Edit", "Write", "MultiEdit", "NotebookEdit"}


def command(harness: str, text: str, repo: Path) -> list[str]:
    if harness == "codex":
        return ["codex", "exec", "--json", "-C", str(repo), "-s", "workspace-write", "--ephemeral", text]
    return ["claude", "-p", text, "--output-format", "stream-json", "--verbose", "--strict-mcp-config",
            "--no-session-persistence", "--max-budget-usd", "0.4"]


def inspect(harness: str, line: str, state: dict) -> bool:
    """Record skills loaded; return True when the run should stop."""
    try:
        ev = json.loads(line)
    except ValueError:
        return False
    if harness == "codex":
        item = ev.get("item") or {}
        if item.get("type") == "command_execution":
            state["skills"].update(SKILL_PATH_RE.findall(item.get("command", "")))
            state["tools"] += ev.get("type") == "item.started"
        if item.get("type") == "file_change":
            state["stop"] = "edit"
            return True
    else:
        if ev.get("type") != "assistant":
            return False
        for block in ev["message"].get("content", []):
            if block.get("type") != "tool_use":
                continue
            name, args = block.get("name"), block.get("input") or {}
            state["tools"] += 1
            if name == "Skill":
                state["skills"].add(str(args.get("skill", "")).split(":")[-1])
            state["skills"].update(SKILL_PATH_RE.findall(json.dumps(args)))
            if name in EDIT_TOOLS:
                state["stop"] = "edit"
                return True
    if state["tools"] >= 12:
        state["stop"] = "tool-cap"
        return True
    return False


def run_one(harness: str, scratch: Path, out: Path, qid: str, text: str, rep: int, timeout: int) -> dict:
    run = out / harness / f"{qid}-{rep}"
    if (run / "result.json").exists():
        return json.loads((run / "result.json").read_text())
    if run.exists():
        shutil.rmtree(run)
    run.mkdir(parents=True)
    repo = run / "repo"
    shutil.copytree(scratch, repo, symlinks=True)
    state = {"skills": set(), "tools": 0, "stop": "exit"}
    start = time.time()
    stderr = open(run / "stderr.txt", "w")
    proc = subprocess.Popen(command(harness, text, repo), cwd=repo, stdin=subprocess.DEVNULL,
                            stdout=subprocess.PIPE, stderr=stderr, text=True,
                            start_new_session=True)
    timer = threading.Timer(timeout, lambda: os.killpg(proc.pid, signal.SIGKILL))
    timer.start()
    with open(run / "events.jsonl", "w") as log:
        for line in proc.stdout:
            log.write(line)
            if inspect(harness, line, state):
                break
    timer.cancel()
    if proc.poll() is None:
        state["stop"] = state["stop"] if state["stop"] != "exit" else "timeout"
        try:
            os.killpg(proc.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
    proc.wait()
    stderr.close()
    if time.time() - start >= timeout:
        state["stop"] = "timeout"
    result = {"harness": harness, "id": qid, "rep": rep, "skills": sorted(state["skills"]),
              "stop": state["stop"], "seconds": round(time.time() - start)}
    (run / "result.json").write_text(json.dumps(result))
    shutil.rmtree(repo, ignore_errors=True)
    return result


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("harness", choices=["codex", "claude"])
    ap.add_argument("--scratch", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--queries", required=True)
    ap.add_argument("--only", help="comma-separated query ids")
    ap.add_argument("--reps", type=int, default=3)
    ap.add_argument("--first-rep", type=int, default=1)
    ap.add_argument("--parallel", type=int, default=6)
    ap.add_argument("--timeout", type=int, default=150)
    args = ap.parse_args()
    queries = json.loads(Path(args.queries).read_text())
    if args.only:
        wanted = set(args.only.split(","))
        queries = [q for q in queries if q["id"] in wanted]
    jobs = [(q["id"], q["text"], r) for r in range(args.first_rep, args.first_rep + args.reps) for q in queries]
    with ThreadPoolExecutor(args.parallel) as pool:
        scratch, out = Path(args.scratch).resolve(), Path(args.out).resolve()
        for res in pool.map(lambda j: run_one(args.harness, scratch, out, *j, args.timeout), jobs):
            print(json.dumps(res), flush=True)
    print("ALL_DONE", flush=True)


if __name__ == "__main__":
    main()
