#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { lintSkill } from "./skill-standard.mjs";

const args = process.argv.slice(2);
const verbose = args.includes("--verbose");
// Skill-standard warnings fail by default; --lenient reports them without failing.
const strict = !args.includes("--lenient");
const rootArg = args.find((arg) => !arg.startsWith("--")) ?? ".";
const repoRoot = path.resolve(rootArg);

const checks = [];
const warnings = [];

function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function immediateDirectories(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return [];

  return fs
    .readdirSync(absolutePath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function immediateFiles(relativePath, extension = null) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return [];

  return fs
    .readdirSync(absolutePath, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => !extension || name.endsWith(extension))
    .sort();
}

function recursiveFiles(relativePath, extension = null) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return [];

  return fs
    .readdirSync(absolutePath, { withFileTypes: true })
    .flatMap((entry) => {
      const child = path.join(relativePath, entry.name);
      if (entry.isDirectory()) {
        return recursiveFiles(child, extension);
      }
      if (entry.isFile() && (!extension || entry.name.endsWith(extension))) {
        return [child];
      }
      return [];
    })
    .sort();
}

function record(name, passed, detail = "") {
  checks.push({ name, passed, detail });
}

function requireMatch(text, pattern, label) {
  const match = text.match(pattern);
  if (!match) {
    throw new Error(`Could not find ${label}`);
  }
  return Number.parseInt(match[1], 10);
}

function strayPaths(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  const entries = fs.readdirSync(absolutePath, { withFileTypes: true });
  if (entries.length === 0) return [relativePath];

  return entries
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const child = path.join(relativePath, entry.name);
      return entry.name === "__pycache__" ? [child] : strayPaths(child);
    });
}

function checkSkillStandard(targetName, skillsPath, skillNames) {
  for (const skillName of immediateDirectories(skillsPath)) {
    const skillDir = `${skillsPath}/${skillName}`;
    const skillMd = `${skillDir}/SKILL.md`;
    const openAiYamlPath = `${skillDir}/agents/openai.yaml`;
    const findings = lintSkill({
      name: skillName,
      skillMd: exists(skillMd) ? readText(skillMd) : "",
      openAiYaml: exists(openAiYamlPath) ? readText(openAiYamlPath) : null,
      skillNames,
      strayPaths: strayPaths(skillDir).filter((stray) => stray !== skillDir),
    });

    for (const finding of findings) {
      const name = `${targetName}:${skillName} ${finding.rule}`;
      if (finding.level === "error") {
        record(name, false, finding.detail || skillMd);
      } else {
        warnings.push({ name, detail: finding.detail });
      }
    }
    record(
      `${targetName}:${skillName} passes spec-level skill checks`,
      findings.every((finding) => finding.level !== "error"),
      skillMd,
    );
  }
}

function markdownRelativeLinks(relativePath) {
  const text = readText(relativePath);
  return [...text.matchAll(/\[[^\]]+\]\(([^)#]+)(?:#[^)]+)?\)/g)]
    .map((match) => match[1])
    .filter((target) => !target.startsWith("#") && !/^[a-z]+:/i.test(target));
}

function checkRelativeLinks(relativePath) {
  for (const target of markdownRelativeLinks(relativePath)) {
    const resolved = path.resolve(
      path.dirname(path.join(repoRoot, relativePath)),
      target,
    );
    record(
      `${relativePath} link resolves: ${target}`,
      fs.existsSync(resolved),
      resolved,
    );
  }
}

function checkSkillReferenceLinks(targetName, skillNames, markdownPaths) {
  for (const relativePath of markdownPaths) {
    for (const target of markdownRelativeLinks(relativePath)) {
      const match = target.match(/(?:^|\/)([a-z0-9-]+)\/SKILL\.md$/);
      if (!match) continue;

      record(
        `${targetName}:${relativePath} skill reference exists: ${match[1]}`,
        skillNames.has(match[1]),
        target,
      );
    }
  }
}

const toolkitDocs = readText("docs/product/toolkits.md");
const codexArchitecture = readText("templates/.agents/ARCHITECTURE.md");
const sharedSkillsPath = "templates/.agents/skills";
const geminiSkillsPath = "templates/.agent/skills";
const sharedSkillNames = new Set(immediateDirectories(sharedSkillsPath));
// Antigravity reads both folders; Codex and Claude see only the shared one.
const geminiSkillNames = new Set([...sharedSkillNames, ...immediateDirectories(geminiSkillsPath)]);

const codexSkillCount = sharedSkillNames.size;
const geminiOnlySkillCount = immediateDirectories(geminiSkillsPath).length;
const codexOpenAiCount = [...sharedSkillNames].filter(
  (skillName) =>
    exists(`templates/.agents/skills/${skillName}/agents/openai.yaml`),
).length;
const codexUxAuditConfigPath = "templates/.agents/ux_audit.json";
const codexHooksConfigPath = "templates/.codex/hooks.json";
const codexHarnessGuardPath = "templates/.codex/hooks/harness_guard.py";
const codexHookAdapterPath = "templates/.codex/hooks/codex_adapter.py";
const geminiHooksConfigPath = "templates/.agents/hooks.json";
const geminiHarnessGuardPath = "templates/.agents/gemini/hooks/harness_guard.py";
const geminiHookAdapterPath = "templates/.agents/gemini/hooks/gemini_adapter.py";
const claudeRootInstructionPath = "templates/CLAUDE.md";
const claudeSettingsPath = "templates/.claude/settings.json";
const claudeHarnessGuardPath = "templates/.agents/claude/hooks/harness_guard.py";
const claudeHookAdapterPath = "templates/.agents/claude/hooks/claude_adapter.py";
const codexSkillMarkdownPaths = recursiveFiles(sharedSkillsPath, ".md");
const geminiSkillMarkdownPaths = recursiveFiles(geminiSkillsPath, ".md");
const templateMarkdownPaths = [...codexSkillMarkdownPaths, ...geminiSkillMarkdownPaths];

const docsCodexSkillCount = requireMatch(
  toolkitDocs,
  /Codex[\s\S]*?ships (\d+) skill directories/,
  "Codex skill count in docs/product/toolkits.md",
);

record(
  "docs/product/toolkits.md Codex skill count matches template",
  docsCodexSkillCount === codexSkillCount,
  `docs=${docsCodexSkillCount}, actual=${codexSkillCount}`,
);
const docsGeminiOnlySkillCount = requireMatch(
  toolkitDocs,
  /ships (\d+) Gemini-only\s+skill directories/,
  "Gemini-only skill count in docs/product/toolkits.md",
);
record(
  "docs/product/toolkits.md Gemini-only skill count matches template",
  docsGeminiOnlySkillCount === geminiOnlySkillCount,
  `docs=${docsGeminiOnlySkillCount}, actual=${geminiOnlySkillCount}`,
);

record(
  "Codex architecture skill count matches template",
  requireMatch(codexArchitecture, /The (\d+) Composable Skills/, "Codex architecture skill count") ===
    codexSkillCount,
  `actual=${codexSkillCount}`,
);
record(
  "Codex openai.yaml coverage matches skill count",
  codexOpenAiCount === codexSkillCount,
  `openai.yaml=${codexOpenAiCount}, skills=${codexSkillCount}`,
);
record(
  "UX audit config exists",
  exists(codexUxAuditConfigPath),
  codexUxAuditConfigPath,
);
record(
  "Codex lifecycle hook files exist",
  exists(codexHooksConfigPath) &&
    exists(codexHarnessGuardPath) &&
    exists(codexHookAdapterPath),
  `${codexHooksConfigPath}, ${codexHarnessGuardPath}, ${codexHookAdapterPath}`,
);
record(
  "Gemini lifecycle hook files exist",
  exists(geminiHooksConfigPath) &&
    exists(geminiHarnessGuardPath) &&
    exists(geminiHookAdapterPath),
  `${geminiHooksConfigPath}, ${geminiHarnessGuardPath}, ${geminiHookAdapterPath}`,
);
record(
  "Claude Code instruction and hook files exist",
  exists(claudeRootInstructionPath) &&
    exists(claudeSettingsPath) &&
    exists(claudeHarnessGuardPath) &&
    exists(claudeHookAdapterPath),
  `${claudeRootInstructionPath}, ${claudeSettingsPath}, ${claudeHarnessGuardPath}, ${claudeHookAdapterPath}`,
);
if (exists(codexHooksConfigPath)) {
  const codexHooksConfig = JSON.parse(readText(codexHooksConfigPath));
  const hookText = JSON.stringify(codexHooksConfig);
  record(
    "Codex hook config targets current shell tool names",
    hookText.includes("exec_command") && hookText.includes("codex_adapter.py"),
    codexHooksConfigPath,
  );
}
if (exists(geminiHooksConfigPath)) {
  const geminiHooksConfig = JSON.parse(readText(geminiHooksConfigPath));
  const managedHook = geminiHooksConfig["hieund-ai-kit-harness-guard"];
  record(
    "Gemini hook config uses native lifecycle events",
    Array.isArray(managedHook?.PreToolUse) &&
      managedHook?.PostToolUse === undefined &&
      JSON.stringify(managedHook).includes("gemini_adapter.py"),
    geminiHooksConfigPath,
  );
}
if (exists(claudeSettingsPath)) {
  const claudeSettings = JSON.parse(readText(claudeSettingsPath));
  const hookText = JSON.stringify(claudeSettings);
  record(
    "Claude Code settings use native lifecycle hooks",
    hookText.includes("PreToolUse") &&
      hookText.includes("PostToolUse") &&
      hookText.includes("claude_adapter.py"),
    claudeSettingsPath,
  );
}
if (exists(codexHarnessGuardPath) && exists(geminiHarnessGuardPath) && exists(claudeHarnessGuardPath)) {
  record(
    "Codex, Gemini, and Claude share the same Harness guard policy",
    readText(codexHarnessGuardPath) === readText(geminiHarnessGuardPath) &&
      readText(codexHarnessGuardPath) === readText(claudeHarnessGuardPath),
    `${codexHarnessGuardPath}, ${geminiHarnessGuardPath}, ${claudeHarnessGuardPath}`,
  );
}
checkSkillStandard("codex", sharedSkillsPath, sharedSkillNames);
checkSkillStandard("gemini", geminiSkillsPath, geminiSkillNames);
const kitRegistry = JSON.parse(readText("templates/kit.json"));
record(
  "templates/kit.json declares formatVersion 2",
  kitRegistry.formatVersion === 2,
  `formatVersion=${kitRegistry.formatVersion}`,
);
for (const [profileName, skillNames] of Object.entries(kitRegistry.profiles ?? {})) {
  for (const skillName of skillNames) {
    record(
      `kit.json profile ${profileName} references existing skill ${skillName}`,
      geminiSkillNames.has(skillName),
      skillName,
    );
  }
}
for (const markdownPath of templateMarkdownPaths) {
  checkRelativeLinks(markdownPath);
}
checkSkillReferenceLinks("codex", sharedSkillNames, codexSkillMarkdownPaths);
checkSkillReferenceLinks("gemini", geminiSkillNames, geminiSkillMarkdownPaths);

if (strict) {
  for (const warning of warnings) record(warning.name, false, warning.detail);
}
const failed = checks.filter((check) => !check.passed);

for (const check of checks) {
  if (check.passed && !verbose) continue;

  const status = check.passed ? "ok" : "FAIL";
  const message = `${status} ${check.name}${check.detail ? ` (${check.detail})` : ""}`;
  const output = check.passed ? console.log : console.error;
  output(message);
}

if (!strict && warnings.length > 0) {
  if (verbose) {
    for (const warning of warnings) {
      console.warn(`warn ${warning.name}${warning.detail ? ` (${warning.detail})` : ""}`);
    }
  }
  const byRule = new Map();
  for (const warning of warnings) {
    const rule = warning.name.replace(/^\S+ /, "");
    byRule.set(rule, (byRule.get(rule) ?? 0) + 1);
  }
  console.warn(`Skill standard warnings: ${warnings.length} (see docs/skills/SKILL_STANDARD.md)`);
  for (const [rule, count] of [...byRule].sort((a, b) => b[1] - a[1])) {
    console.warn(`  ${String(count).padStart(3)}  ${rule}`);
  }
  if (!verbose) console.warn("  Run with --verbose to list them; they fail the check without --lenient.");
}

if (failed.length > 0) {
  console.error(`\nTemplate consistency check failed: ${failed.length} issue(s).`);
  process.exit(1);
}

console.log(`Template consistency check passed: ${checks.length} checks.`);
