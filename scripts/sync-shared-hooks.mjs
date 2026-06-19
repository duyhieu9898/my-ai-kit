#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checkOnly = process.argv.includes("--check");

const copies = [
  ["shared/hooks/harness_guard.py", ".codex/hooks/harness_guard.py"],
  ["shared/hooks/codex_adapter.py", ".codex/hooks/codex_adapter.py"],
  ["shared/hooks/harness_guard.py", "templates/codex/.codex/hooks/harness_guard.py"],
  ["shared/hooks/codex_adapter.py", "templates/codex/.codex/hooks/codex_adapter.py"],
  ["shared/hooks/harness_guard.py", "templates/gemini/.agents/hooks/harness_guard.py"],
  ["shared/hooks/gemini_adapter.py", "templates/gemini/.agents/hooks/gemini_adapter.py"],
];

let drift = false;
for (const [sourceRelative, targetRelative] of copies) {
  const source = path.join(repoRoot, sourceRelative);
  const target = path.join(repoRoot, targetRelative);
  const sourceContent = fs.readFileSync(source);
  const targetContent = fs.existsSync(target) ? fs.readFileSync(target) : null;

  if (targetContent?.equals(sourceContent)) continue;
  drift = true;
  if (checkOnly) {
    console.error(`Shared hook drift: ${targetRelative}`);
    continue;
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  console.log(`Synced ${sourceRelative} -> ${targetRelative}`);
}

if (checkOnly && drift) {
  process.exitCode = 1;
} else if (checkOnly) {
  console.log("Shared hooks are synchronized.");
}
