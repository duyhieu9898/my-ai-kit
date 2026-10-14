#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = ["openpyxl>=3.1"]
# ///
"""Deterministic half of doc-distill: snapshot, diff, glossary subset, and spec checks.

  sync SOURCE --slug S   convert SOURCE to a line snapshot; when the source hash
                         changed, diff against the previous snapshot and map the
                         changed rows to the spec rules that cite them
  glossary --slug S      print only the glossary rows whose source term occurs
                         in the current snapshot
  check --slug S         validate rule IDs and (src: ...) references in the spec

Run with `uv run distill.py ...` so openpyxl is provided without touching the
project environment. Non-Excel sources are converted with MarkItDown via `uvx`.
"""
import argparse
import difflib
import hashlib
import json
import re
import shutil
import subprocess
import sys
from datetime import date
from pathlib import Path

EXCEL_SUFFIXES = {".xlsx", ".xlsm"}
MARKITDOWN = ["uvx", "--from", "markitdown[docx,pdf,pptx,xls]", "markitdown"]
RULE_RE = re.compile(r"^\s*[-*]\s+(~~)?\*\*([A-Z]{2,5}-\d{3,})\*\*")
SRC_RE = re.compile(r"\(src:\s*([^)]+)\)")
REMOVED_RE = re.compile(r"\[removed \d{4}-\d{2}-\d{2}\]")
CELL_RE = re.compile(r"^([A-Z]{0,3})(\d+)$")
LINE_REF_RE = re.compile(r"^L(\d+)(?:-L?(\d+))?$")


class DistillError(Exception):
    pass


# ---------- paths and manifest ----------

def paths(args) -> dict:
    root = Path(args.cache) / args.slug
    return {
        "root": root,
        "current": root / "current",
        "previous": root / "previous",
        "manifest": root / "manifest.json",
        "report": root / "diff.md",
        "spec": Path(args.specs) / args.slug / "spec.md",
    }


def load_manifest(p: dict) -> dict:
    if p["manifest"].exists():
        return json.loads(p["manifest"].read_text(encoding="utf-8"))
    return {}


def save_manifest(p: dict, manifest: dict) -> None:
    p["manifest"].write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def file_sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


# ---------- conversion ----------

def cell_text(value) -> str:
    if value is None:
        return ""
    if isinstance(value, float) and value.is_integer():
        value = int(value)
    text = str(value).strip()
    return text.replace("\r\n", "\n").replace("\n", " ↵ ").replace("|", "\\|")


def convert_excel(source: Path, out: Path) -> list:
    from openpyxl import load_workbook
    from openpyxl.utils import get_column_letter

    # data_only=True reads cached formula results, which is what the author saw.
    workbook = load_workbook(source, data_only=True, read_only=False)
    units = []
    for index, sheet in enumerate(workbook.worksheets, start=1):
        lines = []
        for row in sheet.iter_rows():
            cells = [f"{get_column_letter(c.column)}: {cell_text(c.value)}" for c in row if cell_text(c.value)]
            if cells:
                lines.append(f"{row[0].row} | " + " | ".join(cells))
        safe_title = re.sub(r"[^\w.-]+", "_", sheet.title)
        file_name = f"{index:02d}-{safe_title}.txt"
        (out / file_name).write_text("\n".join(lines) + "\n", encoding="utf-8")
        units.append({"name": sheet.title, "file": file_name, "hidden": sheet.sheet_state != "visible"})
    return units


def convert_other(source: Path, out: Path) -> list:
    try:
        result = subprocess.run([*MARKITDOWN, str(source)], capture_output=True, text=True, check=False)
    except FileNotFoundError as error:
        raise DistillError("uvx not found; install uv to convert non-Excel sources") from error
    if result.returncode != 0:
        raise DistillError(f"markitdown failed: {result.stderr.strip()[-500:]}")
    (out / "doc.txt").write_text(result.stdout, encoding="utf-8")
    return [{"name": "doc", "file": "doc.txt", "hidden": False}]


def kind_of(source: Path) -> str:
    return "excel" if source.suffix.lower() in EXCEL_SUFFIXES else "doc"


def load_unit(path: Path, kind: str) -> list:
    """Return [(locator, content)] where locator is the Excel row or the doc line."""
    lines = path.read_text(encoding="utf-8").splitlines()
    if kind == "doc":
        return [(number, line) for number, line in enumerate(lines, start=1)]
    entries = []
    for line in lines:
        head, _, rest = line.partition(" | ")
        entries.append((int(head), rest))
    return entries


# ---------- references ----------

def parse_ref(ref: str, kind: str):
    """Return (unit name, first row, last row, column) or None when malformed."""
    ref = ref.strip()
    if kind == "doc":
        match = LINE_REF_RE.match(ref)
        if not match:
            return None
        first = int(match.group(1))
        return "doc", first, int(match.group(2) or first), ""
    sheet, sep, cells = ref.rpartition("!")
    if not sep or not sheet:
        return None
    sheet = sheet.strip("'")
    bounds = [CELL_RE.match(part) for part in cells.split(":")]
    if not all(bounds) or len(bounds) > 2:
        return None
    rows = [int(b.group(2)) for b in bounds]
    return sheet, min(rows), max(rows), bounds[0].group(1)


def parse_rules(spec: Path) -> list:
    rules = []
    for number, line in enumerate(spec.read_text(encoding="utf-8").splitlines(), start=1):
        match = RULE_RE.match(line)
        if not match:
            continue
        refs = []
        for group in SRC_RE.findall(line):
            refs.extend(part for part in group.split(",") if part.strip())
        removed = bool(match.group(1)) or bool(REMOVED_RE.search(line))
        rules.append({"id": match.group(2), "line": number, "refs": refs, "removed": removed})
    return rules


# ---------- sync ----------

def diff_unit(old: list, new: list):
    """Yield changes and an old->new locator map for unchanged rows."""
    matcher = difflib.SequenceMatcher(a=[c for _, c in old], b=[c for _, c in new], autojunk=False)
    moved, changes = {}, []
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            for offset in range(i2 - i1):
                moved[old[i1 + offset][0]] = new[j1 + offset][0]
        else:
            changes.append((tag, old[i1:i2], new[j1:j2]))
    return changes, moved


def format_change(tag: str, old: list, new: list, kind: str) -> list:
    prefix = "L" if kind == "doc" else ""
    lines = [f"- {tag}"]
    lines += [f"  - {prefix}{loc} (old): {content}" for loc, content in old]
    lines += [f"  + {prefix}{loc} (new): {content}" for loc, content in new]
    return lines


def sync(args) -> int:
    source = Path(args.source)
    if not source.is_file():
        raise DistillError(f"source not found: {source}")
    p = paths(args)
    manifest = load_manifest(p)
    sha = file_sha(source)
    if manifest.get("source_sha") == sha and p["current"].exists() and not args.force:
        print(f"unchanged: {source.name} (sha256 {sha[:12]})")
        return 0

    kind = kind_of(source)
    staging = p["root"] / "staging"
    shutil.rmtree(staging, ignore_errors=True)
    staging.mkdir(parents=True)
    units = convert_excel(source, staging) if kind == "excel" else convert_other(source, staging)

    first_sync = not p["current"].exists()
    if not first_sync:
        shutil.rmtree(p["previous"], ignore_errors=True)
        p["current"].rename(p["previous"])
    staging.rename(p["current"])

    old_units = {u["name"]: u for u in manifest.get("units", [])}
    manifest.update({
        "source": str(source), "source_sha": sha, "kind": kind, "synced": date.today().isoformat(),
        "units": units, "previous_units": manifest.get("units", []),
    })
    save_manifest(p, manifest)

    snapshot = ", ".join(f"{u['file']}{' (hidden)' if u['hidden'] else ''}" for u in units)
    if first_sync:
        print(f"new: {source.name} -> {p['current']}/ [{snapshot}]")
        print("next: write the spec from the snapshot files")
        return 0

    report, moved_refs, affected = [f"# Diff for {args.slug} ({date.today().isoformat()})", ""], {}, set()
    changed_rows = {}
    new_names = {u["name"] for u in units}
    for name in sorted(old_units.keys() - new_names):
        report += [f"## {name}: sheet removed", ""]
        changed_rows[name] = None
    for unit in units:
        new = load_unit(p["current"] / unit["file"], kind)
        old_unit = old_units.get(unit["name"])
        if not old_unit:
            report += [f"## {unit['name']}: sheet added ({len(new)} rows)", ""]
            continue
        old = load_unit(p["previous"] / old_unit["file"], kind)
        changes, moved = diff_unit(old, new)
        moved_refs[unit["name"]] = moved
        if not changes:
            continue
        changed_rows[unit["name"]] = {loc for _, olds, _ in changes for loc, _ in olds}
        report += [f"## {unit['name']}", ""]
        for change in changes:
            report += format_change(*change, kind)
        report.append("")

    stale = []
    if p["spec"].exists():
        for rule in parse_rules(p["spec"]):
            if rule["removed"]:
                continue
            for ref in rule["refs"]:
                parsed = parse_ref(ref, kind)
                if not parsed:
                    continue
                unit, first, last, column = parsed
                if unit in changed_rows and (changed_rows[unit] is None or changed_rows[unit] & set(range(first, last + 1))):
                    affected.add(rule["id"])
                    continue
                remap = moved_refs.get(unit, {})
                if remap.get(first, first) != first or remap.get(last, last) != last:
                    new_first, new_last = remap.get(first, first), remap.get(last, last)
                    stale.append(f"{rule['id']}: {ref.strip()} -> {format_ref(unit, new_first, new_last, column, kind)}")

    if not changed_rows and not stale:
        report.append("No content changes (formatting or metadata only).")
    if affected:
        report += ["## Affected rules", "", ", ".join(sorted(affected)), ""]
    if stale:
        report += ["## Moved references (content unchanged, update the ref)", ""] + [f"- {s}" for s in stale] + [""]
    p["report"].write_text("\n".join(report), encoding="utf-8")

    print(f"changed: {source.name} -> report {p['report']}")
    print(f"changed units: {', '.join(changed_rows) or 'none'}")
    print(f"affected rules: {', '.join(sorted(affected)) or 'none'}")
    print(f"moved refs: {len(stale)}")
    return 0


def format_ref(unit: str, first: int, last: int, column: str, kind: str) -> str:
    if kind == "doc":
        return f"L{first}" if first == last else f"L{first}-L{last}"
    sheet = f"'{unit}'" if re.search(r"[\s!,]", unit) else unit
    return f"{sheet}!{column}{first}" if first == last else f"{sheet}!{column}{first}:{column}{last}"


# ---------- glossary ----------

def glossary(args) -> int:
    p = paths(args)
    manifest = load_manifest(p)
    if not manifest:
        raise DistillError(f"no snapshot for {args.slug}; run sync first")
    text = "\n".join((p["current"] / u["file"]).read_text(encoding="utf-8") for u in manifest["units"])
    path = Path(args.glossary)
    if not path.exists():
        print(f"no glossary at {path}")
        return 0
    rows = [line for line in path.read_text(encoding="utf-8").splitlines() if line.startswith("|")]
    if len(rows) < 2:
        print("glossary has no table")
        return 0
    print("\n".join(rows[:2]))
    hits = 0
    for row in rows[2:]:
        term = row.strip("|").split("|")[0].strip()
        if term and term in text:
            print(row)
            hits += 1
    print(f"\n{hits} of {len(rows) - 2} terms occur in the source", file=sys.stderr)
    return 0


# ---------- check ----------

def check(args) -> int:
    p = paths(args)
    manifest = load_manifest(p)
    if not manifest:
        raise DistillError(f"no snapshot for {args.slug}; run sync first")
    if not p["spec"].exists():
        raise DistillError(f"spec not found: {p['spec']}")
    kind = manifest["kind"]
    rows_by_unit = {u["name"]: {loc for loc, _ in load_unit(p["current"] / u["file"], kind)} for u in manifest["units"]}

    errors, seen = [], {}
    rules = parse_rules(p["spec"])
    for rule in rules:
        where = f"{p['spec']}:{rule['line']} {rule['id']}"
        if rule["id"] in seen:
            errors.append(f"{where}: duplicate ID (first at line {seen[rule['id']]})")
        seen.setdefault(rule["id"], rule["line"])
        if rule["removed"]:
            continue
        if not rule["refs"]:
            errors.append(f"{where}: no (src: ...) reference")
        for ref in rule["refs"]:
            parsed = parse_ref(ref, kind)
            if not parsed:
                errors.append(f"{where}: malformed ref '{ref.strip()}'")
                continue
            unit, first, last, _ = parsed
            if unit not in rows_by_unit:
                errors.append(f"{where}: unknown sheet '{unit}' in '{ref.strip()}'")
            elif not rows_by_unit[unit] & set(range(first, last + 1)):
                errors.append(f"{where}: '{ref.strip()}' points at empty or missing rows")

    for lost in sorted(set(manifest.get("known_ids", [])) - seen.keys()):
        errors.append(f"{lost}: ID disappeared from the spec; keep it and mark it [removed YYYY-MM-DD]")

    if errors:
        print("\n".join(errors))
        print(f"\n{len(errors)} problem(s) in {len(rules)} rules")
        return 1
    manifest["known_ids"] = sorted(seen)
    save_manifest(p, manifest)
    print(f"ok: {len(rules)} rules, IDs recorded")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="command", required=True)
    sync_parser = sub.add_parser("sync")
    sync_parser.add_argument("source")
    sync_parser.add_argument("--force", action="store_true", help="re-convert even when the hash is unchanged")
    glossary_parser = sub.add_parser("glossary")
    glossary_parser.add_argument("--glossary", default="docs/glossary.md")
    sub.add_parser("check")
    for command in sub.choices.values():
        command.add_argument("--slug", required=True, help="stable name for this document, e.g. login-spec")
        command.add_argument("--cache", default=".doc-distill", help="snapshot directory (keep it out of git)")
        command.add_argument("--specs", default="docs/specs", help="directory holding <slug>/spec.md")
    args = parser.parse_args()
    try:
        return {"sync": sync, "glossary": glossary, "check": check}[args.command](args)
    except DistillError as error:
        print(f"error: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
