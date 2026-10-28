#!/usr/bin/env python3
"""Regression tests for scripts/scan.py. Run: python3 -B -m unittest discover -s <this folder>.

When the skill ships, move this file to scripts/test-codebase-health-scan.py.
"""

import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.dont_write_bytecode = True

SCAN = Path(__file__).resolve().parents[1] / "scripts" / "scan.py"
GIT_ENV = {**os.environ, "GIT_AUTHOR_NAME": "t", "GIT_AUTHOR_EMAIL": "t@t",
           "GIT_COMMITTER_NAME": "t", "GIT_COMMITTER_EMAIL": "t@t"}


def write(root: Path, files: dict[str, str]) -> None:
    for name, content in files.items():
        path = root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)


def git(root: Path, *args: str) -> None:
    subprocess.run(["git", "-C", str(root), *args], check=True, capture_output=True, env=GIT_ENV)


def commit(root: Path, message: str) -> None:
    git(root, "add", "-A")
    git(root, "commit", "-qm", message)


class ScanCase(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(self._tmp.name)

    def tearDown(self):
        self._tmp.cleanup()

    def scan(self, *args: str, path: Path | None = None) -> tuple[int, str]:
        res = subprocess.run([sys.executable, str(SCAN), str(path or self.root), *args],
                             capture_output=True, text=True, check=False)
        return res.returncode, res.stdout + res.stderr

    def section(self, name: str, *args: str, path: Path | None = None) -> str:
        _, out = self.scan("--only", name, *args, path=path)
        return out


class EscapesTest(ScanCase):
    def test_counts_code_and_directives_only(self):
        write(self.root, {"src/a.ts": "\n".join([
            "interface Company { id: string }",
            "const list: Company[] = [];",
            "const a: any = 1;",
            "const b = list as any;",
            "const c: Record<string, any> = {};",
            "const d: any[] = [];",
            "const s = 'as any';",
            "// prose that mentions any[] and @ts-ignore",
            "// @ts-ignore",
            "const e = 1; // eslint-disable-line no-console",
        ])})
        out = self.section("escapes")
        self.assertIn("any 4,", out)
        self.assertIn("ts-ignore 1,", out)
        self.assertIn("eslint-disable 1", out)


class AliasTest(ScanCase):
    CYCLE = {"src/a/a.ts": "import { b } from '@app/b/b';\nexport const a = () => b;\n",
             "src/b/b.ts": "import { a } from '@app/a/a';\nexport const b = () => a;\n"}

    def assert_cycle(self):
        self.assertIn("! 2 files: src/a/a.ts, src/b/b.ts", self.section("cycles"))

    def test_block_comment_after_paths(self):
        write(self.root, {**self.CYCLE, "tsconfig.json": (
            '{\n "compilerOptions": {\n  "baseUrl": ".",\n  "paths": { "@app/*": ["src/*"] },\n'
            '  /* Bundler mode */\n  "moduleResolution": "bundler",\n }\n}\n')})
        self.assert_cycle()

    def test_trailing_line_comment(self):
        write(self.root, {**self.CYCLE, "tsconfig.json": (
            '{ "compilerOptions": { "baseUrl": ".", // root\n "paths": { "@app/*": ["src/*"] } } }')})
        self.assert_cycle()

    def test_extends_chain(self):
        write(self.root, {**self.CYCLE, "tsconfig.json": '{ "extends": "./config/paths.json" }',
                          "config/paths.json": '{ "compilerOptions": { "baseUrl": "..", '
                                               '"paths": { "@app/*": ["src/*"] } } }'})
        self.assert_cycle()

    def test_project_references(self):
        write(self.root, {**self.CYCLE,
                          "tsconfig.json": '{ "files": [], "references": [{ "path": "./tsconfig.web.json" }] }',
                          "tsconfig.web.json": '{ "compilerOptions": { "paths": { "@app/*": ["./src/*"] } } }'})
        self.assert_cycle()

    def test_exact_alias_does_not_match_longer_names(self):
        write(self.root, {
            "tsconfig.json": '{ "compilerOptions": { "paths": { "@cfg": ["./src/cfg.ts"] } } }',
            "src/cfg.ts": "import { u } from '@cfgx/u';\nimport { m } from './main';\nexport const c = 1;\n",
            "src/main.ts": "import { c } from '@cfg';\nexport const m = c;\n"})
        self.assertIn("! 2 files: src/cfg.ts, src/main.ts", self.section("cycles"))


class ImportTest(ScanCase):
    def test_js_specifier_resolves_to_ts(self):
        write(self.root, {"src/a.ts": "import { b } from './b.js';\nexport const a = b;\n",
                          "src/b.ts": "import { a } from './a.js';\nexport const b = a;\n"})
        self.assertIn("! 2 files", self.section("cycles"))

    def test_inline_type_only_import_is_not_an_edge(self):
        write(self.root, {"src/a.ts": "import { type B } from './b';\nexport type A = { b?: B };\n",
                          "src/b.ts": "import { type A } from './a';\nexport type B = { a?: A };\n"})
        self.assertIn("none", self.section("cycles"))

    def test_mixed_import_is_an_edge(self):
        write(self.root, {"src/a.ts": "import b, { type B } from './b';\nexport const a = b;\n",
                          "src/b.ts": "import a from './a';\nexport default a;\n"})
        self.assertIn("! 2 files", self.section("cycles"))

    def test_import_after_type_declaration_is_runtime(self):
        write(self.root, {"src/a.ts": "export type Foo = { a: string }\nimport { b } from './b'\nexport const a = b\n",
                          "src/b.ts": "import { a } from './a'\nexport const b = a\n"})
        self.assertIn("! 2 files", self.section("cycles"))

    def test_commented_import_is_ignored(self):
        write(self.root, {"src/a.ts": "// import { b } from './b';\nexport const a = 1;\n",
                          "src/b.ts": "import { a } from './a';\nexport const b = a;\n"})
        self.assertIn("none", self.section("cycles"))


class HistoryTest(ScanCase):
    def setUp(self):
        super().setUp()
        git(self.root, "init", "-q")

    def test_monorepo_subfolder(self):
        app = self.root / "apps" / "web"
        for i in range(10):
            write(app, {"src/big.ts": "".join(f"export const v{i}_{j} = {j};\n" for j in range(310))})
            commit(self.root, f"c{i}")
        out = self.section("hotspots", path=app)
        self.assertIn("!   10 commits", out)
        self.assertIn("src/big.ts", out)

    def test_history_follows_renames(self):
        body = "".join(f"export const v{j} = {j};\n" for j in range(310))
        for i in range(6):
            write(self.root, {"src/a.ts": body + f"// {i}\n"})
            commit(self.root, f"a{i}")
        git(self.root, "mv", "src/a.ts", "src/b.ts")
        commit(self.root, "rename")
        for i in range(5):
            write(self.root, {"src/b.ts": body + f"// b{i}\n"})
            commit(self.root, f"b{i}")
        self.assertIn("12 commits", self.section("hotspots"))

    def test_coupling_across_folders(self):
        for i in range(5):
            write(self.root, {"src/x/one.ts": f"export const a = {i};\n",
                              "src/y/two.ts": f"export const b = {i};\n"})
            commit(self.root, f"c{i}")
        self.assertIn("src/x/one.ts  <->  src/y/two.ts", self.section("coupling"))


class BoundaryTest(ScanCase):
    def test_layers(self):
        write(self.root, {
            "src/pages/Home.tsx": "export default 1;\n",
            "src/components/Layout.tsx": "import Home from '../pages/Home';\nexport const L = Home;\n",
            "src/contexts/Auth.tsx": "export const Auth = 1;\n",
            "src/hooks/useAuth.ts": "import { Auth } from '../contexts/Auth';\nexport const u = Auth;\n",
        })
        out = self.section("boundaries")
        self.assertIn("upward: components -> pages: 1 imports", out)
        self.assertNotIn("hooks -> contexts", out)

    def test_features(self):
        write(self.root, {
            "src/features/a/index.ts": "export { x } from './internal';\n",
            "src/features/a/internal.ts": "export const x = 1;\n",
            "src/features/b/ok.ts": "import { x } from '../a';\nexport const y = x;\n",
            "src/features/b/bad.ts": "import { x } from '../a/internal';\nexport const z = x;\n",
            "src/shared/util.ts": "import { x } from '../features/a';\nexport const w = x;\n",
        })
        out = self.section("boundaries")
        self.assertIn("feature internals: 1 imports", out)
        self.assertIn("src/features/b/bad.ts -> src/features/a/internal.ts", out)
        self.assertIn("upward: shared -> features: 1 imports", out)


class InventoryTest(ScanCase):
    def test_tailwind_and_styled_components(self):
        write(self.root, {
            "package.json": '{ "devDependencies": { "tailwindcss": "^4.0.0" } }',
            "src/A.tsx": "import styled from 'styled-components';\nexport const A = styled.div``;\n",
            "src/B.tsx": 'export const B = () => <div className="flex p-4" />;\n',
        })
        out = self.section("inventory")
        self.assertIn("! styling:", out)
        self.assertIn("tailwind (1 files)", out)

    def test_fetch_in_strings_and_comments_is_ignored(self):
        write(self.root, {
            "src/a.ts": "import axios from 'axios';\nexport const a = axios;\n",
            "src/b.ts": "// fetch('/x') was removed\nexport const msg = 'call fetch(url)';\n",
        })
        out = self.section("inventory")
        self.assertIn("http client: axios (1 files)", out)
        self.assertNotIn("fetch()", out)


class PropsTest(ScanCase):
    def test_one_line_props(self):
        members = " ".join(f"m{i}: string;" for i in range(15))
        write(self.root, {"src/Thing.tsx": f"interface ThingProps {{ {members} }}\nexport const T = 1;\n"})
        self.assertIn("!  15 props", self.section("props"))

    def test_booleans_top_level_only(self):
        write(self.root, {"src/Card.tsx": "\n".join([
            "type CardProps = {",
            "  a?: boolean; b: boolean | undefined",
            "  label: string",
            "  config: { e: boolean; f: boolean; g: boolean; h: boolean };",
            "  onClick: (x: boolean, y: boolean) => void;",
            "};",
        ])})
        # 2 top-level booleans; counting the nested ones would reach 4 and flag it.
        self.assertIn("[flagged: 0]", self.section("props"))
        write(self.root, {"src/Card.tsx": "type CardProps = { a: boolean; b: boolean; c: boolean; d: boolean };\n"})
        self.assertIn("!   4 props   4 boolean  CardProps", self.section("props"))

    def test_data_types_are_not_flagged(self):
        members = "\n".join(f"  m{i}: boolean;" for i in range(16))
        write(self.root, {"src/types.ts": f"export interface ItemProps {{\n{members}\n}}\n"})
        self.assertIn("[flagged: 0]", self.section("props"))


class DupesTest(ScanCase):
    def test_repeated_block(self):
        block = "".join(f"  const value{i} = compute(input, {i});\n" for i in range(12))
        write(self.root, {"src/a.ts": f"export function a(input) {{\n{block}}}\n",
                          "src/b.ts": f"export function b(input) {{\n{block}}}\n"})
        self.assertIn("src/a.ts:2  ==  src/b.ts:2", self.section("dupes"))


class CliTest(ScanCase):
    def test_exit_codes(self):
        write(self.root, {"src/a.ts": "export const a = 1;\n"})
        self.assertEqual(self.scan("--only", "cycles")[0], 0)
        self.assertEqual(self.scan("--top", "0")[0], 2)
        self.assertEqual(self.scan("--only", "bogus")[0], 2)
        write(self.root, {"src/a.ts": "import { b } from './b';\nexport const a = b;\n",
                          "src/b.ts": "import { a } from './a';\nexport const b = a;\n"})
        self.assertEqual(self.scan("--only", "cycles")[0], 1)


if __name__ == "__main__":
    unittest.main()
