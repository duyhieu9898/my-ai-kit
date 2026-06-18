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
      if (entry.name === "__pycache__" || entry.name === "tests") {
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
  const codexRoot = path.join(repoRoot, "templates/codex/.agents");
  const geminiRoot = path.join(repoRoot, "templates/gemini/.agents");
  const sharedAgentsRoot = path.join(repoRoot, "shared/runtime/.agents");
  const codexScripts = listExecutableScripts(codexRoot);
  const geminiScripts = listExecutableScripts(geminiRoot);
  const sharedScripts = listExecutableScripts(sharedAgentsRoot);
  const sharedResourcePaths = listFiles(path.join(sharedAgentsRoot, ".shared"));

  assert.deepEqual(codexScripts, geminiScripts);
  assert.deepEqual(sharedScripts, codexScripts);
  assert.deepEqual(
    sharedResourcePaths,
    listFiles(path.join(codexRoot, ".shared")),
  );
  assert.deepEqual(
    sharedResourcePaths,
    listFiles(path.join(geminiRoot, ".shared")),
  );
  assert.ok(
    fs.existsSync(
      path.join(sharedAgentsRoot, "skills/backlog/.env.example"),
    ),
  );
  assert.ok(
    fs.existsSync(path.join(sharedAgentsRoot, "skills/backlog/.gitignore")),
  );
  assert.ok(
    !fs.existsSync(path.join(sharedAgentsRoot, "skills/backlog/.env")),
  );
  for (const relativePath of codexScripts) {
    assert.deepEqual(
      fs.readFileSync(path.join(codexRoot, relativePath)),
      fs.readFileSync(path.join(geminiRoot, relativePath)),
    );
  }

  fs.cpSync(
    path.join(repoRoot, "shared/runtime"),
    path.join(tempRoot, "shared/runtime"),
    { recursive: true },
  );

  for (const target of ["codex", "gemini"]) {
    fs.cpSync(
      path.join(repoRoot, "templates", target),
      path.join(tempRoot, "templates", target),
      { recursive: true },
    );
  }

  const driftedFile = path.join(
    tempRoot,
    "templates/gemini/.agents/scripts/auto_preview.py",
  );
  const geminiSkill = path.join(
    tempRoot,
    "templates/gemini/.agents/skills/backlog/SKILL.md",
  );
  const codexOpenAi = path.join(
    tempRoot,
    "templates/codex/.agents/skills/backlog/agents/openai.yaml",
  );
  const originalSkill = fs.readFileSync(geminiSkill);
  const originalOpenAi = fs.readFileSync(codexOpenAi);
  fs.appendFileSync(driftedFile, "\n# controlled drift\n");

  const failedCheck = runSync("--check");
  assert.notEqual(failedCheck.status, 0, "drift check should fail");
  assert.match(failedCheck.stderr, /gemini:.agents\/scripts\/auto_preview.py/);

  const syncResult = runSync();
  assert.equal(syncResult.status, 0, syncResult.stderr);

  const passingCheck = runSync("--check");
  assert.equal(passingCheck.status, 0, passingCheck.stderr);
  assert.deepEqual(fs.readFileSync(geminiSkill), originalSkill);
  assert.deepEqual(fs.readFileSync(codexOpenAi), originalOpenAi);

  console.log(
    `Shared runtime coverage and drift repair test passed: ${sharedScripts.length} scripts.`,
  );
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
