#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const verbose = args.includes("--verbose");
const rootArg = args.find((arg) => arg !== "--verbose") ?? ".";
const repoRoot = path.resolve(rootArg);

const checks = [];

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

function readFrontmatter(relativePath) {
  const text = readText(relativePath);
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  return match[1];
}

function frontmatterValue(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : null;
}

function checkSkillFrontmatter(targetName, skillsPath, requireOpenAiYaml) {
  const skillNames = immediateDirectories(skillsPath);

  for (const skillName of skillNames) {
    const skillMd = `${skillsPath}/${skillName}/SKILL.md`;
    const frontmatter = exists(skillMd) ? readFrontmatter(skillMd) : null;

    record(
      `${targetName}:${skillName} has SKILL.md frontmatter`,
      Boolean(frontmatter),
      skillMd,
    );

    if (!frontmatter) continue;

    const declaredName = frontmatterValue(frontmatter, "name");
    record(
      `${targetName}:${skillName} frontmatter name matches folder`,
      declaredName === skillName,
      `expected ${skillName}, got ${declaredName ?? "missing"}`,
    );

    record(
      `${targetName}:${skillName} has description`,
      /^description:/m.test(frontmatter),
      skillMd,
    );

    if (requireOpenAiYaml) {
      record(
        `${targetName}:${skillName} has agents/openai.yaml`,
        exists(`${skillsPath}/${skillName}/agents/openai.yaml`),
        `${skillsPath}/${skillName}/agents/openai.yaml`,
      );
    }
  }
}

const toolkitDocs = readText("docs/product/toolkits.md");
const codexArchitecture = readText("templates/codex/.agents/ARCHITECTURE.md");
const geminiArchitecture = readText("templates/gemini/.agents/ARCHITECTURE.md");

const codexSkillCount = immediateDirectories("templates/codex/.agents/skills").length;
const codexOpenAiCount = immediateDirectories("templates/codex/.agents/skills").filter(
  (skillName) =>
    exists(`templates/codex/.agents/skills/${skillName}/agents/openai.yaml`),
).length;
const geminiSkillCount = immediateDirectories("templates/gemini/.agents/skills").length;
const geminiAgentCount = immediateFiles("templates/gemini/.agents/agents", ".md").length;
const geminiWorkflowCount = immediateFiles("templates/gemini/.agents/workflows", ".md").length;

const docsCodexSkillCount = requireMatch(
  toolkitDocs,
  /Codex[\s\S]*?ships (\d+) skill directories/,
  "Codex skill count in docs/product/toolkits.md",
);
const docsGeminiCounts = toolkitDocs.match(
  /Gemini Antigravity[\s\S]*?ships (\d+) agent files, (\d+) skill directories, (\d+) workflow/,
);
if (!docsGeminiCounts) {
  throw new Error("Could not find Gemini counts in docs/product/toolkits.md");
}

record(
  "docs/product/toolkits.md Codex skill count matches template",
  docsCodexSkillCount === codexSkillCount,
  `docs=${docsCodexSkillCount}, actual=${codexSkillCount}`,
);
record(
  "docs/product/toolkits.md Gemini agent count matches template",
  Number.parseInt(docsGeminiCounts[1], 10) === geminiAgentCount,
  `docs=${docsGeminiCounts[1]}, actual=${geminiAgentCount}`,
);
record(
  "docs/product/toolkits.md Gemini skill count matches template",
  Number.parseInt(docsGeminiCounts[2], 10) === geminiSkillCount,
  `docs=${docsGeminiCounts[2]}, actual=${geminiSkillCount}`,
);
record(
  "docs/product/toolkits.md Gemini workflow count matches template",
  Number.parseInt(docsGeminiCounts[3], 10) === geminiWorkflowCount,
  `docs=${docsGeminiCounts[3]}, actual=${geminiWorkflowCount}`,
);

record(
  "Codex architecture skill count matches template",
  requireMatch(codexArchitecture, /The (\d+) Composable Skills/, "Codex architecture skill count") ===
    codexSkillCount,
  `actual=${codexSkillCount}`,
);
record(
  "Gemini architecture agent count matches template",
  requireMatch(geminiArchitecture, /Agents \((\d+)\)/, "Gemini architecture agent count") ===
    geminiAgentCount,
  `actual=${geminiAgentCount}`,
);
record(
  "Gemini architecture skill count matches template",
  requireMatch(geminiArchitecture, /Skills \((\d+)\)/, "Gemini architecture skill count") ===
    geminiSkillCount,
  `actual=${geminiSkillCount}`,
);
record(
  "Codex openai.yaml coverage matches skill count",
  codexOpenAiCount === codexSkillCount,
  `openai.yaml=${codexOpenAiCount}, skills=${codexSkillCount}`,
);
record(
  "Gemini rules placeholder is empty",
  immediateFiles("templates/gemini/.agents/rules").length === 0,
  "docs/product/toolkits.md describes rules/ as an empty placeholder",
);

checkSkillFrontmatter("codex", "templates/codex/.agents/skills", true);
checkSkillFrontmatter("gemini", "templates/gemini/.agents/skills", false);

const failed = checks.filter((check) => !check.passed);

for (const check of checks) {
  if (check.passed && !verbose) continue;

  const status = check.passed ? "ok" : "FAIL";
  const message = `${status} ${check.name}${check.detail ? ` (${check.detail})` : ""}`;
  const output = check.passed ? console.log : console.error;
  output(message);
}

if (failed.length > 0) {
  console.error(`\nTemplate consistency check failed: ${failed.length} issue(s).`);
  process.exit(1);
}

console.log(`Template consistency check passed: ${checks.length} checks.`);
