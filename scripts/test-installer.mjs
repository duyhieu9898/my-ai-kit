#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  cleanupOldTarget,
  detectInstalledTarget,
  mirrorCopy,
  removeKitCodexHooks,
} from "../bin/index.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const codexTemplatePath = path.join(repoRoot, "templates", "codex");
const geminiTemplatePath = path.join(repoRoot, "templates", "gemini");
const codexProjectDir = fs.mkdtempSync(path.join(os.tmpdir(), "hieund-ai-kit-codex-"));
const geminiProjectDir = fs.mkdtempSync(path.join(os.tmpdir(), "hieund-ai-kit-gemini-"));
const binLinkPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "hieund-ai-kit-bin-")), "hieund-ai-kit");
const harnessBlock = `<!-- HARNESS:BEGIN -->
## Harness

Project-specific Harness instructions stay here.
<!-- HARNESS:END -->`;

const customHook = {
  matcher: "custom_tool",
  hooks: [{ type: "command", command: "echo custom-hook" }],
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

try {
  fs.symlinkSync(path.join(repoRoot, "bin", "index.js"), binLinkPath);
  const symlinkHelp = execFileSync(process.execPath, [binLinkPath, "--help"], {
    encoding: "utf8",
  });
  assert.ok(
    symlinkHelp.includes("Usage: hieund-ai-kit [options] [command]"),
    "CLI must parse when invoked through an npm-style symlink",
  );

  fs.mkdirSync(path.join(codexProjectDir, ".codex"), { recursive: true });
  fs.writeFileSync(
    path.join(codexProjectDir, ".codex", "config.toml"),
    'model = "custom-model"\n',
  );
  writeJson(path.join(codexProjectDir, ".codex", "hooks.json"), {
    hooks: { PreToolUse: [customHook] },
  });
  fs.writeFileSync(
    path.join(codexProjectDir, "AGENTS.md"),
    `# Project Instructions

${harnessBlock}
`,
  );

  mirrorCopy(codexTemplatePath, codexProjectDir);

  const codexRootInstruction = readText(path.join(codexProjectDir, "AGENTS.md"));
  assert.ok(
    codexRootInstruction.includes("# AGENTS.md - Workspace Rules"),
    "force-style Codex install must refresh the root instruction from the template",
  );
  assert.ok(
    codexRootInstruction.includes(harnessBlock),
    "force-style Codex install must preserve project-specific Harness blocks",
  );
  assert.equal(
    detectInstalledTarget(codexProjectDir),
    "codex",
    "status detection must read the Codex marker file",
  );

  fs.rmSync(path.join(codexProjectDir, ".agents", ".kit-target"));
  assert.equal(
    detectInstalledTarget(codexProjectDir),
    "codex",
    "status detection must fall back to the Codex root instruction",
  );
  fs.writeFileSync(path.join(codexProjectDir, "GEMINI.md"), "# Gemini\n");
  assert.equal(
    detectInstalledTarget(codexProjectDir),
    null,
    "status fallback must avoid guessing when root instructions are ambiguous",
  );
  fs.rmSync(path.join(codexProjectDir, "GEMINI.md"));
  fs.writeFileSync(path.join(codexProjectDir, ".agents", ".kit-target"), "codex\n");

  fs.writeFileSync(path.join(codexProjectDir, "AGENTS.md"), "# Local Codex Instructions\n");
  mirrorCopy(codexTemplatePath, codexProjectDir, { overwriteRootInstruction: false });
  assert.equal(
    readText(path.join(codexProjectDir, "AGENTS.md")),
    "# Local Codex Instructions\n",
    "update-style Codex install must preserve existing root instructions",
  );

  assert.equal(
    readText(path.join(codexProjectDir, ".codex", "config.toml")),
    'model = "custom-model"\n',
    "custom Codex config must be preserved",
  );
  assert.ok(
    fs.existsSync(path.join(codexProjectDir, ".codex", "hooks", "harness_guard.py")),
    "shared Codex hook policy must be installed",
  );
  assert.ok(
    fs.existsSync(path.join(codexProjectDir, ".codex", "hooks", "codex_adapter.py")),
    "Codex hook adapter must be installed",
  );
  assert.ok(
    fs.existsSync(path.join(codexProjectDir, ".agents", ".kit-target")),
    "runtime folder must be installed",
  );

  const merged = readJson(path.join(codexProjectDir, ".codex", "hooks.json"));
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
      group.hooks?.some((hook) => hook.command?.includes("codex_adapter.py")),
    ).length,
    1,
    "kit hook must not be duplicated on update",
  );

  removeKitCodexHooks(codexProjectDir);
  const cleaned = readJson(path.join(codexProjectDir, ".codex", "hooks.json"));
  assert.deepEqual(
    cleaned.hooks.PreToolUse,
    [customHook],
    "switch cleanup must preserve custom hooks",
  );
  assert.equal(
    fs.existsSync(path.join(codexProjectDir, ".codex", "hooks", "harness_guard.py")),
    false,
    "switch cleanup must remove the shared hook policy",
  );
  assert.equal(
    fs.existsSync(path.join(codexProjectDir, ".codex", "hooks", "codex_adapter.py")),
    false,
    "switch cleanup must remove the Codex adapter",
  );
  mirrorCopy(codexTemplatePath, codexProjectDir);
  cleanupOldTarget(codexTemplatePath, codexProjectDir);
  assert.equal(
    fs.existsSync(path.join(codexProjectDir, "AGENTS.md")),
    false,
    "target switch cleanup must remove the old Codex root instruction",
  );
  assert.equal(
    fs.existsSync(path.join(codexProjectDir, ".codex", "hooks", "harness_guard.py")),
    false,
    "target switch cleanup must remove kit-owned Codex hook files",
  );
  assert.deepEqual(
    readJson(path.join(codexProjectDir, ".codex", "hooks.json")).hooks.PreToolUse,
    [customHook],
    "target switch cleanup must preserve project-owned Codex hooks",
  );
  mirrorCopy(geminiTemplatePath, codexProjectDir);
  assert.equal(
    detectInstalledTarget(codexProjectDir),
    "gemini",
    "status detection must detect Gemini after an isolated target switch",
  );

  const customGeminiHook = {
    enabled: true,
    PreToolUse: [
      {
        matcher: "custom_tool",
        hooks: [{ type: "command", command: "python3 .agents/hooks/custom.py" }],
      },
    ],
  };
  fs.mkdirSync(path.join(geminiProjectDir, ".agents", "hooks"), { recursive: true });
  writeJson(path.join(geminiProjectDir, ".agents", "hooks.json"), {
    "custom-project-hook": customGeminiHook,
  });
  fs.writeFileSync(
    path.join(geminiProjectDir, ".agents", "hooks", "custom.py"),
    'print("custom")\n',
  );

  mirrorCopy(geminiTemplatePath, geminiProjectDir);
  mirrorCopy(geminiTemplatePath, geminiProjectDir, {
    overwriteRootInstruction: false,
  });

  assert.equal(
    detectInstalledTarget(geminiProjectDir),
    "gemini",
    "status detection must read the Gemini marker file",
  );
  const geminiHooks = readJson(path.join(geminiProjectDir, ".agents", "hooks.json"));
  assert.deepEqual(
    geminiHooks["custom-project-hook"],
    customGeminiHook,
    "custom Gemini hook config must be preserved",
  );
  assert.ok(
    geminiHooks["hieund-ai-kit-harness-guard"],
    "managed Gemini hook config must be installed",
  );
  assert.equal(
    Object.keys(geminiHooks).filter((key) => key === "hieund-ai-kit-harness-guard").length,
    1,
    "managed Gemini hook must not be duplicated on update",
  );
  assert.ok(
    fs.existsSync(path.join(geminiProjectDir, ".agents", "hooks", "custom.py")),
    "custom Gemini hook scripts must be preserved",
  );
  assert.ok(
    fs.existsSync(path.join(geminiProjectDir, ".agents", "hooks", "harness_guard.py")),
    "shared Gemini hook policy must be installed",
  );
  assert.ok(
    fs.existsSync(path.join(geminiProjectDir, ".agents", "hooks", "gemini_adapter.py")),
    "Gemini hook adapter must be installed",
  );

  console.log("Installer regression tests passed.");
} finally {
  fs.rmSync(codexProjectDir, { recursive: true, force: true });
  fs.rmSync(geminiProjectDir, { recursive: true, force: true });
  fs.rmSync(path.dirname(binLinkPath), { recursive: true, force: true });
}
