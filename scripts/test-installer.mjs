#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const binDir = fs.mkdtempSync(path.join(os.tmpdir(), "hieund-ai-kit-bin-"));
const binLinkPath = path.join(binDir, "hieund-ai-kit");
const tempDirs = [binDir];

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));
const readText = (filePath) => fs.readFileSync(filePath, "utf8");
const writeJson = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
};
const newDir = (prefix) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
};
const cli = (...args) => execFileSync(process.execPath, [binLinkPath, ...args], { encoding: "utf8" });
const cliFails = (...args) => {
  const result = spawnSync(process.execPath, [binLinkPath, ...args], { encoding: "utf8" });
  assert.notEqual(result.status, 0, `expected failure: ${args.join(" ")}`);
  return result.stderr;
};

const kitSkills = fs.readdirSync(path.join(repoRoot, "templates", ".agents", "skills")).sort();
const starter = readJson(path.join(repoRoot, "templates", "kit.json")).profiles.starter;

try {
  fs.symlinkSync(path.join(repoRoot, "bin", "index.js"), binLinkPath);
  assert.ok(cli("--help").includes("Usage: hieund-ai-kit [options] [command]"), "CLI must parse through an npm-style symlink");

  // --- Full install keeps project hooks and instructions -------------------
  const full = newDir("kit-full-");
  writeJson(path.join(full, ".codex", "hooks.json"), {
    hooks: { PreToolUse: [{ matcher: "custom_tool", hooks: [{ type: "command", command: "echo custom-codex" }] }] },
  });
  writeJson(path.join(full, ".agents", "hooks.json"), {
    "custom-gemini-hook": { enabled: true, PreToolUse: [{ matcher: "custom_tool", hooks: [{ type: "command", command: "echo custom-gemini" }] }] },
  });
  writeJson(path.join(full, ".claude", "settings.json"), {
    model: "sonnet",
    hooks: { PreToolUse: [{ matcher: "custom_tool", hooks: [{ type: "command", command: "echo custom-claude" }] }] },
  });
  for (const file of ["AGENTS.md", "GEMINI.md", "CLAUDE.md"]) {
    fs.writeFileSync(path.join(full, file), `# Project ${file}\n\n<!-- HARNESS:BEGIN -->\n## Harness\n<!-- HARNESS:END -->\n`);
  }

  cli("install", "--path", full, "--source", repoRoot);

  assert.deepEqual(fs.readdirSync(path.join(full, ".agents", "skills")).sort(), kitSkills, "all kit skills installed");
  const fullManifest = readJson(path.join(full, ".ai-kit.json"));
  assert.equal(fullManifest.selection.all, true);
  assert.deepEqual(fullManifest.source, { type: "local", path: repoRoot, mode: "copy" });
  assert.equal(fs.readlinkSync(path.join(full, ".claude", "skills", "debugger")), "../../.agents/skills/debugger");
  assert.ok(fs.existsSync(path.join(full, ".claude", "skills", "debugger", "SKILL.md")), "Claude link resolves");
  assert.ok(!fs.existsSync(path.join(full, ".agents", "gemini", "skills")), "no Gemini skill copy");
  assert.ok(fs.existsSync(path.join(full, ".agents", "gemini", "hooks", "gemini_adapter.py")), "Gemini hooks installed");
  assert.ok(fs.existsSync(path.join(full, ".codex", "hooks", "codex_adapter.py")), "Codex hook scripts installed");

  const codexHooks = readJson(path.join(full, ".codex", "hooks.json"));
  assert.ok(codexHooks.hooks.PreToolUse.some((h) => h.matcher === "custom_tool"), "custom Codex hooks preserved");
  assert.ok(codexHooks.hooks.PreToolUse.some((h) => h.hooks.some((hook) => hook.command.includes("codex_adapter.py"))), "Codex hooks merged");
  const geminiHooks = readJson(path.join(full, ".agents", "hooks.json"));
  assert.ok(geminiHooks["custom-gemini-hook"], "custom Gemini hooks preserved");
  assert.equal(geminiHooks["hieund-ai-kit-harness-guard"].PreToolUse[0].hooks[0].command, "python3 .agents/gemini/hooks/gemini_adapter.py pre-tool");
  const claudeSettings = readJson(path.join(full, ".claude", "settings.json"));
  assert.equal(claudeSettings.model, "sonnet", "custom Claude settings preserved");
  assert.ok(claudeSettings.hooks.PreToolUse.some((h) => h.matcher === "custom_tool"), "custom Claude hooks preserved");
  for (const file of ["AGENTS.md", "GEMINI.md", "CLAUDE.md"]) {
    const text = readText(path.join(full, file));
    assert.ok(text.startsWith(`# Project ${file}`), `${file} keeps project content`);
    assert.ok(text.includes("<!-- KIT:BEGIN -->"), `${file} gains the KIT block`);
  }

  const sharedScript = path.join(full, ".agents", "scripts", "verify_all.py");
  fs.writeFileSync(sharedScript, "print('MANUAL')\n");
  const before = Object.fromEntries(["AGENTS.md", "GEMINI.md", "CLAUDE.md"].map((f) => [f, readText(path.join(full, f))]));
  const rerun = cli("update", "--path", full);
  assert.ok(rerun.includes("unchanged"), "second run reports unchanged skills");
  assert.equal(readText(sharedScript), "print('MANUAL')\n", "modified shared script preserved");
  for (const [file, text] of Object.entries(before)) assert.equal(readText(path.join(full, file)), text, `${file} idempotent`);
  const claudePost = readJson(path.join(full, ".claude", "settings.json"));
  assert.equal(claudePost.hooks.PreToolUse.filter((h) => h.hooks.some((hook) => hook.command.includes("claude_adapter.py"))).length, 1, "Claude hooks not duplicated");
  assert.ok(cli("status", "--path", full).includes("AI Kit: HEALTHY"));

  // --- Profile, add, remove ------------------------------------------------
  const prof = newDir("kit-profile-");
  cli("install", "--path", prof, "--source", repoRoot, "--profile", "starter");
  assert.deepEqual(fs.readdirSync(path.join(prof, ".agents", "skills")).sort(), [...starter].sort());
  cli("install", "security-auditor", "--path", prof);
  assert.ok(fs.existsSync(path.join(prof, ".agents", "skills", "security-auditor", "SKILL.md")));
  cli("remove", "debugger", "--path", prof);
  assert.ok(!fs.existsSync(path.join(prof, ".agents", "skills", "debugger")));
  assert.equal(fs.lstatSync(path.join(prof, ".claude", "skills", "debugger"), { throwIfNoEntry: false }), undefined);
  assert.deepEqual(readJson(path.join(prof, ".ai-kit.json")).selection.exclude, ["debugger"]);
  cli("update", "--path", prof);
  assert.ok(!fs.existsSync(path.join(prof, ".agents", "skills", "debugger")), "update respects exclude");
  assert.match(cliFails("install", "debuger", "--path", prof), /did you mean: debugger/);
  const dropProfile = newDir("kit-drop-profile-");
  cli("install", "security-auditor", "--path", dropProfile, "--source", repoRoot, "--profile", "starter");
  assert.match(cliFails("remove", "--path", dropProfile), /Nothing to remove/);
  cli("remove", "--profile", "starter", "--path", dropProfile);
  assert.deepEqual(readJson(path.join(dropProfile, ".ai-kit.json")).selection.profiles, [], "remove --profile drops the profile");
  assert.deepEqual(fs.readdirSync(path.join(dropProfile, ".agents", "skills")), ["security-auditor"]);

  // --- Project-owned, conflicts, local edits -------------------------------
  const own = newDir("kit-own-");
  fs.mkdirSync(path.join(own, ".agents", "skills", "my-own"), { recursive: true });
  fs.writeFileSync(path.join(own, ".agents", "skills", "my-own", "SKILL.md"), "mine\n");
  fs.mkdirSync(path.join(own, ".agents", "skills", "clean-code"), { recursive: true });
  assert.match(cliFails("install", "--path", own, "--source", repoRoot, "--profile", "starter"), /clean-code.*--force/);
  assert.ok(!fs.existsSync(path.join(own, ".ai-kit.json")), "conflict writes nothing");
  fs.rmSync(path.join(own, ".agents", "skills", "clean-code"), { recursive: true });
  cli("install", "--path", own, "--source", repoRoot, "--profile", "starter");
  const localSkill = path.join(own, ".agents", "skills", "clean-code", "SKILL.md");
  fs.appendFileSync(localSkill, "LOCAL EDIT\n");
  assert.ok(cli("update", "--path", own).includes('Kept locally modified skill "clean-code"'));
  assert.ok(readText(localSkill).includes("LOCAL EDIT"));
  cli("update", "--path", own, "--force");
  assert.ok(!readText(localSkill).includes("LOCAL EDIT"), "--force overwrites local edits");
  assert.equal(readText(path.join(own, ".agents", "skills", "my-own", "SKILL.md")), "mine\n", "project-owned skill untouched");
  assert.ok(!fs.existsSync(path.join(own, ".claude", "skills", "my-own")), "project-owned skill not linked");
  assert.ok(cli("status", "--path", own).includes("my-own"), "status lists project-owned skills");

  // --- Link mode -----------------------------------------------------------
  const kitCopy = newDir("kit-checkout-");
  fs.cpSync(path.join(repoRoot, "templates"), path.join(kitCopy, "templates"), { recursive: true });
  const linked = newDir("kit-link-");
  cli("install", "--path", linked, "--source", kitCopy, "--link", "--profile", "starter");
  const linkedSkill = path.join(linked, ".agents", "skills", "debugger");
  assert.ok(fs.lstatSync(linkedSkill).isSymbolicLink());
  fs.appendFileSync(path.join(kitCopy, "templates", ".agents", "skills", "debugger", "SKILL.md"), "LIVE EDIT\n");
  assert.ok(readText(path.join(linked, ".claude", "skills", "debugger", "SKILL.md")).includes("LIVE EDIT"), "edits visible without reinstall");
  cli("update", "--path", linked, "--source", kitCopy);
  assert.ok(fs.lstatSync(linkedSkill).isDirectory(), "update without --link switches to copies");
  assert.match(cliFails("install", "--path", linked, "--link"), /--link requires --source/);

  // --- Legacy migration ----------------------------------------------------
  const legacy = newDir("kit-legacy-");
  writeJson(path.join(legacy, ".ai-kit.json"), { version: "2.0.0", ref: "main", paths: { installDir: ".agents" } });
  fs.mkdirSync(path.join(legacy, ".agents", "gemini", "skills", "x"), { recursive: true });
  fs.mkdirSync(path.join(legacy, ".agents", "gemini", "agents"), { recursive: true });
  fs.mkdirSync(path.join(legacy, ".agents", "skills", "debugger"), { recursive: true });
  fs.writeFileSync(path.join(legacy, ".agents", "skills", "debugger", "SKILL.md"), "old\n");
  fs.mkdirSync(path.join(legacy, ".agents", "skills", "my-own"), { recursive: true });
  assert.ok(cli("status", "--path", legacy).includes("Legacy install detected"));
  cli("update", "--path", legacy, "--source", repoRoot);
  const migrated = readJson(path.join(legacy, ".ai-kit.json"));
  assert.equal(migrated.formatVersion, 1);
  assert.equal(migrated.selection.all, true);
  assert.ok(!fs.existsSync(path.join(legacy, ".agents", "gemini", "skills")), "legacy Gemini skills removed");
  assert.ok(!fs.existsSync(path.join(legacy, ".agents", "gemini", "agents")), "legacy Gemini agents removed");
  assert.notEqual(readText(path.join(legacy, ".agents", "skills", "debugger", "SKILL.md")), "old\n");
  assert.ok(fs.existsSync(path.join(legacy, ".agents", "skills", "my-own")), "project-owned skill kept");

  // --- Dry run and status --------------------------------------------------
  const dry = newDir("kit-dry-");
  assert.ok(cli("install", "--path", dry, "--source", repoRoot, "--dry-run").includes("dry run"));
  assert.deepEqual(fs.readdirSync(dry), [], "dry run writes nothing");
  fs.unlinkSync(path.join(prof, ".claude", "skills", "clean-code"));
  assert.ok(cli("status", "--path", prof).includes("NEEDS UPDATE"));
  cli("update", "--path", prof);
  assert.ok(cli("status", "--path", prof).includes("AI Kit: HEALTHY"));
  assert.ok(cli("list", "--path", prof).includes("starter"), "list shows profiles");

  console.log("Installer regression tests passed.");
} finally {
  for (const dir of tempDirs) fs.rmSync(dir, { recursive: true, force: true });
}
