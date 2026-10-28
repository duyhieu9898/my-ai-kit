#!/usr/bin/env python3
"""Prepare one Codex run: copy a fixture, optionally install dev skills, write the prompt."""
import argparse
import shutil
import subprocess
from pathlib import Path

KIT = Path(__file__).resolve().parents[2]  # repository root
SUFFIX = (" You are running unattended; the user will read your final message later."
          " If you need to ask the user something, list the questions in your final message.")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("runs_dir")
    ap.add_argument("name")
    ap.add_argument("fixture")
    ap.add_argument("prompt")
    ap.add_argument("--skills", default="", help="comma-separated skills-dev names to install")
    ap.add_argument("--claude", action="store_true", help="also link skills into .claude/skills")
    args = ap.parse_args()

    run = Path(args.runs_dir) / args.name
    if run.exists():
        shutil.rmtree(run)
    run.mkdir(parents=True)
    repo = run / "repo"
    shutil.copytree(args.fixture, repo, symlinks=True)
    skills = [s for s in args.skills.split(",") if s]
    if skills:
        dest = repo / ".agents" / "skills"
        dest.mkdir(parents=True, exist_ok=True)
        for s in skills:
            src = KIT / "skills-dev" / s
            if not src.exists():  # shipped skills live in the kit template
                src = KIT / "templates" / "skills" / s
            shutil.copytree(src, dest / s)
            if args.claude:
                link_dir = repo / ".claude" / "skills"
                link_dir.mkdir(parents=True, exist_ok=True)
                (link_dir / s).symlink_to(Path("../../.agents/skills") / s)
        subprocess.run(["git", "add", "-A"], cwd=repo, check=True)
        subprocess.run(["git", "-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm",
                        "chore: add agent skills"], cwd=repo, check=True)
    (run / "prompt.txt").write_text(args.prompt + SUFFIX)


if __name__ == "__main__":
    main()
