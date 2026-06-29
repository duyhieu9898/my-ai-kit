#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const binLinkPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "hieund-ai-kit-bin-")), "hieund-ai-kit");

const testEnv = {
  ...process.env,
  HIEUND_AI_KIT_TEMPLATE_SOURCE: path.join(repoRoot, "templates")
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
  // Create link to CLI binary
  fs.symlinkSync(path.join(repoRoot, "bin", "index.js"), binLinkPath);
  const symlinkHelp = execFileSync(process.execPath, [binLinkPath, "--help"], {
    encoding: "utf8",
    env: testEnv
  });
  assert.ok(
    symlinkHelp.includes("Usage: hieund-ai-kit [options] [command]"),
    "CLI must parse when invoked through an npm-style symlink"
  );

  const testProjectDir = fs.mkdtempSync(path.join(os.tmpdir(), "hieund-ai-kit-test-"));
  const installDir = path.join(testProjectDir, ".agents");

  try {
    // -------------------------------------------------------------------------
    // Prep project files for manual edits and hooks
    // -------------------------------------------------------------------------
    fs.mkdirSync(path.join(testProjectDir, ".codex"), { recursive: true });
    writeJson(path.join(testProjectDir, ".codex", "hooks.json"), {
      hooks: {
        PreToolUse: [
          {
            matcher: "custom_tool",
            hooks: [{ type: "command", command: "echo custom-codex" }]
          }
        ]
      }
    });

    fs.mkdirSync(path.join(testProjectDir, ".agents"), { recursive: true });
    writeJson(path.join(testProjectDir, ".agents", "hooks.json"), {
      "custom-gemini-hook": {
        enabled: true,
        PreToolUse: [
          {
            matcher: "custom_tool",
            hooks: [{ type: "command", command: "echo custom-gemini" }]
          }
        ]
      }
    });

    fs.writeFileSync(
      path.join(testProjectDir, "AGENTS.md"),
      `# Project Instructions\n\n<!-- HARNESS:BEGIN -->\n## Harness\n<!-- HARNESS:END -->\n`
    );
    fs.writeFileSync(
      path.join(testProjectDir, "GEMINI.md"),
      `# Gemini Instructions\n\n<!-- HARNESS:BEGIN -->\n## Harness\n<!-- HARNESS:END -->\n`
    );

    // -------------------------------------------------------------------------
    // ASSERTION 1: A single init command installs both runtimes side-by-side
    // -------------------------------------------------------------------------
    execFileSync(process.execPath, [
      binLinkPath,
      "init",
      "--path",
      testProjectDir,
      "--force",
    ], { env: testEnv });

    assert.ok(fs.existsSync(path.join(testProjectDir, "AGENTS.md")), "AGENTS.md must exist at root");
    assert.ok(fs.existsSync(path.join(testProjectDir, "GEMINI.md")), "GEMINI.md must exist at root");
    assert.ok(fs.existsSync(path.join(installDir, "skills")), "Codex runtime (skills/) must exist flat under .agents/");
    assert.ok(fs.existsSync(path.join(installDir, "gemini", "skills")), "Gemini runtime (skills/) must exist nested under .agents/gemini/");

    // -------------------------------------------------------------------------
    // ASSERTION 2: Workspace-level hook files are written correctly and custom hooks preserved
    // -------------------------------------------------------------------------
    const codexHooks = readJson(path.join(testProjectDir, ".codex", "hooks.json"));
    assert.ok(codexHooks.hooks.PreToolUse.some(h => h.matcher === "custom_tool"), "Custom Codex hooks must be preserved");
    assert.ok(codexHooks.hooks.PreToolUse.some(h => h.hooks.some(hook => hook.command.includes("codex_adapter.py"))), "Managed Codex hooks must be merged");

    const geminiHooks = readJson(path.join(testProjectDir, ".agents", "hooks.json"));
    assert.ok(geminiHooks["custom-gemini-hook"], "Custom Gemini hooks must be preserved");
    assert.ok(geminiHooks["hieund-ai-kit-harness-guard"], "Managed Gemini hooks must be merged");

    // -------------------------------------------------------------------------
    // ASSERTION 3: Codex isolation check
    // -------------------------------------------------------------------------
    assert.ok(!fs.existsSync(path.join(installDir, "codex")), "Codex install must not create .agents/codex/skills/");
    assert.ok(fs.existsSync(path.join(installDir, "skills", "debugger", "SKILL.md")), "Codex skills must reside flat at .agents/skills/");

    // -------------------------------------------------------------------------
    // ASSERTION 4: Gemini isolation check
    // -------------------------------------------------------------------------
    assert.ok(!fs.existsSync(path.join(installDir, "gemini", "skills", "debugger")), "Gemini install must not write into Codex flat skills folder");
    assert.ok(fs.existsSync(path.join(installDir, "gemini", "skills", "api-patterns", "SKILL.md")), "Gemini skills must reside nested at .agents/gemini/skills/");

    // -------------------------------------------------------------------------
    // ASSERTION 5: Target-specific instructions check
    // -------------------------------------------------------------------------
    const agentsMdContent = readText(path.join(testProjectDir, "AGENTS.md"));
    const geminiMdContent = readText(path.join(testProjectDir, "GEMINI.md"));
    assert.ok(agentsMdContent.includes("AGENTS.md - Workspace Rules"), "AGENTS.md must contain Codex instruction rules");
    assert.ok(geminiMdContent.includes("GEMINI.md - AG Kit"), "GEMINI.md must contain Gemini instruction rules");
    assert.ok(!agentsMdContent.includes("GEMINI.md"), "AGENTS.md must not contain Gemini cross-references");
    assert.ok(!geminiMdContent.includes("AGENTS.md"), "GEMINI.md must not contain Codex cross-references");

    // -------------------------------------------------------------------------
    // ASSERTION 6: Hooks path rewriting check
    // -------------------------------------------------------------------------
    const adapterCommand = geminiHooks["hieund-ai-kit-harness-guard"].PreToolUse[0].hooks[0].command;
    assert.equal(
      adapterCommand,
      "python3 .agents/gemini/hooks/gemini_adapter.py pre-tool",
      "Gemini hook command path must point to the nested gemini folder"
    );

    // -------------------------------------------------------------------------
    // ASSERTION 7: Shared conflict preservation
    // -------------------------------------------------------------------------
    const sharedScriptPath = path.join(installDir, "scripts", "verify_all.py");
    assert.ok(fs.existsSync(sharedScriptPath), "Shared script verify_all.py must exist");
    // Manually modify the shared script
    fs.writeFileSync(sharedScriptPath, "print('MANUAL_MODIFICATION')\n");
    
    // Run init again
    execFileSync(process.execPath, [
      binLinkPath,
      "init",
      "--path",
      testProjectDir,
      "--force",
    ], { env: testEnv });

    assert.equal(
      readText(sharedScriptPath),
      "print('MANUAL_MODIFICATION')\n",
      "Manual modification of shared script must be preserved and not silently overwritten during init"
    );

    // -------------------------------------------------------------------------
    // ASSERTION 8: Re-init idempotency
    // -------------------------------------------------------------------------
    // Run init a second time (above ran once, let's run it again and check blocks)
    const geminiMdPre = readText(path.join(testProjectDir, "GEMINI.md"));
    const agentsMdPre = readText(path.join(testProjectDir, "AGENTS.md"));

    execFileSync(process.execPath, [
      binLinkPath,
      "init",
      "--path",
      testProjectDir,
      "--force",
    ], { env: testEnv });

    const geminiMdPost = readText(path.join(testProjectDir, "GEMINI.md"));
    const agentsMdPost = readText(path.join(testProjectDir, "AGENTS.md"));

    assert.equal(geminiMdPre, geminiMdPost, "GEMINI.md content must be identical and not duplicated on consecutive inits");
    assert.equal(agentsMdPre, agentsMdPost, "AGENTS.md content must be identical and not duplicated on consecutive inits");

    const geminiHooksPost = readJson(path.join(testProjectDir, ".agents", "hooks.json"));
    assert.ok(geminiHooksPost["hieund-ai-kit-harness-guard"], "Harness guard hooks must exist");
    // Count the harness guard entries
    assert.equal(
      Object.keys(geminiHooksPost).filter(k => k === "hieund-ai-kit-harness-guard").length,
      1,
      "Managed hook keys must be idempotent and not duplicated"
    );

    // -------------------------------------------------------------------------
    // ASSERTION 9: Legacy migration
    // -------------------------------------------------------------------------
    const configPath = path.join(testProjectDir, ".ai-kit.json");
    writeJson(configPath, {
      target: "codex",
      targets: {
        codex: { version: "1.0.0" }
      },
      version: "1.0.0",
      ref: "main",
      installedAt: "old-date",
      paths: { installDir: ".agents" }
    });

    execFileSync(process.execPath, [
      binLinkPath,
      "update",
      "--path",
      testProjectDir,
    ], { env: testEnv });

    const migratedConfig = readJson(configPath);
    assert.equal(migratedConfig.target, undefined, "Old target property must be removed");
    assert.equal(migratedConfig.targets, undefined, "Old targets property must be removed");
    assert.equal(migratedConfig.version, "2.0.0", "Version must be updated");
    assert.ok(migratedConfig.installedAt !== "old-date", "installedAt date must be refreshed");

    // -------------------------------------------------------------------------
    // ASSERTION 10: Status check and Corruption detection
    // -------------------------------------------------------------------------
    const statusOutput = execFileSync(process.execPath, [
      binLinkPath,
      "status",
      "--path",
      testProjectDir,
    ], { encoding: "utf8", env: testEnv });
    assert.ok(statusOutput.includes("AI Kit: INSTALLED"), "Status must report INSTALLED");

    // Break Codex skills folder
    fs.rmSync(path.join(installDir, "skills"), { recursive: true, force: true });
    
    const corruptedStatus = execFileSync(process.execPath, [
      binLinkPath,
      "status",
      "--path",
      testProjectDir,
    ], { encoding: "utf8", env: testEnv });
    assert.ok(corruptedStatus.includes("CORRUPTED (Missing Codex or Gemini runtime)"), "Status must report CORRUPTED when Codex is missing");

    // Restore Codex skills and break Gemini folder
    fs.mkdirSync(path.join(installDir, "skills"));
    fs.rmSync(path.join(installDir, "gemini"), { recursive: true, force: true });
    
    const corruptedStatus2 = execFileSync(process.execPath, [
      binLinkPath,
      "status",
      "--path",
      testProjectDir,
    ], { encoding: "utf8", env: testEnv });
    assert.ok(corruptedStatus2.includes("CORRUPTED (Missing Codex or Gemini runtime)"), "Status must report CORRUPTED when Gemini is missing");

    // -------------------------------------------------------------------------
    // ASSERTION 11: Repair restores both runtimes
    // -------------------------------------------------------------------------
    execFileSync(process.execPath, [
      binLinkPath,
      "repair",
      "--path",
      testProjectDir,
    ], { env: testEnv });

    assert.ok(fs.existsSync(path.join(installDir, "skills")), "Repair must restore Codex folder");
    assert.ok(fs.existsSync(path.join(installDir, "gemini")), "Repair must restore Gemini folder");

    const repairedStatus = execFileSync(process.execPath, [
      binLinkPath,
      "status",
      "--path",
      testProjectDir,
    ], { encoding: "utf8", env: testEnv });
    assert.ok(repairedStatus.includes("AI Kit: INSTALLED"), "Status must report INSTALLED after repair");

    // -------------------------------------------------------------------------
    // ASSERTION 12: Update refreshes both runtimes simultaneously
    // -------------------------------------------------------------------------
    // We modify some files to trace them
    const codexSkillPath = path.join(installDir, "skills", "debugger", "SKILL.md");
    const geminiSkillPath = path.join(installDir, "gemini", "skills", "api-patterns", "SKILL.md");
    fs.writeFileSync(codexSkillPath, "CHANGED_CODEX_SKILL\n");
    fs.writeFileSync(geminiSkillPath, "CHANGED_GEMINI_SKILL\n");

    execFileSync(process.execPath, [
      binLinkPath,
      "update",
      "--path",
      testProjectDir,
    ], { env: testEnv });

    assert.ok(readText(codexSkillPath) !== "CHANGED_CODEX_SKILL\n", "Update must refresh Codex skills from template");
    assert.ok(readText(geminiSkillPath) !== "CHANGED_GEMINI_SKILL\n", "Update must refresh Gemini skills from template");

  } finally {
    fs.rmSync(testProjectDir, { recursive: true, force: true });
  }

  console.log("Installer regression tests passed.");
} finally {
  fs.rmSync(path.dirname(binLinkPath), { recursive: true, force: true });
}
