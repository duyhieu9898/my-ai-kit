#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mirrorCopy, removeKitCodexHooks } from "../bin/index.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatePath = path.join(repoRoot, "templates", "codex");
const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "hieund-ai-kit-installer-"));

const customHook = {
  matcher: "custom_tool",
  hooks: [{ type: "command", command: "echo custom-hook" }],
};

try {
  fs.mkdirSync(path.join(projectDir, ".codex"), { recursive: true });
  fs.writeFileSync(
    path.join(projectDir, ".codex", "config.toml"),
    'model = "custom-model"\n',
  );
  fs.writeFileSync(
    path.join(projectDir, ".codex", "hooks.json"),
    `${JSON.stringify({ hooks: { PreToolUse: [customHook] } }, null, 2)}\n`,
  );

  mirrorCopy(templatePath, projectDir);
  mirrorCopy(templatePath, projectDir, { overwriteRootInstruction: false });

  assert.equal(
    fs.readFileSync(path.join(projectDir, ".codex", "config.toml"), "utf8"),
    'model = "custom-model"\n',
    "custom Codex config must be preserved",
  );
  assert.ok(
    fs.existsSync(path.join(projectDir, ".codex", "hooks", "harness_guard.py")),
    "kit hook script must be installed",
  );
  assert.ok(
    fs.existsSync(path.join(projectDir, ".agents", ".kit-target")),
    "runtime folder must be installed",
  );

  const merged = JSON.parse(
    fs.readFileSync(path.join(projectDir, ".codex", "hooks.json"), "utf8"),
  );
  const preToolGroups = merged.hooks.PreToolUse;
  assert.equal(
    preToolGroups.filter((group) =>
      group.hooks?.some((hook) => hook.command === "echo custom-hook"),
    ).length,
    1,
    "custom hook must be preserved",
  );
  assert.equal(
    preToolGroups.filter((group) =>
      group.hooks?.some((hook) => hook.command?.includes("harness_guard.py")),
    ).length,
    1,
    "kit hook must not be duplicated on update",
  );

  removeKitCodexHooks(projectDir);
  const cleaned = JSON.parse(
    fs.readFileSync(path.join(projectDir, ".codex", "hooks.json"), "utf8"),
  );
  assert.deepEqual(
    cleaned.hooks.PreToolUse,
    [customHook],
    "switch cleanup must preserve custom hooks",
  );
  assert.equal(
    fs.existsSync(path.join(projectDir, ".codex", "hooks", "harness_guard.py")),
    false,
    "switch cleanup must remove the kit hook script",
  );

  console.log("Installer hook merge test passed.");
} finally {
  fs.rmSync(projectDir, { recursive: true, force: true });
}
