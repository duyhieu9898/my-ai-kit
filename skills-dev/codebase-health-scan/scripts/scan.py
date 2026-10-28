#!/usr/bin/env python3
"""Scan a JS/TS frontend repository for structural decay that one file never shows.

Sections: hotspots, coupling, inventory, cycles, boundaries, escapes, dumps,
props, dupes. Standard library only; reads git history but never writes.
Parsing is heuristic (regex over source with comments and strings removed),
so a finding is a prompt to look and "none" is not proof.
Exit code: 0 no flagged findings, 1 flagged findings, 2 usage error.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
from collections import Counter, defaultdict
from itertools import combinations
from pathlib import Path

SOURCE_EXTS = {".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs", ".vue", ".svelte"}
RESOLVE_EXTS = [".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs", ".vue", ".svelte"]
JS_TO_TS = {".js": [".ts", ".tsx"], ".jsx": [".tsx"], ".mjs": [".mts"], ".cjs": [".cts"]}
IGNORED_DIRS = {
    "node_modules", "dist", "build", ".next", ".nuxt", "out", "coverage",
    ".git", ".turbo", ".cache", "vendor", "storybook-static", ".output",
}
TEST_RE = re.compile(r"(\.(test|spec|stories|e2e)\.[cm]?[jt]sx?$)|(/(__tests__|__mocks__|e2e|tests?)/)")
ALL_SECTIONS = ["hotspots", "coupling", "inventory", "cycles", "boundaries",
                "escapes", "dumps", "props", "dupes"]

# concern -> {label: module-name regex}
CONCERNS = {
    "http client": {
        "axios": r"^axios$", "ky": r"^ky$", "ofetch": r"^ofetch$",
        "superagent": r"^superagent$", "got": r"^got$",
    },
    "server state": {
        "tanstack-query": r"^@tanstack/(react|vue|svelte)-query$|^react-query$",
        "swr": r"^swr(/|$)", "rtk-query": r"^@reduxjs/toolkit/query",
        "apollo": r"^@apollo/client", "urql": r"^urql$|^@urql/",
    },
    "client state": {
        "redux": r"^redux$|^react-redux$|^@reduxjs/toolkit$", "zustand": r"^zustand(/|$)",
        "jotai": r"^jotai(/|$)", "recoil": r"^recoil$", "mobx": r"^mobx(-react)?",
        "valtio": r"^valtio", "pinia": r"^pinia$", "vuex": r"^vuex$",
    },
    "forms": {
        "react-hook-form": r"^react-hook-form$", "formik": r"^formik$",
        "final-form": r"^react-final-form$|^final-form$", "tanstack-form": r"^@tanstack/react-form$",
    },
    "validation": {
        "zod": r"^zod(/|$)", "yup": r"^yup$", "joi": r"^joi$|^@hapi/joi$",
        "valibot": r"^valibot$", "superstruct": r"^superstruct$", "ajv": r"^ajv$",
    },
    "dates": {
        "moment": r"^moment(-timezone)?$", "dayjs": r"^dayjs(/|$)",
        "date-fns": r"^date-fns(/|-tz|$)", "luxon": r"^luxon$",
    },
    "styling": {
        "styled-components": r"^styled-components$", "emotion": r"^@emotion/",
        "css-modules": r"\.module\.(css|scss|sass|less)$", "sass": r"(?<!\.module)\.(scss|sass)$",
        "vanilla-extract": r"^@vanilla-extract/", "stitches": r"^@stitches/",
        "mui-styles": r"^@mui/styles$|^@material-ui/styles$",
    },
    "ui kit": {
        "mui": r"^@mui/material|^@material-ui/core", "antd": r"^antd(/|$)",
        "chakra": r"^@chakra-ui/", "mantine": r"^@mantine/", "react-bootstrap": r"^react-bootstrap",
    },
    "icons": {
        "react-icons": r"^react-icons", "lucide": r"^lucide-react$", "heroicons": r"^@heroicons/",
        "fontawesome": r"^@fortawesome/", "mui-icons": r"^@mui/icons-material",
    },
    "i18n": {
        "react-i18next": r"^react-i18next$|^i18next$", "next-intl": r"^next-intl",
        "react-intl": r"^react-intl$", "lingui": r"^@lingui/",
    },
    "utility belt": {
        "lodash": r"^lodash(-es)?(/|$)|^lodash\.", "underscore": r"^underscore$", "ramda": r"^ramda$",
    },
}

# Comments and string literals; regex literals are not recognised.
TOKEN_RE = re.compile(r"""//[^\n]*|/\*.*?\*/|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`""", re.S)
# An import clause never contains = ( ) ; or quotes, and never spans another statement.
CLAUSE = r"""(?:(?!\b(?:import|export)\b)[^'"`;=()])*?"""
IMPORT_RE = re.compile(
    rf"""(?:^|[\s;])(?:import|export)\s+(type\s+)?(?:({CLAUSE})\sfrom\s+)?['"]([^'"]+)['"]"""
    r"""|\b(?:require|import)\(\s*['"]([^'"]+)['"]\s*\)""",
    re.M,
)
FETCH_RE = re.compile(r"(?<![\w.$])fetch\(")
CODE_ESCAPES = {
    "any": re.compile(r":\s*any\b|\bas\s+any\b|[<,\[]\s*any\s*[>,\]]|\bany\[\]"),
    "double cast": re.compile(r"\bas\s+unknown\s+as\b"),
}
DIRECTIVE_RE = re.compile(r"^(?://+|/\*+)\s*(@ts-ignore|@ts-nocheck|@ts-expect-error|eslint-disable)")
DIRECTIVE_LABEL = {"@ts-ignore": "ts-ignore", "@ts-nocheck": "ts-ignore",
                   "@ts-expect-error": "ts-expect-error", "eslint-disable": "eslint-disable"}
DUMP_NAMES = {"utils", "util", "helpers", "helper", "common", "misc", "shared", "lib"}
PROPS_RE = re.compile(r"(?:interface|type)\s+(\w*Props)\b[^{=]*=?\s*\{")
MEMBER_RE = re.compile(r"^(?:readonly\s+)?['\"]?[\w$-]+['\"]?\??\s*:")
METHOD_RE = re.compile(r"^[\w$]+\??\s*(?:<[^>]*>)?\s*\(")
BOOL_MEMBER_RE = re.compile(r"^(?:readonly\s+)?['\"]?[\w$-]+['\"]?\??\s*:\s*boolean(?:\s*\|\s*undefined)?$")
TW_CLASS_RE = re.compile(
    r"""class(?:Name)?\s*=\s*\{?\s*["'`][^"'`]*\b(?:flex|grid|hidden|"""
    r"""(?:p|m|px|py|pt|pb|pl|pr|mx|my|mt|mb|ml|mr|gap|w|h)-\d|text-(?:xs|sm|base|lg|[2-9]?xl)|"""
    r"""bg-[a-z]+-\d{2,3}|rounded(?:-[a-z0-9]+)?)\b""")
# Top-level folder -> layer rank. A file may import its own rank or lower.
LAYER_RANK = {
    "app": 5, "pages": 5, "routes": 5, "views": 5, "screens": 5,
    "layouts": 4, "widgets": 4, "containers": 4,
    "features": 3, "modules": 3, "domains": 3,
    "components": 2, "entities": 2,
    "hooks": 1, "contexts": 1, "providers": 1, "stores": 1, "store": 1, "state": 1,
    "services": 1, "api": 1, "queries": 1,
    "lib": 0, "utils": 0, "util": 0, "helpers": 0, "shared": 0, "common": 0, "types": 0,
    "constants": 0, "config": 0, "configs": 0, "theme": 0, "styles": 0,
}


# --------------------------------------------------------------------------- io

def run_git(root: Path, args: list[str]) -> str | None:
    try:
        res = subprocess.run(["git", "-C", str(root), *args], capture_output=True,
                             text=True, errors="replace", check=False)
    except FileNotFoundError:
        return None
    return res.stdout if res.returncode == 0 else None


def list_files(root: Path, src: Path) -> list[Path]:
    out = run_git(root, ["ls-files", "-co", "--exclude-standard", "--", str(src.relative_to(root))])
    if out is not None:
        paths = [root / p for p in out.splitlines() if p]
    else:
        paths = []
        for dirpath, dirnames, filenames in os.walk(src):
            dirnames[:] = [d for d in dirnames if d not in IGNORED_DIRS]
            paths.extend(Path(dirpath) / f for f in filenames)
    files = []
    for p in paths:
        if p.suffix not in SOURCE_EXTS or p.name.endswith((".d.ts", ".min.js")):
            continue
        if any(part in IGNORED_DIRS for part in p.relative_to(root).parts):
            continue
        if p.is_file():
            files.append(p)
    return sorted(files)


def read(p: Path) -> str:
    try:
        return p.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def loc(text: str) -> int:
    return sum(1 for line in text.splitlines() if line.strip())


def rel(root: Path, p: Path) -> str:
    return p.relative_to(root).as_posix()


def blank(s: str) -> str:
    return re.sub(r"[^\n]", " ", s)


def split_source(text: str) -> tuple[str, str, list[str]]:
    """Return (text without comments, text without comments or strings, comments)."""
    no_comments, code_only, comments = [], [], []
    last = 0
    for m in TOKEN_RE.finditer(text):
        tok, between = m.group(0), text[last:m.start()]
        no_comments.append(between)
        code_only.append(between)
        if tok.startswith(("//", "/*")):
            comments.append(tok)
            no_comments.append(blank(tok))
        else:
            no_comments.append(tok)
        code_only.append(blank(tok))
        last = m.end()
    no_comments.append(text[last:])
    code_only.append(text[last:])
    return "".join(no_comments), "".join(code_only), comments


# ---------------------------------------------------------------- import graph

def parse_jsonc(text: str) -> dict:
    no_comments, _, _ = split_source(text)
    return json.loads(re.sub(r",(\s*[}\]])", r"\1", no_comments))


def load_tsconfig(path: Path, root: Path, seen: set[Path]) -> dict:
    """Compiler options of a tsconfig with `extends` applied; paths made absolute."""
    path = path.resolve()
    if path in seen or not path.is_file():
        return {}
    seen.add(path)
    try:
        data = parse_jsonc(read(path))
    except ValueError:
        return {}
    options: dict = {}
    extends = data.get("extends") or []
    for ext in [extends] if isinstance(extends, str) else extends:
        if ext.startswith((".", "/")):
            parent = (path.parent / ext)
        else:
            parent = root / "node_modules" / ext
        if parent.is_dir():
            parent = parent / "tsconfig.json"
        elif parent.suffix != ".json":
            parent = parent.with_name(parent.name + ".json")
        options.update(load_tsconfig(parent, root, seen))
    own = dict(data.get("compilerOptions") or {})
    if "baseUrl" in own:
        own["baseUrl"] = str((path.parent / own["baseUrl"]).resolve())
    if "paths" in own:
        own["_pathsDir"] = str(path.parent)
    options.update(own)
    for ref in data.get("references") or []:
        ref_path = path.parent / ref.get("path", "")
        options_ref = load_tsconfig(ref_path / "tsconfig.json" if ref_path.is_dir() else ref_path, root, seen)
        for key in ("baseUrl", "paths", "_pathsDir"):
            if key in options_ref and key not in options:
                options[key] = options_ref[key]
    return options


def load_aliases(root: Path) -> list[tuple[str, bool, list[Path]]]:
    """(prefix, has_wildcard, destinations), longest prefix first."""
    aliases: list[tuple[str, bool, list[Path]]] = []
    for name in ("tsconfig.json", "jsconfig.json", "tsconfig.app.json", "tsconfig.base.json"):
        opts = load_tsconfig(root / name, root, set())
        base = Path(opts.get("baseUrl") or opts.get("_pathsDir") or root)
        for key, targets in (opts.get("paths") or {}).items():
            wildcard = key.endswith("*")
            prefix = key[:-1] if wildcard else key
            dests = [base / (t[:-1] if t.endswith("*") else t) for t in targets]
            if not any(a[0] == prefix for a in aliases):
                aliases.append((prefix, wildcard, dests))
    if (root / "src").is_dir():
        for prefix in ("@/", "~/"):
            if not any(a[0] == prefix for a in aliases):
                aliases.append((prefix, True, [root / "src"]))
    return sorted(aliases, key=lambda a: -len(a[0]))


def resolve(spec: str, importer: Path, aliases, known: set[Path]) -> Path | None:
    bases: list[Path] = []
    if spec.startswith("."):
        bases = [importer.parent / spec]
    else:
        for prefix, wildcard, dests in aliases:
            if spec == prefix or (wildcard and spec.startswith(prefix)):
                bases = [d / spec[len(prefix):] for d in dests]
                break
    for base in bases:
        base = Path(os.path.normpath(base))
        candidates = [base] + [base.with_name(base.name + e) for e in RESOLVE_EXTS]
        candidates += [base.with_suffix(e) for e in JS_TO_TS.get(base.suffix, [])]
        candidates += [base / ("index" + e) for e in RESOLVE_EXTS]
        for c in candidates:
            if c in known:
                return c
    return None


def type_only_clause(clause: str | None) -> bool:
    """`{ type A, type B }`: TypeScript and bundlers drop the import at runtime."""
    m = re.fullmatch(r"\s*\{([^}]*)\}\s*", clause or "")
    if not m:
        return False
    items = [x.strip() for x in m.group(1).split(",") if x.strip()]
    return bool(items) and all(x.startswith("type ") for x in items)


def parse_imports(text: str) -> list[tuple[str, bool]]:
    """Return (specifier, type_only) pairs from text without comments."""
    result = []
    for m in IMPORT_RE.finditer(text):
        spec = m.group(3) or m.group(4)
        if spec:
            result.append((spec, bool(m.group(1)) or type_only_clause(m.group(2))))
    return result


def build_graph(files, no_comments, aliases):
    known = set(files)
    graph: dict[Path, set[Path]] = defaultdict(set)
    specs: dict[Path, list[str]] = {}
    for f in files:
        imports = parse_imports(no_comments[f])
        specs[f] = [s for s, _ in imports]
        for spec, type_only in imports:
            if type_only:
                continue
            target = resolve(spec, f, aliases, known)
            if target and target != f:
                graph[f].add(target)
    return graph, specs


def strongly_connected(graph: dict[Path, set[Path]]) -> list[list[Path]]:
    index, low, on_stack, stack, comps = {}, {}, set(), [], []
    counter = 0
    for start in list(graph):
        if start in index:
            continue
        work = [(start, iter(sorted(graph.get(start, ()))))]
        index[start] = low[start] = counter
        counter += 1
        stack.append(start)
        on_stack.add(start)
        while work:
            node, it = work[-1]
            advanced = False
            for nxt in it:
                if nxt not in index:
                    index[nxt] = low[nxt] = counter
                    counter += 1
                    stack.append(nxt)
                    on_stack.add(nxt)
                    work.append((nxt, iter(sorted(graph.get(nxt, ())))))
                    advanced = True
                    break
                if nxt in on_stack:
                    low[node] = min(low[node], index[nxt])
            if advanced:
                continue
            work.pop()
            if work:
                parent = work[-1][0]
                low[parent] = min(low[parent], low[node])
            if low[node] == index[node]:
                comp = []
                while True:
                    w = stack.pop()
                    on_stack.discard(w)
                    comp.append(w)
                    if w == node:
                        break
                if len(comp) > 1:
                    comps.append(comp)
    return comps


# -------------------------------------------------------------------- sections

def git_history(root: Path, src: Path, since: str):
    """Files changed per commit, newest first, with older names mapped to current ones."""
    # --relative: paths relative to the scanned root, also inside a monorepo.
    out = run_git(root, ["log", f"--since={since}", "--no-merges", "-M", "--relative",
                         "--format=@@%H", "--name-status", "--", str(src.relative_to(root))])
    if out is None:
        return None
    commits, current, renamed = [], None, {}
    for line in out.splitlines():
        if line.startswith("@@"):
            current = []
            commits.append(current)
            continue
        parts = line.split("\t")
        if current is None or len(parts) < 2:
            continue
        path = parts[-1]
        name = renamed.get(path, path)
        if parts[0].startswith("R") and len(parts) == 3:
            renamed[parts[1]] = name
        current.append(name)
    return commits


def section_hotspots(ctx, top):
    commits = ctx["commits"]
    if commits is None:
        return ["  skipped: not a git repository"], 0
    revs = Counter(f for c in commits for f in set(c))
    rows = []
    for f in ctx["files"]:
        r = rel(ctx["root"], f)
        if revs[r] and not TEST_RE.search(r):
            rows.append((revs[r] * ctx["loc"][f], revs[r], ctx["loc"][f], r))
    rows.sort(reverse=True)
    if not rows:
        return [f"  no source commits since {ctx['since']}; rerun with an older --since"], 0
    lines, flagged = [], 0
    for _, n, size, r in rows[:top]:
        flag = n >= 10 and size >= 300
        flagged += flag
        lines.append(f"  {'!' if flag else ' '} {n:>4} commits  {size:>5} loc  {r}")
    return lines, flagged


def section_coupling(ctx, top):
    commits = ctx["commits"]
    if commits is None:
        return ["  skipped: not a git repository"], 0
    known = {rel(ctx["root"], f) for f in ctx["files"]}
    revs, pairs = Counter(), Counter()
    for c in commits:
        files = sorted({f for f in c if f in known and not TEST_RE.search(f)})
        for f in files:
            revs[f] += 1
        if 2 <= len(files) <= 30:
            for a, b in combinations(files, 2):
                pairs[(a, b)] += 1
    rows = []
    for (a, b), shared in pairs.items():
        if shared < 5 or Path(a).parent == Path(b).parent:
            continue
        degree = shared / min(revs[a], revs[b])
        if degree >= 0.6:
            rows.append((degree, shared, a, b))
    rows.sort(reverse=True)
    lines = [f"  ! {d:>4.0%} of {s:>3} changes  {a}  <->  {b}" for d, s, a, b in rows[:top]]
    return lines or ["  none: no cross-folder pair changes together in 60%+ of 5+ commits"], len(rows)


def tailwind_configured(root: Path) -> bool:
    if any((root / f"tailwind.config.{e}").is_file() for e in ("js", "cjs", "mjs", "ts")):
        return True
    try:
        pkg = json.loads(read(root / "package.json") or "{}")
    except ValueError:
        return False
    deps = {**(pkg.get("dependencies") or {}), **(pkg.get("devDependencies") or {})}
    return "tailwindcss" in deps


def section_inventory(ctx, top):
    usage: dict[str, dict[str, set[str]]] = defaultdict(lambda: defaultdict(set))
    compiled = {c: {k: re.compile(v) for k, v in libs.items()} for c, libs in CONCERNS.items()}
    tailwind = tailwind_configured(ctx["root"])
    for f in ctx["files"]:
        r = rel(ctx["root"], f)
        if TEST_RE.search(r):
            continue
        for spec in ctx["specs"][f]:
            for concern, libs in compiled.items():
                for label, rx in libs.items():
                    if rx.search(spec):
                        usage[concern][label].add(r)
        if FETCH_RE.search(ctx["code_only"][f]):
            usage["http client"]["fetch()"].add(r)
        if tailwind and TW_CLASS_RE.search(ctx["no_comments"][f]):
            usage["styling"]["tailwind"].add(r)
    if tailwind:
        usage["styling"].setdefault("tailwind", set())
    lines, flagged = [], 0
    for concern in CONCERNS:
        libs = dict(usage.get(concern, {}))
        if not libs:
            continue
        flag = len(libs) >= 2
        flagged += flag
        parts = ", ".join(f"{k} ({len(v)} files)" for k, v in sorted(libs.items(), key=lambda kv: -len(kv[1])))
        lines.append(f"  {'!' if flag else ' '} {concern}: {parts}")
    return lines or ["  no known libraries detected"], flagged


def section_cycles(ctx, top):
    comps = sorted(strongly_connected(ctx["graph"]), key=len, reverse=True)
    lines = []
    for comp in comps[:top]:
        names = sorted(rel(ctx["root"], p) for p in comp)
        shown = ", ".join(names[:4]) + (f", +{len(names) - 4} more" if len(names) > 4 else "")
        lines.append(f"  ! {len(comp)} files: {shown}")
    return lines or ["  none (type-only imports ignored)"], len(comps)


def find_features_dir(root: Path, override: str | None) -> Path | None:
    if override:
        p = (root / override).resolve()
        return p if p.is_dir() else None
    for cand in ("src/features", "src/modules", "src/domains", "features", "modules"):
        if (root / cand).is_dir():
            return root / cand
    return None


def layer_of(path: Path, src: Path) -> str | None:
    parts = path.relative_to(src).parts if path.is_relative_to(src) else ()
    return parts[0] if len(parts) > 1 and parts[0] in LAYER_RANK else None


def section_boundaries(ctx, top):
    root, src, fdir = ctx["root"], ctx["src"], ctx["features_dir"]
    violations = []
    for a, targets in ctx["graph"].items():
        for b in targets:
            if fdir and a.is_relative_to(fdir) and b.is_relative_to(fdir):
                a_feat, b_parts = a.relative_to(fdir).parts[0], b.relative_to(fdir).parts
                public = len(b_parts) == 2 and b.stem == "index"
                if a_feat != b_parts[0] and not public:
                    violations.append(("feature internals", a, b))
                continue
            la, lb = layer_of(a, src), layer_of(b, src)
            if la and lb and LAYER_RANK[la] < LAYER_RANK[lb]:
                violations.append((f"upward: {la} -> {lb}", a, b))
    layers = {layer_of(f, src) for f in ctx["files"]} - {None}
    if not fdir and len(layers) < 2:
        return ["  skipped: no layer folders (pages/, components/, stores/...) or features/ found"], 0
    kinds = Counter(k for k, _, _ in violations)
    lines = [f"  ! {k}: {n} imports" for k, n in kinds.most_common()]
    for _, a, b in sorted(violations, key=lambda v: (v[0], str(v[1])))[:top]:
        lines.append(f"      {rel(root, a)} -> {rel(root, b)}")
    if not violations:
        lines = [f"  none across {', '.join(sorted(layers)) or rel(root, fdir)}"]
    return lines, len(violations)


def section_escapes(ctx, top):
    totals, per_file = Counter(), Counter()
    for f in ctx["files"]:
        if f.suffix not in {".ts", ".tsx", ".mts", ".cts", ".vue", ".svelte"}:
            continue
        r = rel(ctx["root"], f)
        for label, rx in CODE_ESCAPES.items():
            n = len(rx.findall(ctx["code_only"][f]))
            totals[label] += n
            per_file[r] += n
        for comment in ctx["comments"][f]:
            m = DIRECTIVE_RE.match(comment)
            if m:
                totals[DIRECTIVE_LABEL[m.group(1)]] += 1
                per_file[r] += 1
    ts_files = [f for f in ctx["files"] if f.suffix in {".ts", ".tsx", ".mts", ".cts"}]
    if not ts_files:
        return ["  skipped: no TypeScript files"], 0
    ts_loc = sum(ctx["loc"][f] for f in ts_files) or 1
    count = sum(totals.values())
    per_k = count * 1000 / ts_loc
    flagged = int(per_k >= 5 and count >= 20)
    labels = ["any", "double cast", "ts-ignore", "ts-expect-error", "eslint-disable"]
    lines = [f"  {'!' if flagged else ' '} " + ", ".join(f"{k} {totals[k]}" for k in labels)
             + f"  ({per_k:.1f} per 1k loc)"]
    for r, n in per_file.most_common(top):
        if n:
            lines.append(f"      {n:>4}  {r}")
    return lines, flagged


def section_dumps(ctx, top):
    dirs: dict[Path, list[Path]] = defaultdict(list)
    for f in ctx["files"]:
        for parent in f.relative_to(ctx["root"]).parents:
            if parent.name in DUMP_NAMES:
                dirs[parent].append(f)
                break
    rows = []
    for d, fs in dirs.items():
        size = sum(ctx["loc"][f] for f in fs)
        rows.append((len(fs) > 15 or size > 1500, len(fs), size, d.as_posix()))
    for f in ctx["files"]:
        if f.stem.lower() in {"utils", "helpers", "helper", "util", "common", "functions"} and ctx["loc"][f] > 300:
            rows.append((True, 1, ctx["loc"][f], rel(ctx["root"], f)))
    rows.sort(key=lambda r: (-r[0], -r[2]))
    lines = [f"  {'!' if fl else ' '} {n:>4} files  {s:>6} loc  {p}" for fl, n, s, p in rows[:top]]
    return lines or ["  none"], sum(1 for r in rows if r[0])


def count_members(body: str) -> tuple[int, int]:
    """Members and boolean members of a type body, split at top-level ; , and newlines."""
    members = bools = depth = 0
    segment: list[str] = []
    for ch in body + "\n":
        if ch in "({[":
            depth += 1
        elif ch in ")}]":
            depth -= 1
        if depth == 0 and ch in ";,\n":
            s = "".join(segment).strip()
            segment.clear()
            if MEMBER_RE.match(s) or METHOD_RE.match(s):
                members += 1
                bools += bool(BOOL_MEMBER_RE.match(s))
            continue
        segment.append(ch)
    return members, bools


def section_props(ctx, top):
    rows = []
    for f in ctx["files"]:
        if f.suffix not in {".ts", ".tsx"}:
            continue
        text = ctx["no_comments"][f]
        for m in PROPS_RE.finditer(text):
            depth, i = 1, m.end()
            while i < len(text) and depth:
                depth += {"{": 1, "}": -1}.get(text[i], 0)
                i += 1
            members, bools = count_members(text[m.end():i - 1])
            if members:
                component = f.suffix == ".tsx" and m.group(1)[0].isupper()
                flag = component and (members >= 15 or bools >= 4)
                rows.append((flag, members, bools, m.group(1), rel(ctx["root"], f)))
    rows.sort(key=lambda r: (-r[0], -r[2], -r[1]))
    lines = [f"  {'!' if fl else ' '} {n:>3} props  {b:>2} boolean  {name}  {r}"
             for fl, n, b, name, r in rows[:top] if fl or n >= 10]
    return lines or ["  no Props type with 10+ members"], sum(1 for r in rows if r[0])


def normalize(line: str) -> str:
    s = line.strip()
    if not s or s.startswith(("import ", "export {", "//", "/*", "*")) or len(re.sub(r"[\s{}()\[\];,<>/]", "", s)) < 4:
        return ""
    return re.sub(r"\s+", " ", s)


def section_dupes(ctx, top, window=6):
    seen: dict[str, list[tuple[str, int]]] = defaultdict(list)
    for f in ctx["files"]:
        r = rel(ctx["root"], f)
        if TEST_RE.search(r):
            continue
        norm = [(i + 1, n) for i, line in enumerate(ctx["texts"][f].splitlines()) if (n := normalize(line))]
        for j in range(len(norm) - window + 1):
            chunk = "\n".join(n for _, n in norm[j:j + window])
            h = hashlib.md5(chunk.encode()).hexdigest()
            seen[h].append((r, norm[j][0]))
    pairs: dict[tuple[str, str], list[int]] = defaultdict(lambda: [0, 0, 0])
    for locs in seen.values():
        files = {}
        for r, ln in locs:
            files.setdefault(r, ln)
        if len(files) < 2 or len(files) > 8:
            continue
        for (a, la), (b, lb) in combinations(sorted(files.items()), 2):
            entry = pairs[(a, b)]
            if not entry[0]:
                entry[1], entry[2] = la, lb
            entry[0] += 1
    rows = sorted(((n, a, la, b, lb) for (a, b), (n, la, lb) in pairs.items()), reverse=True)
    flagged = [r for r in rows if r[0] >= 5]
    lines = [f"  ! ~{n + window - 1:>3} lines  {a}:{la}  ==  {b}:{lb}" for n, a, la, b, lb in flagged[:top]]
    return lines or ["  none: no block of 10+ normalized lines repeated across files"], len(flagged)


SECTION_FUNCS = {
    "hotspots": ("Hotspots: change frequency x size (since {since})", section_hotspots),
    "coupling": ("Change coupling across folders (since {since})", section_coupling),
    "inventory": ("Pattern inventory: libraries per concern", section_inventory),
    "cycles": ("Import cycles", section_cycles),
    "boundaries": ("Boundary violations", section_boundaries),
    "escapes": ("Type and lint escape hatches", section_escapes),
    "dumps": ("Dumping-ground folders and files", section_dumps),
    "props": ("Props types with many members or booleans", section_props),
    "dupes": ("Duplicated blocks across files", section_dupes),
}


def positive_int(value: str) -> int:
    n = int(value)
    if n < 1:
        raise argparse.ArgumentTypeError("must be 1 or more")
    return n


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Report structural decay in a JS/TS frontend repo. '!' marks a flagged finding.")
    ap.add_argument("path", nargs="?", default=".", help="repository root (default: .)")
    ap.add_argument("--src", help="source folder relative to the root (default: src if present, else root)")
    ap.add_argument("--since", default="12 months ago", help="git history window (default: '12 months ago')")
    ap.add_argument("--top", type=positive_int, default=10, help="rows per section (default: 10)")
    ap.add_argument("--only", help=f"comma-separated sections: {','.join(ALL_SECTIONS)}")
    ap.add_argument("--features-dir", help="feature folder relative to the root (default: auto-detect)")
    args = ap.parse_args()

    root = Path(args.path).resolve()
    if not root.is_dir():
        print(f"error: {root} is not a directory", file=sys.stderr)
        return 2
    src = (root / args.src).resolve() if args.src else (root / "src" if (root / "src").is_dir() else root)
    if not src.is_dir() or not src.is_relative_to(root):
        print(f"error: source folder {src} not found under {root}", file=sys.stderr)
        return 2
    sections = ALL_SECTIONS if not args.only else [s.strip() for s in args.only.split(",") if s.strip()]
    unknown = [s for s in sections if s not in SECTION_FUNCS]
    if unknown:
        print(f"error: unknown section(s): {', '.join(unknown)}", file=sys.stderr)
        return 2

    files = list_files(root, src)
    if not files:
        print(f"error: no JS/TS source files under {src}", file=sys.stderr)
        return 2
    texts = {f: read(f) for f in files}
    ctx = {"root": root, "src": src, "files": files, "texts": texts, "since": args.since,
           "loc": {f: loc(t) for f, t in texts.items()},
           "no_comments": {}, "code_only": {}, "comments": {}}
    for f, t in texts.items():
        ctx["no_comments"][f], ctx["code_only"][f], ctx["comments"][f] = split_source(t)
    if {"cycles", "boundaries", "inventory"} & set(sections):
        ctx["graph"], ctx["specs"] = build_graph(files, ctx["no_comments"], load_aliases(root))
    if {"hotspots", "coupling"} & set(sections):
        ctx["commits"] = git_history(root, src, args.since)
    ctx["features_dir"] = find_features_dir(root, args.features_dir)

    print(f"Scanned {len(files)} files, {sum(ctx['loc'].values())} loc under {rel(root, src) or '.'}")
    total = 0
    for name in sections:
        title, fn = SECTION_FUNCS[name]
        lines, flagged = fn(ctx, args.top)
        total += flagged
        print(f"\n## {name}: {title.format(since=args.since)}  [flagged: {flagged}]")
        print("\n".join(lines))
    print(f"\nFlagged findings: {total}")
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main())
