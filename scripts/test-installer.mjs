#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mirrorCopy, removeKitCodexHooks } from "../bin/index.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const codexTemplatePath = path.join(repoRoot, "templates", "codex");
const geminiTemplatePath = path.join(repoRoot, "templates", "gemini");
const codexProjectDir = fs.mkdtempSync(path.join(os.tmpdir(), "hieund-ai-kit-codex-"));
const geminiProjectDir = fs.mkdtempSync(path.join(os.tmpdir(), "hieund-ai-kit-gemini-"));
const harnessBlock = `<!-- HARNESS:BEGIN -->
## Harness

Project-specific Harness instructions stay here.
<!-- HARNESS:END -->`;

const customHook = {
  matcher: "custom_tool",
  hooks: [{ type: "command", command: "echo custom-hook" }],
};

try {
  fs.mkdirSync(path.join(codexProjectDir, ".codex"), { recursive: true });
  fs.writeFileSync(
    path.join(codexProjectDir, ".codex", "config.toml"),
    'model = "custom-model"\n',
  );
  fs.writeFileSync(
    path.join(codexProjectDir, ".codex", "hooks.json"),
    `${JSON.stringify({ hooks: { PreToolUse: [customHook] } }, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(codexProjectDir, "AGENTS.md"),
    `# Project Instructions

${harnessBlock}
`,
  );

  mirrorCopy(codexTemplatePath, codexProjectDir);
  mirrorCopy(codexTemplatePath, codexProjectDir, { overwriteRootInstruction: false });

  const codexRootInstruction = fs.readFileSync(
    path.join(codexProjectDir, "AGENTS.md"),
    "utf8",
  );
  assert.ok(
    codexRootInstruction.includes("# AGENTS.md - Workspace Rules"),
    "Codex root instruction must be refreshed from the template",
  );
  assert.ok(
    codexRootInstruction.includes(harnessBlock),
    "Codex install must preserve project-specific Harness blocks",
  );

  assert.equal(
    fs.readFileSync(path.join(codexProjectDir, ".codex", "config.toml"), "utf8"),
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

  const merged = JSON.parse(
    fs.readFileSync(path.join(codexProjectDir, ".codex", "hooks.json"), "utf8"),
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
      group.hooks?.some((hook) => hook.command?.includes("codex_adapter.py")),
    ).length,
    1,
    "kit hook must not be duplicated on update",
  );

  removeKitCodexHooks(codexProjectDir);
  const cleaned = JSON.parse(
    fs.readFileSync(path.join(codexProjectDir, ".codex", "hooks.json"), "utf8"),
  );
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
  fs.writeFileSync(
    path.join(geminiProjectDir, ".agents", "hooks.json"),
    `${JSON.stringify({ "custom-project-hook": customGeminiHook }, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(geminiProjectDir, ".agents", "hooks", "custom.py"),
    'print("custom")\n',
  );

  mirrorCopy(geminiTemplatePath, geminiProjectDir);
  mirrorCopy(geminiTemplatePath, geminiProjectDir, {
    overwriteRootInstruction: false,
  });

  const geminiHooks = JSON.parse(
    fs.readFileSync(path.join(geminiProjectDir, ".agents", "hooks.json"), "utf8"),
  );
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
}
