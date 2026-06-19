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

const toolkitDocs = readText("docs/product/toolkits.md");
const codexArchitecture = readText("templates/codex/.agents/ARCHITECTURE.md");
const geminiArchitecture = readText("templates/gemini/.agents/ARCHITECTURE.md");
const projectPlannerPath =
  "templates/codex/.agents/skills/project-planner/SKILL.md";
const planWritingPath = "templates/codex/.agents/skills/plan-writing/SKILL.md";
const projectPlannerOpenAiPath =
  "templates/codex/.agents/skills/project-planner/agents/openai.yaml";
const projectPlanner = readText(projectPlannerPath);
const planWriting = readText(planWritingPath);
const projectPlannerOpenAi = readText(projectPlannerOpenAiPath);
const geminiProjectPlannerPath =
  "templates/gemini/.agents/agents/project-planner.md";
const geminiPlanWritingPath =
  "templates/gemini/.agents/skills/plan-writing/SKILL.md";
const geminiPlanWorkflowPath = "templates/gemini/.agents/workflows/plan.md";
const geminiProjectPlanner = readText(geminiProjectPlannerPath);
const geminiPlanWorkflow = readText(geminiPlanWorkflowPath);

const codexSkillCount = immediateDirectories("templates/codex/.agents/skills").length;
const codexOpenAiCount = immediateDirectories("templates/codex/.agents/skills").filter(
  (skillName) =>
    exists(`templates/codex/.agents/skills/${skillName}/agents/openai.yaml`),
).length;
const geminiSkillCount = immediateDirectories("templates/gemini/.agents/skills").length;
const geminiAgentCount = immediateFiles("templates/gemini/.agents/agents", ".md").length;
const geminiWorkflowCount = immediateFiles("templates/gemini/.agents/workflows", ".md").length;
const codexUxAuditConfigPath = "templates/codex/.agents/ux_audit.json";
const geminiUxAuditConfigPath = "templates/gemini/.agents/ux_audit.json";
const codexHooksConfigPath = "templates/codex/.codex/hooks.json";
const codexHarnessGuardPath = "templates/codex/.codex/hooks/harness_guard.py";

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
  "Codex and Gemini UX audit configs both exist",
  exists(codexUxAuditConfigPath) && exists(geminiUxAuditConfigPath),
  `${codexUxAuditConfigPath}, ${geminiUxAuditConfigPath}`,
);
record(
  "Codex lifecycle hook files exist",
  exists(codexHooksConfigPath) && exists(codexHarnessGuardPath),
  `${codexHooksConfigPath}, ${codexHarnessGuardPath}`,
);
if (exists(codexHooksConfigPath)) {
  const codexHooksConfig = JSON.parse(readText(codexHooksConfigPath));
  const hookText = JSON.stringify(codexHooksConfig);
  record(
    "Codex hook config targets current shell tool names",
    hookText.includes("exec_command") && hookText.includes("harness_guard.py"),
    codexHooksConfigPath,
  );
}
if (exists(codexUxAuditConfigPath) && exists(geminiUxAuditConfigPath)) {
  const codexUxAuditConfig = JSON.parse(readText(codexUxAuditConfigPath));
  const geminiUxAuditConfig = JSON.parse(readText(geminiUxAuditConfigPath));
  record(
    "Codex and Gemini UX audit configs match",
    JSON.stringify(codexUxAuditConfig) === JSON.stringify(geminiUxAuditConfig),
    `${codexUxAuditConfigPath}, ${geminiUxAuditConfigPath}`,
  );
}


checkSkillFrontmatter("codex", "templates/codex/.agents/skills", true);
checkSkillFrontmatter("gemini", "templates/gemini/.agents/skills", false);
checkRelativeLinks(projectPlannerPath);
checkRelativeLinks(planWritingPath);
checkRelativeLinks(geminiProjectPlannerPath);
checkRelativeLinks(geminiPlanWritingPath);
checkRelativeLinks(geminiPlanWorkflowPath);

record(
  "project-planner uses one canonical default plan path",
  projectPlanner.includes("docs/PLAN-{task-slug}.md") &&
    !projectPlanner.includes("./{task-slug}.md (project root)"),
  projectPlannerPath,
);
record(
  "project-planner does not require removed specialist skills",
  !/\b(orchestrator|mobile-developer|coordinator-mode|context-compression)\b/.test(
    projectPlanner,
  ),
  projectPlannerPath,
);
record(
  "project-planner verification remains stack-neutral",
  projectPlanner.includes("Select Proportional Verification") &&
    !projectPlanner.includes("npm run build") &&
    !projectPlanner.includes("verify_all.py"),
  projectPlannerPath,
);
record(
  "project-planner default prompt is actionable",
  /default_prompt:\s*"Use \$project-planner .+"/.test(projectPlannerOpenAi),
  projectPlannerOpenAiPath,
);
record(
  "plan-writing stays bounded and planning-only",
  planWriting.includes("bounded, understood change") &&
    planWriting.includes("../project-planner/SKILL.md") &&
    !planWriting.includes("For NEW PROJECT") &&
    !planWriting.includes("Execute tasks step-by-step") &&
    !planWriting.includes("Phase X"),
  planWritingPath,
);
record(
  "Gemini project-planner uses one canonical default plan path",
  geminiProjectPlanner.includes("docs/PLAN-{task-slug}.md") &&
    !geminiProjectPlanner.includes("./{task-slug}.md (project root)"),
  geminiProjectPlannerPath,
);
record(
  "Gemini project-planner does not require removed specialist skills",
  !/\b(mobile-developer|coordinator-mode|context-compression)\b/.test(
    geminiProjectPlanner,
  ),
  geminiProjectPlannerPath,
);
record(
  "Gemini project-planner verification remains stack-neutral",
  geminiProjectPlanner.includes("Select Proportional Verification") &&
    !geminiProjectPlanner.includes("npm run build") &&
    !geminiProjectPlanner.includes("verify_all.py"),
  geminiProjectPlannerPath,
);
record(
  "Gemini plan workflow matches planner output contract",
  geminiPlanWorkflow.includes("docs/PLAN-{task-slug}.md") &&
    geminiPlanWorkflow.includes("INPUT -> OUTPUT -> VERIFY") &&
    !geminiPlanWorkflow.includes("Phase X"),
  geminiPlanWorkflowPath,
);

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
