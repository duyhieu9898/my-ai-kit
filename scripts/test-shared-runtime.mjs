#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const repoRoot = path.resolve(".");
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "shared-runtime-test-"));
const syncScript = path.join(repoRoot, "scripts/sync-shared-runtime.mjs");
const scriptExtensions = new Set([".py", ".js", ".mjs", ".sh"]);

function listFiles(root) {
  const files = [];

  function walk(currentPath) {
    for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
      if (entry.name === "__pycache__" || entry.name.endsWith(".pyc")) {
        continue;
      }

      const entryPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
      } else if (entry.isFile()) {
        files.push(path.relative(root, entryPath));
      }
    }
  }

  walk(root);
  return files.sort();
}

function listExecutableScripts(root) {
  const scripts = [];

  function walk(currentPath) {
    for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
      if (entry.name === "__pycache__" || entry.name === "tests" || entry.name === "hooks") {
        continue;
      }

      const entryPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
      } else if (entry.isFile() && scriptExtensions.has(path.extname(entry.name))) {
        scripts.push(path.relative(root, entryPath));
      }
    }
  }

  walk(root);
  return scripts.sort();
}

function runSync(...args) {
  return spawnSync(
    process.execPath,
    [syncScript, `--root=${tempRoot}`, ...args],
    { encoding: "utf8" },
  );
}

try {
  const codexRoot = path.join(repoRoot, "templates/.agents");
  const geminiRoot = path.join(repoRoot, "templates/.agents");
  const sharedAgentsRoot = path.join(repoRoot, "shared/runtime/.agents");
  const codexScripts = listExecutableScripts(codexRoot);
  const geminiScripts = listExecutableScripts(geminiRoot);
  const sharedScripts = listExecutableScripts(sharedAgentsRoot);
  const sharedResourcePaths = listFiles(path.join(sharedAgentsRoot, ".shared"));
  const filterToSubDirs = (rel) =>
    rel.startsWith("skills/") ||
    rel.startsWith("agents/") ||
    rel.startsWith("workflows/") ||
    rel.startsWith("hooks/");

  const codexScriptsOnly = codexScripts.filter(filterToSubDirs).sort();
  const geminiScriptsOnly = geminiScripts.filter(rel => rel.startsWith("gemini/")).sort();
  const mappedGeminiScripts = geminiScriptsOnly
    .map(rel => rel.slice("gemini/".length))
    .filter(filterToSubDirs)
    .sort();

  const sharedScriptsOnly = sharedScripts.filter(filterToSubDirs).sort();

  assert.deepEqual(codexScriptsOnly, mappedGeminiScripts);
  assert.deepEqual(sharedScriptsOnly, codexScriptsOnly);
  assert.deepEqual(
    sharedResourcePaths,
    listFiles(path.join(codexRoot, ".shared")),
  );
  assert.deepEqual(
    sharedResourcePaths,
    listFiles(path.join(geminiRoot, ".shared")),
  );
  for (const relativePath of codexScriptsOnly) {
    const geminiRelPath = relativePath.startsWith("skills/") || relativePath.startsWith("agents/") || relativePath.startsWith("workflows/") || relativePath.startsWith("hooks/")
      ? "gemini/" + relativePath
      : relativePath;
    assert.deepEqual(
      fs.readFileSync(path.join(codexRoot, relativePath)),
      fs.readFileSync(path.join(geminiRoot, geminiRelPath)),
    );
  }

  fs.cpSync(
    path.join(repoRoot, "shared/runtime"),
    path.join(tempRoot, "shared/runtime"),
    { recursive: true },
  );

  fs.cpSync(
    path.join(repoRoot, "templates"),
    path.join(tempRoot, "templates"),
    { recursive: true },
  );

  const driftedFile = path.join(
    tempRoot,
    "templates/.agents/scripts/auto_preview.py",
  );
  const geminiSkill = path.join(
    tempRoot,
    "templates/.agents/gemini/skills/api-patterns/SKILL.md",
  );
  const codexOpenAi = path.join(
    tempRoot,
    "templates/.agents/skills/api-patterns/scripts/api_validator.py",
  );
  const originalSkill = fs.readFileSync(geminiSkill);
  const originalOpenAi = fs.readFileSync(codexOpenAi);
  fs.appendFileSync(driftedFile, "\n# controlled drift\n");

  const failedCheck = runSync("--check");
  assert.notEqual(failedCheck.status, 0, "drift check should fail");
  assert.match(failedCheck.stderr, /gemini:\.agents\/scripts\/auto_preview\.py/);

  const syncResult = runSync();
  assert.equal(syncResult.status, 0, syncResult.stderr);

  const passingCheck = runSync("--check");
  assert.equal(passingCheck.status, 0, passingCheck.stderr);
  assert.deepEqual(fs.readFileSync(geminiSkill), originalSkill);
  assert.deepEqual(fs.readFileSync(codexOpenAi), originalOpenAi);

  console.log(
    `Shared runtime coverage and drift repair test passed: ${sharedScriptsOnly.length} scripts.`,
  );
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
