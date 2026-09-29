# Skill Distribution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the duplicated per-runtime skill trees with one skill source and a manifest-based installer that installs all skills, a profile, or individual skills, in copy or link mode, and exposes them to Claude Code through symlinks.

**Architecture:** `templates/.agents/skills/` becomes the only skill source, described by `templates/kit.json` (format version and profiles). The CLI is split into focused modules under `lib/`: pure selection and planning logic, filesystem appliers, and the existing hook and root-instruction merges moved out of `bin/index.js`. One pipeline serves `install`, `update`, and `remove`, and writes the project manifest `.ai-kit.json` last.

**Tech Stack:** Node.js 22 ESM, `commander`, `chalk`, `giget`, `node:test`, `node:assert/strict`. Python 3 for existing validator tests.

**Spec:** `docs/specs/2026-09-29-skill-distribution-design.md`

## Global Constraints

- Per-project install only; no global install.
- One skill source: `templates/.agents/skills/<name>/`.
- Claude Code discovery: relative symlink `.claude/skills/<name>` -> `../../.agents/skills/<name>`. No copy fallback; symlink failure aborts.
- Default source `github:duyhieu9898/my-ai-kit` at ref `main`; `--source <dir>` reads `<dir>/templates`; `--link` requires `--source`.
- `kit.json` `formatVersion` supported by this CLI: `1`.
- Manifest file: `.ai-kit.json` with `formatVersion: 1`, `source`, `selection {all, profiles, skills, exclude}`, `managedSkills {name: {hash?}}`, `installedAt`, `harness`, `features`.
- Hash: `sha256:` over sorted relative paths and file contents, excluding `__pycache__/` and `*.pyc`; omitted in link mode.
- Project-owned skills (not in `managedSkills`) are never modified or removed.
- Root instruction content is unchanged except `GEMINI.md` path fixes.
- Harness mechanism is unchanged.
- `init` is an alias of `install`; `repair` and `--branch` are removed.
- Windows symlink support is out of scope.
- No new runtime dependencies.

## Review Focus

- A kit checkout used in link mode is moved or deleted: `update` must fail with a message naming `--source <new path>` or `--ref main`, not a stack trace. Pinned in Task 9.
- Running a skill's Python script creates `__pycache__/` inside the skill: the skill must not be reported as locally modified. Pinned in Task 4.
- `.claude/skills/<name>` is already a user symlink pointing somewhere else (for example into another repo): the kit must leave it alone and warn. Pinned in Task 8.
- An interrupted copy leaves `.agents/skills/.<name>.tmp-*` behind: the next run must remove it and never list it as a project-owned skill. Pinned in Task 8 and Task 10.
- `remove` is given a misspelled or unknown skill name: it must fail with close matches instead of silently adding a meaningless exclude. Pinned in Task 10.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `templates/kit.json` | Registry: `formatVersion`, `profiles`. |
| `lib/errors.js` | `KitError` for expected, user-facing failures. |
| `lib/fsx.js` | `lstatOrNull`. |
| `lib/integrations.js` | Hook merges, root instruction block merge, shared assets, runtime hook folders, Codex hook scripts, `detectHarness`. Moved from `bin/index.js`. |
| `lib/registry.js` | Load and validate `kit.json`; list skills. |
| `lib/hash.js` | `hashSkillDir`, `isIgnoredName`. |
| `lib/resolve.js` | Pure selection logic and unknown-name messages. |
| `lib/manifest.js` | Read, migrate, create, write `.ai-kit.json`. |
| `lib/plan.js` | Classify each skill into an action. |
| `lib/skills.js` | Apply actions, Claude links, legacy adoption, stale staging cleanup. |
| `lib/source.js` | Resolve and fetch the template source. |
| `lib/pipeline.js` | `runPipeline`, `loadCatalog`. |
| `lib/status.js` | `collectStatus` (offline). |
| `bin/index.js` | Commander definitions and output only. |
| `test/*.test.js` | Unit tests (`node --test`). |
| `test/helpers.js` | Temp kit and project fixtures. |
| `scripts/test-installer.mjs` | End-to-end CLI tests against this repository. |

The spec's module table has no home for pipeline orchestration and status; this plan adds `lib/pipeline.js`, `lib/status.js`, `lib/errors.js`, and `lib/fsx.js` for that.

---

### Task 1: Remove duplicated Gemini assets and the shared runtime copy

**Files:**
- Delete: `templates/.agents/gemini/skills/`, `templates/.agents/gemini/agents/`, `templates/.agents/gemini/workflows/`, `templates/.agents/gemini/ARCHITECTURE.md`
- Delete: `shared/runtime/`, `scripts/sync-shared-runtime.mjs`, `scripts/test-shared-runtime.mjs`, `scripts/count_template_assets.py`
- Modify: `templates/GEMINI.md`, `GEMINI.md`, `.gitignore`, `package.json`, `scripts/check-template-consistency.mjs`, `scripts/test_api_validator.py`, `scripts/test-validator-regressions.py`, `scripts/test-installer.mjs`, `docs/product/toolkits.md`
- Add to git: `templates/.codex/hooks.json`, `templates/.codex/hooks/*.py`

**Interfaces:**
- Consumes: nothing.
- Produces: a template tree with a single skill source; `npm run verify` green.

- [ ] **Step 1: Delete the duplicated trees**

```bash
git rm -r -q templates/.agents/gemini/skills templates/.agents/gemini/agents templates/.agents/gemini/workflows templates/.agents/gemini/ARCHITECTURE.md
git rm -r -q shared/runtime scripts/sync-shared-runtime.mjs scripts/test-shared-runtime.mjs scripts/count_template_assets.py
ls templates/.agents/gemini
```

Expected: only `hooks`.

- [ ] **Step 2: Fix Gemini paths in both GEMINI files**

```bash
sed -i \
  -e 's#\.agents/gemini/skills/vulnerability-scanner/#.agents/skills/security-auditor/#g' \
  -e 's#\.agents/gemini/skills/#.agents/skills/#g' \
  -e 's#@\[\.agents/gemini/skills/clean-code\]#@[.agents/skills/clean-code]#g' \
  -e 's#\.agents/gemini/agents/frontend-specialist\.md#.agents/skills/frontend-specialist/SKILL.md#g' \
  templates/GEMINI.md GEMINI.md
grep -n "gemini/" templates/GEMINI.md GEMINI.md
```

Expected: no output.

- [ ] **Step 3: Ship the Codex hook template**

`.gitignore` line `.codex` ignores `templates/.codex/` too, so GitHub installs never receive Codex hooks. Anchor it to the root:

```bash
sed -i 's#^\.codex$#/.codex#' .gitignore
git add templates/.codex/hooks.json templates/.codex/hooks/codex_adapter.py templates/.codex/hooks/harness_guard.py
git ls-files templates/.codex
```

Expected: the three files are listed.

- [ ] **Step 4: Drop shared-runtime npm scripts**

In `package.json` `scripts`, delete `sync:shared-runtime`, `check:shared-runtime`, `test:shared-runtime`, and set:

```json
"check:templates": "npm run check:shared-hooks && node scripts/check-template-consistency.mjs",
```

- [ ] **Step 5: Remove Gemini checks from the consistency script**

In `scripts/check-template-consistency.mjs`:

1. Delete the declarations `geminiArchitecture`, `geminiProjectPlannerPath`, `geminiPlanWritingPath`, `geminiPlanWorkflowPath`, `geminiProjectPlanner`, `geminiPlanWorkflow`, `geminiSkillCount`, `geminiAgentCount`, `geminiWorkflowCount`, `geminiUxAuditConfigPath`, `geminiSkillMarkdownPaths`, `geminiAgentMarkdownPaths`, `geminiWorkflowMarkdownPaths`, and `docsGeminiCounts` with its `if (!docsGeminiCounts)` guard.
2. Replace the `templateMarkdownPaths` declaration with:

```js
const templateMarkdownPaths = codexSkillMarkdownPaths;
```

3. Delete the `record(...)` calls named: `docs/product/toolkits.md Gemini agent count matches template`, `... Gemini skill count matches template`, `... Gemini workflow count matches template`, `Gemini architecture agent count matches template`, `Gemini architecture skill count matches template`, `Codex and Gemini UX audit configs match` (the whole `if` block), `Gemini project-planner uses one canonical default plan path`, `Gemini project-planner does not require removed specialist skills`, `Gemini project-planner verification remains stack-neutral`, `Gemini plan workflow matches planner output contract`.
4. Replace the `Codex and Gemini UX audit configs both exist` record with:

```js
record(
  "UX audit config exists",
  exists(codexUxAuditConfigPath),
  codexUxAuditConfigPath,
);
```

5. Delete `checkSkillFrontmatter("gemini", ...)` and the `checkSkillReferenceLinks("gemini", ...)` call.

Keep every Gemini hook check (`geminiHooksConfigPath`, `geminiHarnessGuardPath`, `geminiHookAdapterPath`).

- [ ] **Step 6: Update the toolkit contract doc**

In `docs/product/toolkits.md`, replace the Gemini bullets `- Preserve its agents, skills, workflows, scripts, and shared assets.` and `- The current template ships 15 agent files, 29 skill directories, 10 workflow` plus its continuation line with:

```markdown
- Skills: Antigravity discovers the shared `.agents/skills/` directory; the kit
  ships no Gemini-specific skills, agents, or workflows.
```

Replace the bullet that mentions `shared/runtime/` (around line 55) with:

```markdown
- Skill scripts live directly inside each skill directory under
  `templates/.agents/skills/`; there is no generated copy.
```

- [ ] **Step 7: Point Python validator tests at the single copy**

`scripts/test_api_validator.py`: make `VALIDATORS` a one-element tuple containing only the `templates/.agents/skills/...` path and delete `test_validator_copies_match`.

`scripts/test-validator-regressions.py`: set `TARGETS = ("codex",)` and reduce `script_path` to:

```python
def script_path(target: str, relative_path: str) -> Path:
    return REPO_ROOT / "templates" / ".agents" / "skills" / relative_path
```

- [ ] **Step 8: Drop Gemini skill assertions from the installer test**

In `scripts/test-installer.mjs`, delete the line asserting `"Gemini runtime (skills/) must exist nested under .agents/gemini/"`, delete both assertions under `ASSERTION 4`, and in `ASSERTION 12` delete `geminiSkillPath`, its `writeFileSync`, and its assertion.

- [ ] **Step 9: Verify**

Run: `npm run verify && python3 scripts/test_api_validator.py && python3 scripts/test-validator-regressions.py`
Expected: all pass; consistency check prints `Template consistency check passed`.

- [ ] **Step 10: Commit**

```bash
git add -A templates GEMINI.md .gitignore package.json scripts docs/product/toolkits.md shared
git commit -m "refactor: keep one skill source and ship Codex hook templates"
```

---

### Task 2: Move integrations out of `bin/index.js`

**Files:**
- Create: `lib/errors.js`, `lib/fsx.js`, `lib/integrations.js`, `test/helpers.js`, `test/integrations.test.js`
- Modify: `bin/index.js`, `package.json`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `class KitError extends Error` from `lib/errors.js`
  - `lstatOrNull(p: string): fs.Stats | null` from `lib/fsx.js`
  - `installIntegrations(templateDir: string, projectDir: string): void`
  - `detectHarness(projectDir: string): { enabled: boolean, source: 'repository-harness' | 'standalone' }`
  - `makeKit`, `writeSkill`, `makeProject` from `test/helpers.js`

- [ ] **Step 1: Create errors and fs helpers**

`lib/errors.js`:

```js
/** An expected failure whose message is shown to the user without a stack trace. */
export class KitError extends Error {
    constructor(message) {
        super(message);
        this.name = 'KitError';
    }
}
```

`lib/fsx.js`:

```js
import fs from 'node:fs';

/** `fs.lstatSync` that returns null instead of throwing when the path is missing. */
export const lstatOrNull = (p) => {
    try {
        return fs.lstatSync(p);
    } catch {
        return null;
    }
};
```

- [ ] **Step 2: Create test helpers**

`test/helpers.js`:

```js
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const writeSkill = (templateDir, name, body = `---\nname: ${name}\ndescription: test skill\n---\n`) => {
    const dir = path.join(templateDir, '.agents', 'skills', name);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'SKILL.md'), body);
    return dir;
};

export const makeKit = ({ skills = [], profiles = {}, formatVersion = 1 } = {}) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-src-'));
    const templateDir = path.join(root, 'templates');
    fs.mkdirSync(path.join(templateDir, '.agents', 'skills'), { recursive: true });
    fs.writeFileSync(path.join(templateDir, 'kit.json'), JSON.stringify({ formatVersion, profiles }));
    for (const name of skills) writeSkill(templateDir, name);
    return { root, templateDir, skillsDir: path.join(templateDir, '.agents', 'skills') };
};

export const makeProject = () => fs.mkdtempSync(path.join(os.tmpdir(), 'kit-proj-'));
```

- [ ] **Step 3: Write the failing integrations test**

`test/integrations.test.js`:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { detectHarness, installIntegrations } from '../lib/integrations.js';
import { makeKit, makeProject } from './helpers.js';

test('installIntegrations copies Codex hook scripts and top-level toolkit files', () => {
    const { templateDir } = makeKit();
    fs.mkdirSync(path.join(templateDir, '.codex', 'hooks'), { recursive: true });
    fs.writeFileSync(path.join(templateDir, '.codex', 'hooks', 'codex_adapter.py'), 'print(1)\n');
    fs.writeFileSync(path.join(templateDir, '.codex', 'hooks.json'), JSON.stringify({ hooks: {} }));
    fs.writeFileSync(path.join(templateDir, '.agents', 'ARCHITECTURE.md'), '# arch\n');
    const projectDir = makeProject();

    installIntegrations(templateDir, projectDir);

    assert.equal(fs.readFileSync(path.join(projectDir, '.codex', 'hooks', 'codex_adapter.py'), 'utf8'), 'print(1)\n');
    assert.equal(fs.readFileSync(path.join(projectDir, '.agents', 'ARCHITECTURE.md'), 'utf8'), '# arch\n');
});

test('installIntegrations tolerates a template without integration files', () => {
    const { templateDir } = makeKit();
    const projectDir = makeProject();
    assert.doesNotThrow(() => installIntegrations(templateDir, projectDir));
});

test('detectHarness reports standalone when no harness files exist', () => {
    assert.deepEqual(detectHarness(makeProject()), { enabled: false, source: 'standalone' });
});
```

Add to `package.json` `scripts`:

```json
"test:unit": "node --test 'test/*.test.js'",
```

- [ ] **Step 4: Run it to see it fail**

Run: `npm run test:unit`
Expected: FAIL with `Cannot find module '.../lib/integrations.js'`.

- [ ] **Step 5: Create `lib/integrations.js`**

Move these from `bin/index.js` unchanged, with their constants (`CODEX_HOOK_COMMAND_MARKERS`, `CLAUDE_HOOK_COMMAND_MARKERS`, `KIT_GEMINI_HOOK_KEY`, `INSTRUCTION_BLOCK_PATTERN`): `atomicReplaceDir`, `isKitCodexHookGroup`, `isKitClaudeHookGroup`, `mergeCodexHooksFile`, `mergeClaudeSettingsFile`, `extractInstructionBlocks`, `mergeInstructionBlocks`, `mergeRootInstructionBlock`, `mergeWorkspaceHooks`, `copySharedFile`, `mergeSharedAssets`. `copySharedFile` keeps its `console.log(chalk.yellow(...))`, so import `chalk`. Imports:

```js
import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
```

Append:

```js
const ROOT_INSTRUCTIONS = ['AGENTS.md', 'GEMINI.md', 'CLAUDE.md'];
const TOOLKIT_FILES = ['ARCHITECTURE.md', 'ux_audit.json'];
const RUNTIME_HOOK_FOLDERS = ['claude', 'gemini'];

/**
 * Merge root instruction KIT blocks and hook configs, and refresh kit-owned
 * hook folders and shared toolkit assets. Replacing `.agents/gemini/` also
 * removes the legacy Gemini skills, agents, and workflows folders.
 */
export const installIntegrations = (templateDir, projectDir) => {
    for (const file of ROOT_INSTRUCTIONS) {
        mergeRootInstructionBlock(path.join(templateDir, file), path.join(projectDir, file), false);
    }

    mergeWorkspaceHooks(path.join(templateDir, '.codex', 'hooks.json'), path.join(projectDir, '.codex', 'hooks.json'), 'codex');
    mergeWorkspaceHooks(path.join(templateDir, '.agents', 'hooks.json'), path.join(projectDir, '.agents', 'hooks.json'), 'gemini');
    mergeWorkspaceHooks(path.join(templateDir, '.claude', 'settings.json'), path.join(projectDir, '.claude', 'settings.json'), 'claude');

    const codexHookScripts = path.join(templateDir, '.codex', 'hooks');
    if (fs.existsSync(codexHookScripts)) {
        fs.cpSync(codexHookScripts, path.join(projectDir, '.codex', 'hooks'), { recursive: true, force: true });
    }

    for (const runtime of RUNTIME_HOOK_FOLDERS) {
        const src = path.join(templateDir, '.agents', runtime);
        if (fs.existsSync(src)) {
            atomicReplaceDir(src, path.join(projectDir, '.agents', runtime));
        }
    }

    mergeSharedAssets(path.join(templateDir, '.agents'), path.join(projectDir, '.agents'));
    for (const file of TOOLKIT_FILES) {
        const src = path.join(templateDir, '.agents', file);
        if (fs.existsSync(src)) {
            copySharedFile(src, path.join(projectDir, '.agents', file));
        }
    }
};

export const detectHarness = (projectDir) => {
    const enabled = fs.existsSync(path.join(projectDir, 'docs', 'HARNESS.md')) ||
        fs.existsSync(path.join(projectDir, 'scripts', 'bin', 'harness-cli'));
    return { enabled, source: enabled ? 'repository-harness' : 'standalone' };
};

export { mergeInstructionBlocks, mergeRootInstructionBlock, mergeWorkspaceHooks, copySharedFile, mergeSharedAssets };
```

`atomicReplaceDir` needs `fs.mkdirSync(path.dirname(dest), { recursive: true })` as its first line so it works in an empty project.

- [ ] **Step 6: Make `bin/index.js` use the module**

In `bin/index.js`: delete the moved functions and constants; import `{ installIntegrations, detectHarness }` from `'../lib/integrations.js'`; delete `installCodexRuntime`, `installGeminiRuntime`, `installClaudeRuntime`; in `initCommand`, `updateCommand`, and `repairCommand` replace the three `install*Runtime(...)` calls with:

```js
installIntegrations(templatePath, projectDir);
const srcSkills = path.join(templatePath, INSTALL_FOLDER, 'skills');
if (fs.existsSync(srcSkills)) {
    fs.cpSync(srcSkills, path.join(projectDir, INSTALL_FOLDER, 'skills'), { recursive: true, force: true });
}
```

and replace each inline harness detection with `detectHarness(projectDir)`. Delete the `export { ... }` block at the bottom. This bridge is replaced in Task 11.

- [ ] **Step 7: Verify**

Run: `npm run test:unit && npm run verify`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add lib test bin/index.js package.json
git commit -m "refactor: move hook and instruction merges into lib/integrations"
```

---

### Task 3: Registry and `kit.json`

**Files:**
- Create: `templates/kit.json`, `lib/registry.js`, `test/registry.test.js`
- Modify: `scripts/check-template-consistency.mjs`

**Interfaces:**
- Consumes: `KitError`.
- Produces:
  - `SUPPORTED_FORMAT_VERSION = 1`
  - `loadRegistry(templateDir: string): { formatVersion: number, skills: string[], profiles: Record<string, string[]>, skillsDir: string, templateDir: string }` (`skills` sorted, dot-directories excluded, `skillsDir` absolute)

- [ ] **Step 1: Write the failing test**

`test/registry.test.js`:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { loadRegistry } from '../lib/registry.js';
import { makeKit } from './helpers.js';

test('loadRegistry lists skill directories and profiles', () => {
    const { templateDir } = makeKit({ skills: ['b-skill', 'a-skill'], profiles: { starter: ['a-skill'] } });
    fs.mkdirSync(path.join(templateDir, '.agents', 'skills', '.a-skill.tmp-1-2'));
    const registry = loadRegistry(templateDir);
    assert.deepEqual(registry.skills, ['a-skill', 'b-skill']);
    assert.deepEqual(registry.profiles, { starter: ['a-skill'] });
    assert.ok(path.isAbsolute(registry.skillsDir));
});

test('loadRegistry rejects a directory without kit.json', () => {
    const { templateDir } = makeKit();
    fs.rmSync(path.join(templateDir, 'kit.json'));
    assert.throws(() => loadRegistry(templateDir), { name: 'KitError', message: /missing .*kit\.json/ });
});

test('loadRegistry rejects a newer formatVersion', () => {
    const { templateDir } = makeKit({ formatVersion: 2 });
    assert.throws(() => loadRegistry(templateDir), { name: 'KitError', message: /formatVersion 2 .*Upgrade/ });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `node --test test/registry.test.js`
Expected: FAIL with `Cannot find module`.

- [ ] **Step 3: Implement `lib/registry.js`**

```js
import fs from 'node:fs';
import path from 'node:path';
import { KitError } from './errors.js';

export const SUPPORTED_FORMAT_VERSION = 1;

export const loadRegistry = (templateDir) => {
    const kitPath = path.join(templateDir, 'kit.json');
    if (!fs.existsSync(kitPath)) {
        throw new KitError(`Not a kit template: missing ${kitPath}`);
    }
    const kit = JSON.parse(fs.readFileSync(kitPath, 'utf8'));
    if (!Number.isInteger(kit.formatVersion)) {
        throw new KitError(`${kitPath} has no integer formatVersion`);
    }
    if (kit.formatVersion > SUPPORTED_FORMAT_VERSION) {
        throw new KitError(
            `Template formatVersion ${kit.formatVersion} is newer than this CLI supports (${SUPPORTED_FORMAT_VERSION}). ` +
            'Upgrade the CLI: npx -y hieund-ai-kit@latest',
        );
    }

    const skillsDir = path.resolve(templateDir, '.agents', 'skills');
    const skills = fs.existsSync(skillsDir)
        ? fs.readdirSync(skillsDir, { withFileTypes: true })
            .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
            .map((entry) => entry.name)
            .sort()
        : [];

    return { formatVersion: kit.formatVersion, skills, profiles: kit.profiles ?? {}, skillsDir, templateDir };
};
```

- [ ] **Step 4: Run it to see it pass**

Run: `node --test test/registry.test.js`
Expected: PASS.

- [ ] **Step 5: Add the real registry**

`templates/kit.json`:

```json
{
  "formatVersion": 1,
  "profiles": {
    "starter": ["clean-code", "debugger", "verify-changes"]
  }
}
```

- [ ] **Step 6: Check profiles in the consistency script**

In `scripts/check-template-consistency.mjs`, after the `checkSkillFrontmatter("codex", ...)` call, add:

```js
const kitRegistry = JSON.parse(readText("templates/kit.json"));
const codexSkillNames = new Set(immediateDirectories("templates/.agents/skills"));
record(
  "templates/kit.json declares formatVersion 1",
  kitRegistry.formatVersion === 1,
  `formatVersion=${kitRegistry.formatVersion}`,
);
for (const [profileName, skillNames] of Object.entries(kitRegistry.profiles ?? {})) {
  for (const skillName of skillNames) {
    record(
      `kit.json profile ${profileName} references existing skill ${skillName}`,
      codexSkillNames.has(skillName),
      skillName,
    );
  }
}
```

- [ ] **Step 7: Verify**

Run: `npm run test:unit && npm run check:templates`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add templates/kit.json lib/registry.js test/registry.test.js scripts/check-template-consistency.mjs
git commit -m "feat: add kit.json registry with profiles"
```

---

### Task 4: Skill content hash

**Files:**
- Create: `lib/hash.js`, `test/hash.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `isIgnoredName(name: string): boolean`, `hashSkillDir(dir: string): string` returning `sha256:<hex>`.

- [ ] **Step 1: Write the failing test**

`test/hash.test.js`:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { hashSkillDir } from '../lib/hash.js';
import { makeKit, writeSkill } from './helpers.js';

test('hash is stable and changes with content', () => {
    const { templateDir } = makeKit();
    const dir = writeSkill(templateDir, 'x');
    const first = hashSkillDir(dir);
    assert.match(first, /^sha256:[0-9a-f]{64}$/);
    assert.equal(hashSkillDir(dir), first);
    fs.appendFileSync(path.join(dir, 'SKILL.md'), 'edit\n');
    assert.notEqual(hashSkillDir(dir), first);
});

test('hash changes when a file is renamed', () => {
    const { templateDir } = makeKit();
    const dir = writeSkill(templateDir, 'x');
    fs.mkdirSync(path.join(dir, 'references'));
    fs.writeFileSync(path.join(dir, 'references', 'a.md'), 'same');
    const before = hashSkillDir(dir);
    fs.renameSync(path.join(dir, 'references', 'a.md'), path.join(dir, 'references', 'b.md'));
    assert.notEqual(hashSkillDir(dir), before);
});

test('running a skill script does not change its hash', () => {
    const { templateDir } = makeKit();
    const dir = writeSkill(templateDir, 'x');
    const before = hashSkillDir(dir);
    fs.mkdirSync(path.join(dir, 'scripts', '__pycache__'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'scripts', '__pycache__', 'a.cpython-312.pyc'), 'bytecode');
    fs.writeFileSync(path.join(dir, 'scripts', 'b.pyc'), 'bytecode');
    assert.equal(hashSkillDir(dir), before);
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `node --test test/hash.test.js`
Expected: FAIL with `Cannot find module`.

- [ ] **Step 3: Implement `lib/hash.js`**

```js
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const isIgnoredName = (name) => name === '__pycache__' || name.endsWith('.pyc');

const byName = (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

/** SHA-256 over sorted relative paths and file contents, ignoring Python bytecode. */
export const hashSkillDir = (dir) => {
    const hash = crypto.createHash('sha256');
    const walk = (relativeDir) => {
        const entries = fs.readdirSync(path.join(dir, relativeDir), { withFileTypes: true })
            .filter((entry) => !isIgnoredName(entry.name))
            .sort(byName);
        for (const entry of entries) {
            const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
            if (entry.isDirectory()) {
                walk(relativePath);
            } else if (entry.isFile()) {
                hash.update(`${relativePath}\0`);
                hash.update(fs.readFileSync(path.join(dir, relativePath)));
                hash.update('\0');
            }
        }
    };
    walk('');
    return `sha256:${hash.digest('hex')}`;
};
```

- [ ] **Step 4: Run it to see it pass**

Run: `node --test test/hash.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/hash.js test/hash.test.js
git commit -m "feat: hash skill directories ignoring Python bytecode"
```

---

### Task 5: Selection resolution

**Files:**
- Create: `lib/resolve.js`, `test/resolve.test.js`

**Interfaces:**
- Consumes: `KitError`; registry shape from Task 3.
- Produces:
  - `emptySelection(): { all: false, profiles: [], skills: [], exclude: [] }`
  - `addToSelection(selection, { all?: boolean, profiles?: string[], skills?: string[] })` -> selection
  - `removeFromSelection(selection, names: string[], registry)` -> selection
  - `resolveTargetSkills(selection, registry): string[]` (sorted)
  - `closeMatches(name: string, candidates: string[]): string[]`
  - `unknownSkillsMessage(names: string[], candidates: string[]): string`

- [ ] **Step 1: Write the failing test**

`test/resolve.test.js`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import {
    addToSelection, closeMatches, emptySelection, removeFromSelection, resolveTargetSkills,
} from '../lib/resolve.js';

const registry = {
    skills: ['clean-code', 'debugger', 'security-auditor', 'verify-changes'],
    profiles: { starter: ['clean-code', 'debugger'], broken: ['missing-skill'] },
};

test('all selects every skill', () => {
    assert.deepEqual(resolveTargetSkills({ ...emptySelection(), all: true }, registry), registry.skills);
});

test('profiles and skills are unioned, excludes subtracted', () => {
    const selection = { all: false, profiles: ['starter'], skills: ['verify-changes'], exclude: ['debugger'] };
    assert.deepEqual(resolveTargetSkills(selection, registry), ['clean-code', 'verify-changes']);
});

test('unknown profile fails with available profiles', () => {
    assert.throws(
        () => resolveTargetSkills({ ...emptySelection(), profiles: ['nope'] }, registry),
        { name: 'KitError', message: /Unknown profile "nope".*starter/ },
    );
});

test('unknown skill fails with close matches', () => {
    assert.throws(
        () => resolveTargetSkills({ ...emptySelection(), skills: ['debuger'] }, registry),
        { name: 'KitError', message: /Unknown skill "debuger" \(did you mean: debugger\?\)/ },
    );
});

test('a profile naming a missing skill fails', () => {
    assert.throws(
        () => resolveTargetSkills({ ...emptySelection(), profiles: ['broken'] }, registry),
        { name: 'KitError', message: /missing-skill/ },
    );
});

test('addToSelection merges and re-includes explicitly added skills', () => {
    const start = { all: false, profiles: ['starter'], skills: [], exclude: ['debugger'] };
    const next = addToSelection(start, { skills: ['debugger', 'verify-changes'] });
    assert.deepEqual(next, { all: false, profiles: ['starter'], skills: ['debugger', 'verify-changes'], exclude: [] });
});

test('removeFromSelection drops explicit skills and excludes covered ones', () => {
    const start = { all: false, profiles: ['starter'], skills: ['verify-changes'], exclude: [] };
    const next = removeFromSelection(start, ['verify-changes', 'debugger'], registry);
    assert.deepEqual(next, { all: false, profiles: ['starter'], skills: [], exclude: ['debugger'] });
});

test('closeMatches finds typos and substrings', () => {
    assert.deepEqual(closeMatches('security', registry.skills), ['security-auditor']);
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `node --test test/resolve.test.js`
Expected: FAIL with `Cannot find module`.

- [ ] **Step 3: Implement `lib/resolve.js`**

```js
import { KitError } from './errors.js';

const union = (a, b) => [...new Set([...a, ...b])];

export const emptySelection = () => ({ all: false, profiles: [], skills: [], exclude: [] });

const editDistance = (a, b) => {
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        let previous = row[0];
        row[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const current = row[j];
            row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
            previous = current;
        }
    }
    return row[b.length];
};

export const closeMatches = (name, candidates) =>
    candidates
        .filter((candidate) => candidate.includes(name) || name.includes(candidate) || editDistance(candidate, name) <= 2)
        .slice(0, 3);

export const unknownSkillsMessage = (names, candidates) =>
    names.map((name) => {
        const matches = closeMatches(name, candidates);
        return `Unknown skill "${name}"${matches.length ? ` (did you mean: ${matches.join(', ')}?)` : ''}`;
    }).join('\n');

const coveredSkills = (selection, registry) => {
    const covered = new Set(selection.all ? registry.skills : []);
    for (const profile of selection.profiles) {
        for (const skill of registry.profiles[profile] ?? []) covered.add(skill);
    }
    return covered;
};

export const addToSelection = (selection, { all = false, profiles = [], skills = [] }) => ({
    all: selection.all || all,
    profiles: union(selection.profiles, profiles),
    skills: union(selection.skills, skills),
    exclude: selection.exclude.filter((skill) => !skills.includes(skill)),
});

export const removeFromSelection = (selection, names, registry) => {
    const covered = coveredSkills(selection, registry);
    return {
        ...selection,
        skills: selection.skills.filter((skill) => !names.includes(skill)),
        exclude: union(selection.exclude, names.filter((name) => covered.has(name))),
    };
};

export const resolveTargetSkills = (selection, registry) => {
    const available = Object.keys(registry.profiles);
    for (const profile of selection.profiles) {
        if (!registry.profiles[profile]) {
            throw new KitError(`Unknown profile "${profile}". Available: ${available.join(', ') || '(none)'}`);
        }
    }

    const wanted = coveredSkills(selection, registry);
    for (const skill of selection.skills) wanted.add(skill);

    const known = new Set(registry.skills);
    const unknown = [...wanted].filter((skill) => !known.has(skill));
    if (unknown.length) {
        throw new KitError(unknownSkillsMessage(unknown, registry.skills));
    }

    for (const skill of selection.exclude) wanted.delete(skill);
    return [...wanted].sort();
};
```

- [ ] **Step 4: Run it to see it pass**

Run: `node --test test/resolve.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/resolve.js test/resolve.test.js
git commit -m "feat: resolve skill selections from profiles and names"
```

---

### Task 6: Project manifest

**Files:**
- Create: `lib/manifest.js`, `test/manifest.test.js`

**Interfaces:**
- Consumes: `KitError`, `emptySelection`.
- Produces:
  - `MANIFEST_FILE = '.ai-kit.json'`
  - `createManifest({ source }): Manifest` with `selection = emptySelection()`, `managedSkills = {}`
  - `readManifest(projectDir): Manifest | null` (migrates legacy; legacy result has `managedSkills: null`)
  - `writeManifest(projectDir, manifest): void`

- [ ] **Step 1: Write the failing test**

`test/manifest.test.js`:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { createManifest, readManifest, writeManifest } from '../lib/manifest.js';
import { makeProject } from './helpers.js';

test('readManifest returns null when absent', () => {
    assert.equal(readManifest(makeProject()), null);
});

test('write then read round-trips', () => {
    const projectDir = makeProject();
    const manifest = createManifest({ source: { type: 'github', ref: 'main' } });
    writeManifest(projectDir, manifest);
    assert.deepEqual(readManifest(projectDir), manifest);
});

test('legacy manifest migrates to select all with unknown managed skills', () => {
    const projectDir = makeProject();
    fs.writeFileSync(path.join(projectDir, '.ai-kit.json'), JSON.stringify({
        version: '2.0.0', ref: 'v2', installedAt: 'x',
        harness: { enabled: false, source: 'standalone' },
        features: { backlog: false, claudeCode: true },
    }));
    const manifest = readManifest(projectDir);
    assert.equal(manifest.formatVersion, 1);
    assert.deepEqual(manifest.source, { type: 'github', ref: 'v2' });
    assert.equal(manifest.selection.all, true);
    assert.equal(manifest.managedSkills, null);
    assert.equal(manifest.features.backlog, false);
});

test('unparseable manifest fails with the file path', () => {
    const projectDir = makeProject();
    fs.writeFileSync(path.join(projectDir, '.ai-kit.json'), '{oops');
    assert.throws(() => readManifest(projectDir), { name: 'KitError', message: /\.ai-kit\.json/ });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `node --test test/manifest.test.js`
Expected: FAIL with `Cannot find module`.

- [ ] **Step 3: Implement `lib/manifest.js`**

```js
import fs from 'node:fs';
import path from 'node:path';
import { KitError } from './errors.js';
import { emptySelection } from './resolve.js';

export const MANIFEST_FILE = '.ai-kit.json';
const FORMAT_VERSION = 1;
const DEFAULT_FEATURES = { backlog: true, guardHooks: true, toolRegistry: true };

export const createManifest = ({ source }) => ({
    formatVersion: FORMAT_VERSION,
    source,
    selection: emptySelection(),
    managedSkills: {},
    installedAt: null,
    harness: null,
    features: { ...DEFAULT_FEATURES },
});

/** Pre-1 manifests recorded no hashes; `managedSkills: null` asks the pipeline to adopt existing skills. */
const migrateLegacyManifest = (raw) => ({
    formatVersion: FORMAT_VERSION,
    source: { type: 'github', ref: raw.ref || 'main' },
    selection: { ...emptySelection(), all: true },
    managedSkills: null,
    installedAt: raw.installedAt ?? null,
    harness: raw.harness ?? null,
    features: { ...DEFAULT_FEATURES, ...(raw.features ?? {}) },
});

export const readManifest = (projectDir) => {
    const manifestPath = path.join(projectDir, MANIFEST_FILE);
    if (!fs.existsSync(manifestPath)) return null;
    let raw;
    try {
        raw = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (error) {
        throw new KitError(`Cannot parse ${manifestPath}: ${error.message}`);
    }
    return raw.formatVersion === undefined ? migrateLegacyManifest(raw) : raw;
};

export const writeManifest = (projectDir, manifest) => {
    fs.writeFileSync(path.join(projectDir, MANIFEST_FILE), `${JSON.stringify(manifest, null, 2)}\n`);
};
```

- [ ] **Step 4: Run it to see it pass**

Run: `node --test test/manifest.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/manifest.js test/manifest.test.js
git commit -m "feat: add project manifest with legacy migration"
```

---

### Task 7: Plan skill actions

**Files:**
- Create: `lib/plan.js`, `test/plan.test.js`

**Interfaces:**
- Consumes: `hashSkillDir`, `lstatOrNull`.
- Produces: `planSkills({ targetSkills: string[], managedSkills: Record<string, {hash?: string}>, projectSkillsDir: string, sourceSkillsDir: string, mode: 'copy' | 'link', force: boolean }): Array<{ name: string, action: 'add' | 'update' | 'unchanged' | 'skip-modified' | 'remove' | 'conflict' }>` sorted by name.

- [ ] **Step 1: Write the failing test**

`test/plan.test.js`:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { hashSkillDir } from '../lib/hash.js';
import { planSkills } from '../lib/plan.js';
import { makeKit, makeProject } from './helpers.js';

const setup = () => {
    const kit = makeKit({ skills: ['a', 'b'] });
    const projectDir = makeProject();
    const projectSkillsDir = path.join(projectDir, '.agents', 'skills');
    fs.mkdirSync(projectSkillsDir, { recursive: true });
    const copyIn = (name) => {
        fs.cpSync(path.join(kit.skillsDir, name), path.join(projectSkillsDir, name), { recursive: true });
        return { hash: hashSkillDir(path.join(projectSkillsDir, name)) };
    };
    const plan = (args) => planSkills({ projectSkillsDir, sourceSkillsDir: kit.skillsDir, mode: 'copy', force: false, ...args });
    return { kit, projectSkillsDir, copyIn, plan };
};

const actions = (items) => Object.fromEntries(items.map((item) => [item.name, item.action]));

test('new skills are added', () => {
    const { plan } = setup();
    assert.deepEqual(actions(plan({ targetSkills: ['a'], managedSkills: {} })), { a: 'add' });
});

test('identical managed skill is unchanged, changed source is update', () => {
    const { kit, copyIn, plan } = setup();
    const managedSkills = { a: copyIn('a'), b: copyIn('b') };
    fs.appendFileSync(path.join(kit.skillsDir, 'b', 'SKILL.md'), 'new\n');
    assert.deepEqual(actions(plan({ targetSkills: ['a', 'b'], managedSkills })), { a: 'unchanged', b: 'update' });
});

test('locally modified managed skill is skipped unless forced', () => {
    const { projectSkillsDir, copyIn, plan } = setup();
    const managedSkills = { a: copyIn('a') };
    fs.appendFileSync(path.join(projectSkillsDir, 'a', 'SKILL.md'), 'local\n');
    assert.deepEqual(actions(plan({ targetSkills: ['a'], managedSkills })), { a: 'skip-modified' });
    assert.deepEqual(actions(plan({ targetSkills: ['a'], managedSkills, force: true })), { a: 'update' });
    assert.deepEqual(actions(plan({ targetSkills: [], managedSkills })), { a: 'skip-modified' });
});

test('deselected managed skill is removed', () => {
    const { copyIn, plan } = setup();
    assert.deepEqual(actions(plan({ targetSkills: [], managedSkills: { a: copyIn('a') } })), { a: 'remove' });
});

test('unmanaged directory with a kit name is a conflict unless forced', () => {
    const { projectSkillsDir, plan } = setup();
    fs.mkdirSync(path.join(projectSkillsDir, 'a'));
    assert.deepEqual(actions(plan({ targetSkills: ['a'], managedSkills: {} })), { a: 'conflict' });
    assert.deepEqual(actions(plan({ targetSkills: ['a'], managedSkills: {}, force: true })), { a: 'update' });
});

test('project-owned skills outside the target are not planned', () => {
    const { projectSkillsDir, plan } = setup();
    fs.mkdirSync(path.join(projectSkillsDir, 'mine'));
    assert.deepEqual(plan({ targetSkills: ['a'], managedSkills: {} }).map((item) => item.name), ['a']);
});

test('link mode: correct link is unchanged, copied dir is updated', () => {
    const { kit, projectSkillsDir, copyIn, plan } = setup();
    fs.symlinkSync(path.join(kit.skillsDir, 'a'), path.join(projectSkillsDir, 'a'), 'dir');
    const managedSkills = { a: {}, b: copyIn('b') };
    assert.deepEqual(actions(plan({ targetSkills: ['a', 'b'], managedSkills, mode: 'link' })), { a: 'unchanged', b: 'update' });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `node --test test/plan.test.js`
Expected: FAIL with `Cannot find module`.

- [ ] **Step 3: Implement `lib/plan.js`**

```js
import fs from 'node:fs';
import path from 'node:path';
import { lstatOrNull } from './fsx.js';
import { hashSkillDir } from './hash.js';

const isLocallyModified = (entryPath, stat, record) =>
    Boolean(record.hash) && stat.isDirectory() && hashSkillDir(entryPath) !== record.hash;

const matchesSource = (entryPath, stat, sourcePath, mode) => {
    if (mode === 'link') {
        return stat.isSymbolicLink() && fs.readlinkSync(entryPath) === sourcePath;
    }
    return stat.isDirectory() && hashSkillDir(entryPath) === hashSkillDir(sourcePath);
};

export const planSkills = ({ targetSkills, managedSkills, projectSkillsDir, sourceSkillsDir, mode, force }) => {
    const target = new Set(targetSkills);
    const names = [...new Set([...targetSkills, ...Object.keys(managedSkills)])].sort();

    return names.map((name) => {
        const entryPath = path.join(projectSkillsDir, name);
        const stat = lstatOrNull(entryPath);
        const record = managedSkills[name];

        if (!record) {
            if (!stat) return { name, action: 'add' };
            return { name, action: force ? 'update' : 'conflict' };
        }
        if (!stat) return { name, action: target.has(name) ? 'add' : 'remove' };
        if (!force && isLocallyModified(entryPath, stat, record)) return { name, action: 'skip-modified' };
        if (!target.has(name)) return { name, action: 'remove' };

        const sourcePath = path.join(sourceSkillsDir, name);
        return { name, action: matchesSource(entryPath, stat, sourcePath, mode) ? 'unchanged' : 'update' };
    });
};
```

- [ ] **Step 4: Run it to see it pass**

Run: `node --test test/plan.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/plan.js test/plan.test.js
git commit -m "feat: plan per-skill install actions"
```

---

### Task 8: Apply skills and Claude links

**Files:**
- Create: `lib/skills.js`, `test/skills.test.js`

**Interfaces:**
- Consumes: `KitError`, `lstatOrNull`, `hashSkillDir`, `isIgnoredName`, plan item shape from Task 7.
- Produces:
  - `PROJECT_SKILLS_DIR = '.agents/skills'` (via `path.join`), `CLAUDE_SKILLS_DIR = '.claude/skills'`
  - `applySkillPlan({ plan, projectSkillsDir, sourceSkillsDir, mode, managedSkills }): Record<string, {hash?: string}>`
  - `syncClaudeLinks({ projectDir, managedNames: string[] }): string[]` (warnings)
  - `adoptLegacySkills(projectSkillsDir, availableSkills: string[]): Record<string, {hash: string}>`

- [ ] **Step 1: Write the failing test**

`test/skills.test.js`:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { hashSkillDir } from '../lib/hash.js';
import { adoptLegacySkills, applySkillPlan, syncClaudeLinks } from '../lib/skills.js';
import { makeKit, makeProject } from './helpers.js';

const setup = () => {
    const kit = makeKit({ skills: ['a', 'b'] });
    const projectDir = makeProject();
    const projectSkillsDir = path.join(projectDir, '.agents', 'skills');
    const apply = (plan, mode = 'copy', managedSkills = {}) =>
        applySkillPlan({ plan, projectSkillsDir, sourceSkillsDir: kit.skillsDir, mode, managedSkills });
    return { kit, projectDir, projectSkillsDir, apply };
};

test('copy mode copies skills, records hashes, skips bytecode', () => {
    const { kit, projectSkillsDir, apply } = setup();
    fs.mkdirSync(path.join(kit.skillsDir, 'a', '__pycache__'));
    const managed = apply([{ name: 'a', action: 'add' }]);
    assert.ok(fs.existsSync(path.join(projectSkillsDir, 'a', 'SKILL.md')));
    assert.ok(!fs.existsSync(path.join(projectSkillsDir, 'a', '__pycache__')));
    assert.equal(managed.a.hash, hashSkillDir(path.join(projectSkillsDir, 'a')));
});

test('link mode creates absolute symlinks without hashes', () => {
    const { kit, projectSkillsDir, apply } = setup();
    const managed = apply([{ name: 'a', action: 'add' }], 'link');
    assert.equal(fs.readlinkSync(path.join(projectSkillsDir, 'a')), path.join(kit.skillsDir, 'a'));
    assert.deepEqual(managed.a, {});
});

test('update replaces a link with a copy', () => {
    const { projectSkillsDir, apply } = setup();
    apply([{ name: 'a', action: 'add' }], 'link');
    apply([{ name: 'a', action: 'update' }], 'copy', { a: {} });
    assert.ok(fs.lstatSync(path.join(projectSkillsDir, 'a')).isDirectory());
});

test('remove deletes the skill and its record; skip-modified keeps both', () => {
    const { projectSkillsDir, apply } = setup();
    const managed = apply([{ name: 'a', action: 'add' }, { name: 'b', action: 'add' }]);
    const next = apply([{ name: 'a', action: 'remove' }, { name: 'b', action: 'skip-modified' }], 'copy', managed);
    assert.ok(!fs.existsSync(path.join(projectSkillsDir, 'a')));
    assert.deepEqual(Object.keys(next), ['b']);
});

test('stale staging directories are removed', () => {
    const { projectSkillsDir, apply } = setup();
    fs.mkdirSync(path.join(projectSkillsDir, '.a.tmp-123-456'), { recursive: true });
    apply([]);
    assert.deepEqual(fs.readdirSync(projectSkillsDir), []);
});

test('conflict items are refused', () => {
    const { apply } = setup();
    assert.throws(() => apply([{ name: 'a', action: 'conflict' }]), { name: 'KitError' });
});

test('syncClaudeLinks links managed skills and removes stale kit links only', () => {
    const { projectDir, apply } = setup();
    apply([{ name: 'a', action: 'add' }]);
    const claudeDir = path.join(projectDir, '.claude', 'skills');
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.symlinkSync('../../.agents/skills/gone', path.join(claudeDir, 'gone'));
    fs.symlinkSync('/elsewhere/other', path.join(claudeDir, 'other'));

    const warnings = syncClaudeLinks({ projectDir, managedNames: ['a'] });

    assert.equal(fs.readlinkSync(path.join(claudeDir, 'a')), '../../.agents/skills/a');
    assert.ok(fs.existsSync(path.join(claudeDir, 'a', 'SKILL.md')));
    assert.equal(fs.lstatSync(path.join(claudeDir, 'gone'), { throwIfNoEntry: false }), undefined);
    assert.equal(fs.readlinkSync(path.join(claudeDir, 'other')), '/elsewhere/other');
    assert.deepEqual(warnings, []);
});

test('syncClaudeLinks leaves a foreign entry with a managed name alone', () => {
    const { projectDir } = setup();
    const claudeDir = path.join(projectDir, '.claude', 'skills');
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.symlinkSync('/elsewhere/a', path.join(claudeDir, 'a'));
    const warnings = syncClaudeLinks({ projectDir, managedNames: ['a'] });
    assert.equal(fs.readlinkSync(path.join(claudeDir, 'a')), '/elsewhere/a');
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /\.claude\/skills\/a/);
});

test('adoptLegacySkills records existing kit-named directories only', () => {
    const { projectSkillsDir } = setup();
    fs.mkdirSync(path.join(projectSkillsDir, 'a'), { recursive: true });
    fs.mkdirSync(path.join(projectSkillsDir, 'mine'), { recursive: true });
    assert.deepEqual(Object.keys(adoptLegacySkills(projectSkillsDir, ['a', 'b'])), ['a']);
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `node --test test/skills.test.js`
Expected: FAIL with `Cannot find module`.

- [ ] **Step 3: Implement `lib/skills.js`**

```js
import fs from 'node:fs';
import path from 'node:path';
import { KitError } from './errors.js';
import { lstatOrNull } from './fsx.js';
import { hashSkillDir, isIgnoredName } from './hash.js';

export const PROJECT_SKILLS_DIR = path.join('.agents', 'skills');
export const CLAUDE_SKILLS_DIR = path.join('.claude', 'skills');

const CLAUDE_LINK_PREFIX = `${path.join('..', '..', '.agents', 'skills')}${path.sep}`;
const STAGING_PATTERN = /^\..+\.tmp-\d+-\d+$/;

const createSymlink = (target, linkPath) => {
    try {
        fs.symlinkSync(target, linkPath, 'dir');
    } catch (error) {
        throw new KitError(`Cannot create symlink ${linkPath} -> ${target}: ${error.message}`);
    }
};

const removeStaleStaging = (projectSkillsDir) => {
    for (const entry of fs.readdirSync(projectSkillsDir)) {
        if (STAGING_PATTERN.test(entry)) {
            fs.rmSync(path.join(projectSkillsDir, entry), { recursive: true, force: true });
        }
    }
};

const replaceWithCopy = (sourcePath, destPath) => {
    const staging = path.join(path.dirname(destPath), `.${path.basename(destPath)}.tmp-${process.pid}-${Date.now()}`);
    try {
        fs.cpSync(sourcePath, staging, { recursive: true, filter: (src) => !isIgnoredName(path.basename(src)) });
        fs.rmSync(destPath, { recursive: true, force: true });
        fs.renameSync(staging, destPath);
    } catch (error) {
        fs.rmSync(staging, { recursive: true, force: true });
        throw error;
    }
};

const replaceWithLink = (sourcePath, destPath) => {
    fs.rmSync(destPath, { recursive: true, force: true });
    createSymlink(sourcePath, destPath);
};

const recordFor = (destPath, mode) => (mode === 'link' ? {} : { hash: hashSkillDir(destPath) });

export const applySkillPlan = ({ plan, projectSkillsDir, sourceSkillsDir, mode, managedSkills }) => {
    fs.mkdirSync(projectSkillsDir, { recursive: true });
    removeStaleStaging(projectSkillsDir);
    const next = { ...managedSkills };

    for (const { name, action } of plan) {
        const destPath = path.join(projectSkillsDir, name);
        const sourcePath = path.join(sourceSkillsDir, name);
        if (action === 'conflict') {
            throw new KitError(`Refusing to overwrite project-owned skill "${name}"`);
        }
        if (action === 'add' || action === 'update') {
            if (mode === 'link') replaceWithLink(sourcePath, destPath);
            else replaceWithCopy(sourcePath, destPath);
            next[name] = recordFor(destPath, mode);
        } else if (action === 'unchanged') {
            next[name] = recordFor(destPath, mode);
        } else if (action === 'remove') {
            fs.rmSync(destPath, { recursive: true, force: true });
            delete next[name];
        }
    }
    return next;
};

const isKitClaudeLink = (linkPath) =>
    Boolean(lstatOrNull(linkPath)?.isSymbolicLink()) && fs.readlinkSync(linkPath).startsWith(CLAUDE_LINK_PREFIX);

export const syncClaudeLinks = ({ projectDir, managedNames }) => {
    const claudeDir = path.join(projectDir, CLAUDE_SKILLS_DIR);
    fs.mkdirSync(claudeDir, { recursive: true });
    const managed = new Set(managedNames);
    const warnings = [];

    for (const name of managed) {
        const linkPath = path.join(claudeDir, name);
        const expected = path.join('..', '..', '.agents', 'skills', name);
        if (!lstatOrNull(linkPath)) {
            createSymlink(expected, linkPath);
        } else if (isKitClaudeLink(linkPath)) {
            if (fs.readlinkSync(linkPath) !== expected) {
                fs.unlinkSync(linkPath);
                createSymlink(expected, linkPath);
            }
        } else {
            warnings.push(`Left ${path.join(CLAUDE_SKILLS_DIR, name)} alone: it is not a kit-managed link`);
        }
    }

    for (const entry of fs.readdirSync(claudeDir)) {
        const linkPath = path.join(claudeDir, entry);
        if (!managed.has(entry) && isKitClaudeLink(linkPath)) fs.unlinkSync(linkPath);
    }
    return warnings;
};

export const adoptLegacySkills = (projectSkillsDir, availableSkills) => {
    const adopted = {};
    for (const name of availableSkills) {
        const entryPath = path.join(projectSkillsDir, name);
        if (lstatOrNull(entryPath)?.isDirectory()) adopted[name] = { hash: hashSkillDir(entryPath) };
    }
    return adopted;
};
```

- [ ] **Step 4: Run it to see it pass**

Run: `node --test test/skills.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/skills.js test/skills.test.js
git commit -m "feat: apply skill plans and link skills for Claude Code"
```

---

### Task 9: Template source

**Files:**
- Create: `lib/source.js`, `test/source.test.js`

**Interfaces:**
- Consumes: `KitError`, `giget.downloadTemplate`.
- Produces:
  - `resolveSource({ options: { source?, link?, ref? }, manifest: Manifest | null }): { type: 'github', ref } | { type: 'local', path, mode: 'copy' | 'link' }`
  - `sourceMode(source): 'copy' | 'link'`
  - `fetchTemplates(source): Promise<{ templateDir: string, cleanup: () => void }>`

- [ ] **Step 1: Write the failing test**

`test/source.test.js`:

```js
import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fetchTemplates, resolveSource, sourceMode } from '../lib/source.js';
import { makeKit, makeProject } from './helpers.js';

const localManifest = { source: { type: 'local', path: '/kit', mode: 'link' } };

test('flags override the manifest, manifest overrides the default', () => {
    assert.deepEqual(resolveSource({ options: {}, manifest: null }), { type: 'github', ref: 'main' });
    assert.deepEqual(resolveSource({ options: {}, manifest: localManifest }), localManifest.source);
    assert.deepEqual(resolveSource({ options: { ref: 'v3' }, manifest: localManifest }), { type: 'github', ref: 'v3' });
    assert.deepEqual(
        resolveSource({ options: { source: 'kit' }, manifest: localManifest }),
        { type: 'local', path: path.resolve('kit'), mode: 'copy' },
    );
});

test('--link requires --source', () => {
    assert.throws(() => resolveSource({ options: { link: true }, manifest: null }), { name: 'KitError', message: /--link requires --source/ });
});

test('sourceMode is copy for GitHub', () => {
    assert.equal(sourceMode({ type: 'github', ref: 'main' }), 'copy');
    assert.equal(sourceMode(localManifest.source), 'link');
});

test('local source resolves its templates directory', async () => {
    const kit = makeKit();
    const { templateDir, cleanup } = await fetchTemplates({ type: 'local', path: kit.root, mode: 'copy' });
    assert.equal(templateDir, kit.templateDir);
    cleanup();
});

test('a moved checkout fails with recovery hints', async () => {
    await assert.rejects(
        fetchTemplates({ type: 'local', path: makeProject(), mode: 'link' }),
        { name: 'KitError', message: /--source <new path>.*--ref main/ },
    );
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `node --test test/source.test.js`
Expected: FAIL with `Cannot find module`.

- [ ] **Step 3: Implement `lib/source.js`**

```js
import { downloadTemplate } from 'giget';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { KitError } from './errors.js';

const REPO = 'github:duyhieu9898/my-ai-kit';

export const resolveSource = ({ options, manifest }) => {
    if (options.link && !options.source) {
        throw new KitError('--link requires --source <dir>');
    }
    if (options.source) {
        return { type: 'local', path: path.resolve(options.source), mode: options.link ? 'link' : 'copy' };
    }
    if (options.ref) return { type: 'github', ref: options.ref };
    if (manifest?.source) return manifest.source;
    return { type: 'github', ref: 'main' };
};

export const sourceMode = (source) => (source.type === 'local' ? source.mode : 'copy');

export const fetchTemplates = async (source) => {
    if (source.type === 'local') {
        const templateDir = path.join(source.path, 'templates');
        if (!fs.existsSync(path.join(templateDir, 'kit.json'))) {
            throw new KitError(
                `${source.path} is not a kit checkout (missing templates/kit.json). ` +
                'If the checkout moved, rerun with --source <new path>, or switch to GitHub with --ref main.',
            );
        }
        return { templateDir, cleanup: () => {} };
    }

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hieund-ai-kit-'));
    const cleanup = () => fs.rmSync(tempDir, { recursive: true, force: true });
    try {
        await downloadTemplate(`${REPO}/templates#${source.ref}`, { dir: tempDir, force: true });
    } catch (error) {
        cleanup();
        throw new KitError(`Download of ${REPO}@${source.ref} failed: ${error.message}`);
    }
    return { templateDir: tempDir, cleanup };
};
```

- [ ] **Step 4: Run it to see it pass**

Run: `node --test test/source.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/source.js test/source.test.js
git commit -m "feat: resolve GitHub or local template sources"
```

---

### Task 10: Pipeline and status

**Files:**
- Create: `lib/pipeline.js`, `lib/status.js`, `test/pipeline.test.js`

**Interfaces:**
- Consumes: everything from Tasks 2-9.
- Produces:
  - `runPipeline({ projectDir, command: 'install' | 'update' | 'remove', add?: { all, profiles, skills }, remove?: string[], options: { source?, link?, ref?, force?, dryRun? } }): Promise<{ plan, warnings: string[], dryRun: boolean, manifest }>`
  - `loadCatalog({ projectDir, options }): Promise<{ source, skills: string[], profiles: Record<string,string[]>, installed: string[] }>`
  - `collectStatus(projectDir): { installed: false } | { installed: true, legacy: boolean, source, selection, managed: string[], missing: string[], modified: string[], brokenLinks: string[], projectOwned: string[] }`

- [ ] **Step 1: Write the failing test**

`test/pipeline.test.js`:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { runPipeline } from '../lib/pipeline.js';
import { collectStatus } from '../lib/status.js';
import { makeKit, makeProject } from './helpers.js';

const setup = () => {
    const kit = makeKit({ skills: ['a', 'b', 'c'], profiles: { p: ['a', 'b'] } });
    const projectDir = makeProject();
    const run = (command, extra = {}) => runPipeline({
        projectDir, command,
        add: { all: false, profiles: [], skills: [] },
        remove: [],
        ...extra,
        options: { source: kit.root, ...(extra.options ?? {}) },
    });
    return { kit, projectDir, run };
};

const exists = (...parts) => fs.existsSync(path.join(...parts));

test('first install without arguments selects all and links Claude', async () => {
    const { projectDir, run } = setup();
    const { manifest } = await run('install');
    assert.equal(manifest.selection.all, true);
    assert.deepEqual(Object.keys(manifest.managedSkills).sort(), ['a', 'b', 'c']);
    assert.ok(exists(projectDir, '.claude', 'skills', 'c', 'SKILL.md'));
    assert.ok(exists(projectDir, '.ai-kit.json'));
});

test('install by profile, add a skill, then remove one from the profile', async () => {
    const { projectDir, run } = setup();
    await run('install', { add: { all: false, profiles: ['p'], skills: [] } });
    await run('install', { add: { all: false, profiles: [], skills: ['c'] } });
    const { manifest } = await run('remove', { remove: ['a'] });
    assert.deepEqual(Object.keys(manifest.managedSkills).sort(), ['b', 'c']);
    assert.deepEqual(manifest.selection.exclude, ['a']);
    assert.ok(!exists(projectDir, '.agents', 'skills', 'a'));
    assert.ok(!exists(projectDir, '.claude', 'skills', 'a'));
    const again = await run('update');
    assert.ok(!('a' in again.manifest.managedSkills));
});

test('remove with an unknown name fails with close matches', async () => {
    const { run } = setup();
    await run('install');
    await assert.rejects(run('remove', { remove: ['aa'] }), { name: 'KitError', message: /Unknown skill "aa"/ });
});

test('conflict aborts before any write', async () => {
    const { projectDir, run } = setup();
    fs.mkdirSync(path.join(projectDir, '.agents', 'skills', 'a'), { recursive: true });
    await assert.rejects(run('install'), { name: 'KitError', message: /a.*--force/ });
    assert.ok(!exists(projectDir, '.ai-kit.json'));
    assert.ok(!exists(projectDir, '.agents', 'skills', 'b'));
});

test('dry run writes nothing', async () => {
    const { projectDir, run } = setup();
    const result = await run('install', { options: { dryRun: true } });
    assert.equal(result.dryRun, true);
    assert.deepEqual(fs.readdirSync(projectDir), []);
});

test('update and remove require an existing install', async () => {
    const { run } = setup();
    await assert.rejects(run('update'), { name: 'KitError', message: /not installed/ });
});

test('legacy install is adopted and project-owned skills survive', async () => {
    const { projectDir, run } = setup();
    fs.writeFileSync(path.join(projectDir, '.ai-kit.json'), JSON.stringify({ version: '2.0.0', ref: 'main' }));
    fs.mkdirSync(path.join(projectDir, '.agents', 'skills', 'a'), { recursive: true });
    fs.writeFileSync(path.join(projectDir, '.agents', 'skills', 'a', 'SKILL.md'), 'old\n');
    fs.mkdirSync(path.join(projectDir, '.agents', 'skills', 'mine'), { recursive: true });
    const { manifest } = await run('update');
    assert.equal(manifest.formatVersion, 1);
    assert.notEqual(fs.readFileSync(path.join(projectDir, '.agents', 'skills', 'a', 'SKILL.md'), 'utf8'), 'old\n');
    assert.ok(exists(projectDir, '.agents', 'skills', 'mine'));
    assert.ok(!('mine' in manifest.managedSkills));
});

test('status reports modified skills, broken links, and project-owned skills', async () => {
    const { projectDir, run } = setup();
    await run('install');
    fs.appendFileSync(path.join(projectDir, '.agents', 'skills', 'a', 'SKILL.md'), 'local\n');
    fs.unlinkSync(path.join(projectDir, '.claude', 'skills', 'b'));
    fs.mkdirSync(path.join(projectDir, '.agents', 'skills', 'mine'));
    fs.mkdirSync(path.join(projectDir, '.agents', 'skills', '.c.tmp-1-2'));
    const status = collectStatus(projectDir);
    assert.deepEqual(status.modified, ['a']);
    assert.deepEqual(status.brokenLinks, [path.join('.claude', 'skills', 'b')]);
    assert.deepEqual(status.projectOwned, ['mine']);
});

test('status on an empty directory reports not installed', () => {
    assert.deepEqual(collectStatus(makeProject()), { installed: false });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `node --test test/pipeline.test.js`
Expected: FAIL with `Cannot find module`.

- [ ] **Step 3: Implement `lib/pipeline.js`**

```js
import path from 'node:path';
import { KitError } from './errors.js';
import { detectHarness, installIntegrations } from './integrations.js';
import { createManifest, readManifest, writeManifest } from './manifest.js';
import { planSkills } from './plan.js';
import { loadRegistry } from './registry.js';
import { addToSelection, removeFromSelection, resolveTargetSkills, unknownSkillsMessage } from './resolve.js';
import { PROJECT_SKILLS_DIR, adoptLegacySkills, applySkillPlan, syncClaudeLinks } from './skills.js';
import { fetchTemplates, resolveSource, sourceMode } from './source.js';

const nextSelection = ({ command, existing, manifest, add, remove, registry }) => {
    if (command === 'install') {
        const nothingRequested = !add.all && add.profiles.length === 0 && add.skills.length === 0;
        return addToSelection(manifest.selection, !existing && nothingRequested ? { all: true } : add);
    }
    if (command === 'remove') {
        const unknown = remove.filter((name) => !registry.skills.includes(name));
        if (unknown.length) throw new KitError(unknownSkillsMessage(unknown, registry.skills));
        return removeFromSelection(manifest.selection, remove, registry);
    }
    return manifest.selection;
};

export const runPipeline = async ({ projectDir, command, add = { all: false, profiles: [], skills: [] }, remove = [], options }) => {
    const existing = readManifest(projectDir);
    if (command !== 'install' && !existing) {
        throw new KitError(`AI Kit is not installed in ${projectDir}. Run: hieund-ai-kit install`);
    }

    const source = resolveSource({ options, manifest: existing });
    const { templateDir, cleanup } = await fetchTemplates(source);
    try {
        const registry = loadRegistry(templateDir);
        const projectSkillsDir = path.join(projectDir, PROJECT_SKILLS_DIR);
        const manifest = existing ? { ...existing } : createManifest({ source });
        manifest.source = source;
        if (manifest.managedSkills === null) {
            manifest.managedSkills = adoptLegacySkills(projectSkillsDir, registry.skills);
        }
        manifest.selection = nextSelection({ command, existing, manifest, add, remove, registry });

        const mode = sourceMode(source);
        const plan = planSkills({
            targetSkills: resolveTargetSkills(manifest.selection, registry),
            managedSkills: manifest.managedSkills,
            projectSkillsDir,
            sourceSkillsDir: registry.skillsDir,
            mode,
            force: Boolean(options.force),
        });
        if (options.dryRun) return { plan, warnings: [], dryRun: true, manifest };

        const conflicts = plan.filter((item) => item.action === 'conflict').map((item) => item.name);
        if (conflicts.length) {
            throw new KitError(
                `Project-owned skills collide with kit skills: ${conflicts.join(', ')}. ` +
                'Rename them, or rerun with --force to let the kit take them over.',
            );
        }

        manifest.managedSkills = applySkillPlan({
            plan, projectSkillsDir, sourceSkillsDir: registry.skillsDir, mode, managedSkills: manifest.managedSkills,
        });
        const warnings = syncClaudeLinks({ projectDir, managedNames: Object.keys(manifest.managedSkills) });
        for (const item of plan) {
            if (item.action === 'skip-modified') {
                warnings.push(`Kept locally modified skill "${item.name}" (use --force to overwrite)`);
            }
        }
        if (command !== 'remove') installIntegrations(templateDir, projectDir);

        manifest.installedAt = new Date().toISOString();
        manifest.harness = detectHarness(projectDir);
        writeManifest(projectDir, manifest);
        return { plan, warnings, dryRun: false, manifest };
    } finally {
        cleanup();
    }
};

export const loadCatalog = async ({ projectDir, options }) => {
    const manifest = readManifest(projectDir);
    const source = resolveSource({ options, manifest });
    const { templateDir, cleanup } = await fetchTemplates(source);
    try {
        const registry = loadRegistry(templateDir);
        return {
            source,
            skills: registry.skills,
            profiles: registry.profiles,
            installed: Object.keys(manifest?.managedSkills ?? {}),
        };
    } finally {
        cleanup();
    }
};
```

Note: the conflict check runs after the dry-run return on purpose, so `--dry-run` can show conflicts in its plan.

- [ ] **Step 4: Implement `lib/status.js`**

```js
import fs from 'node:fs';
import path from 'node:path';
import { lstatOrNull } from './fsx.js';
import { hashSkillDir } from './hash.js';
import { readManifest } from './manifest.js';
import { CLAUDE_SKILLS_DIR, PROJECT_SKILLS_DIR } from './skills.js';

export const collectStatus = (projectDir) => {
    const manifest = readManifest(projectDir);
    if (!manifest) return { installed: false };

    const skillsDir = path.join(projectDir, PROJECT_SKILLS_DIR);
    const managedSkills = manifest.managedSkills ?? {};
    const missing = [];
    const modified = [];
    const brokenLinks = [];

    for (const [name, record] of Object.entries(managedSkills).sort(([a], [b]) => a.localeCompare(b))) {
        const entryPath = path.join(skillsDir, name);
        const stat = lstatOrNull(entryPath);
        if (!stat) {
            missing.push(name);
            continue;
        }
        if (stat.isSymbolicLink() && !fs.existsSync(entryPath)) {
            brokenLinks.push(path.join(PROJECT_SKILLS_DIR, name));
        } else if (record.hash && stat.isDirectory() && hashSkillDir(entryPath) !== record.hash) {
            modified.push(name);
        }
        if (!fs.existsSync(path.join(projectDir, CLAUDE_SKILLS_DIR, name))) {
            brokenLinks.push(path.join(CLAUDE_SKILLS_DIR, name));
        }
    }

    const entries = fs.existsSync(skillsDir) ? fs.readdirSync(skillsDir).filter((name) => !name.startsWith('.')) : [];
    return {
        installed: true,
        legacy: manifest.managedSkills === null,
        source: manifest.source,
        selection: manifest.selection,
        managed: Object.keys(managedSkills).sort(),
        missing,
        modified,
        brokenLinks,
        projectOwned: entries.filter((name) => !(name in managedSkills)).sort(),
    };
};
```

- [ ] **Step 5: Run it to see it pass**

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/pipeline.js lib/status.js test/pipeline.test.js
git commit -m "feat: add install/update/remove pipeline and offline status"
```

---

### Task 11: New CLI surface and end-to-end tests

**Files:**
- Modify: `bin/index.js` (rewrite), `package.json`
- Modify: `scripts/test-installer.mjs` (rewrite)

**Interfaces:**
- Consumes: `runPipeline`, `loadCatalog`, `collectStatus`, `KitError`.
- Produces: commands `install` (alias `init`), `remove`, `update`, `list`, `status`.

- [ ] **Step 1: Rewrite the end-to-end test first**

Replace `scripts/test-installer.mjs` with:

```js
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
```

- [ ] **Step 2: Run it to see it fail**

Run: `npm run test:installer`
Expected: FAIL (unknown option `--source` from the old CLI).

- [ ] **Step 3: Rewrite `bin/index.js`**

```js
#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { KitError } from '../lib/errors.js';
import { loadCatalog, runPipeline } from '../lib/pipeline.js';
import { collectStatus } from '../lib/status.js';

const CLI_VERSION = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
const ACTION_ORDER = ['add', 'update', 'remove', 'skip-modified', 'conflict', 'unchanged'];

const splitList = (value) => value.split(',').map((item) => item.trim()).filter(Boolean);
const projectDirOf = (options) => path.resolve(options.path || process.cwd());

const formatSource = (source) =>
    source.type === 'github' ? `github@${source.ref}` : `local ${source.path} (${source.mode})`;

const formatSelection = (selection) => {
    const parts = selection.all ? ['all'] : [...selection.profiles.map((p) => `profile:${p}`), ...selection.skills];
    const text = parts.join(', ') || '(empty)';
    return selection.exclude.length ? `${text} (excluding ${selection.exclude.join(', ')})` : text;
};

const report = ({ plan, warnings, dryRun }) => {
    console.log(chalk.blueBright(dryRun ? '\nPlanned skill changes (dry run):' : '\nSkill changes:'));
    for (const action of ACTION_ORDER) {
        const names = plan.filter((item) => item.action === action).map((item) => item.name);
        if (names.length) console.log(`  ${action.padEnd(14)} ${String(names.length).padStart(3)}  ${chalk.gray(names.join(', '))}`);
    }
    for (const warning of warnings) console.log(chalk.yellow(`⚠️  ${warning}`));
    if (!dryRun) console.log(chalk.green('\n✅ Done.'));
};

const run = (handler) => async (...args) => {
    try {
        await handler(...args);
    } catch (error) {
        console.error(chalk.red(`❌ ${error.message}`));
        if (!(error instanceof KitError)) console.error(error.stack);
        process.exit(1);
    }
};

const withPath = (command) => command.option('-p, --path <dir>', 'Project directory', process.cwd());

const withSource = (command) => withPath(command)
    .option('-r, --ref <ref>', 'GitHub ref (tag, commit, or branch) to install from')
    .option('-s, --source <dir>', 'Install from a local kit checkout instead of GitHub')
    .option('--link', 'With --source: symlink skills to the checkout instead of copying', false)
    .option('--dry-run', 'Print the plan without changing files', false)
    .option('-f, --force', 'Take over colliding skills and overwrite locally modified ones', false);

const installAction = async (skills, options) => {
    report(await runPipeline({
        projectDir: projectDirOf(options),
        command: 'install',
        add: { all: Boolean(options.all), profiles: options.profile ? splitList(options.profile) : [], skills },
        options,
    }));
};

const removeAction = async (skills, options) => {
    report(await runPipeline({ projectDir: projectDirOf(options), command: 'remove', remove: skills, options }));
};

const updateAction = async (options) => {
    report(await runPipeline({ projectDir: projectDirOf(options), command: 'update', options }));
};

const listAction = async (options) => {
    const catalog = await loadCatalog({ projectDir: projectDirOf(options), options });
    const installed = new Set(catalog.installed);
    console.log(chalk.blueBright(`\nSource: ${formatSource(catalog.source)}`));
    console.log(chalk.blueBright('\nProfiles:'));
    for (const [name, skills] of Object.entries(catalog.profiles)) console.log(`  ${name.padEnd(16)} ${chalk.gray(skills.join(', '))}`);
    console.log(chalk.blueBright(`\nSkills (${catalog.skills.length}):`));
    for (const name of catalog.skills) console.log(`  ${installed.has(name) ? chalk.green('✓') : ' '} ${name}`);
};

const statusAction = (options) => {
    const status = collectStatus(projectDirOf(options));
    if (!status.installed) {
        console.log(chalk.red('❌ AI Kit is not installed in this directory.'));
        console.log(chalk.yellow(`💡 Run ${chalk.cyan('hieund-ai-kit install')} to install.`));
        return;
    }
    console.log(chalk.blueBright('\n📊 AI Kit Status\n'));
    console.log(`Source:         ${formatSource(status.source)}`);
    console.log(`Selection:      ${formatSelection(status.selection)}`);
    console.log(`Managed skills: ${status.managed.length}`);
    if (status.legacy) console.log(chalk.yellow('Legacy install detected: run `hieund-ai-kit update` to migrate.'));
    const lists = [
        ['Modified', status.modified],
        ['Missing', status.missing],
        ['Broken links', status.brokenLinks],
        ['Project-owned', status.projectOwned],
    ];
    for (const [label, items] of lists) {
        if (items.length) console.log(`${`${label}:`.padEnd(16)}${items.join(', ')}`);
    }
    const healthy = !status.legacy && status.missing.length === 0 && status.brokenLinks.length === 0;
    console.log(healthy ? chalk.green('\nAI Kit: HEALTHY') : chalk.yellow('\nAI Kit: NEEDS UPDATE (run `hieund-ai-kit update`)'));
};

const isDirectCliInvocation = () => {
    if (!process.argv[1]) return false;
    try {
        return fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
    } catch {
        return false;
    }
};

const program = new Command();
program
    .name('hieund-ai-kit')
    .description('Install and manage Hieund AI Kit skills for Codex, Gemini, and Claude Code')
    .version(CLI_VERSION, '-v, --version', 'Display version number');

withSource(program.command('install').alias('init'))
    .description('Install skills (all by default) plus hooks and root instructions')
    .argument('[skills...]', 'Skill names to add')
    .option('--profile <names>', 'Comma-separated profile names to add')
    .option('--all', 'Select every skill', false)
    .action(run(installAction));

withSource(program.command('remove'))
    .description('Remove skills from the selection and the project')
    .argument('<skills...>', 'Skill names to remove')
    .action(run(removeAction));

withSource(program.command('update'))
    .description('Refresh managed skills, hooks, and root instruction blocks')
    .action(run(updateAction));

withPath(program.command('list'))
    .description('List available skills and profiles')
    .option('-r, --ref <ref>', 'GitHub ref to list from')
    .option('-s, --source <dir>', 'List from a local kit checkout')
    .action(run(listAction));

withPath(program.command('status'))
    .description('Show installation status (offline)')
    .action(run(statusAction));

if (isDirectCliInvocation()) {
    program.parse(process.argv);
    if (!process.argv.slice(2).length) program.outputHelp();
}
```

- [ ] **Step 4: Update `package.json`**

Set `"version": "3.0.0"`, add `"lib"` to `files`, and set:

```json
"verify": "node --check bin/index.js && npm run test:unit && npm run test:installer && npm run test:hooks && npm run check:templates"
```

- [ ] **Step 5: Verify**

Run: `npm run verify`
Expected: PASS, ending with `Template consistency check passed`.

- [ ] **Step 6: Commit**

```bash
git add bin/index.js package.json scripts/test-installer.mjs
git commit -m "feat!: manifest-based install, update, remove, list, and status commands"
```

---

### Task 12: Documentation and Harness records

**Files:**
- Modify: `README.md`, `docs/ARCHITECTURE.md`, `docs/HARNESS.md`, `docs/product/toolkits.md`, `docs/decisions/README.md`
- Create: `docs/decisions/0015-single-skill-source-and-manifest-installer.md`, `docs/stories/KIT-027-skill-distribution.md`

**Interfaces:**
- Consumes: final CLI surface from Task 11.
- Produces: docs matching behavior.

- [ ] **Step 1: README**

Replace the install result table with:

```markdown
| Tool | Skills | Integration Config | Root Instruction |
|:---|:---|:---|:---|
| Codex | `.agents/skills/` | `.codex/hooks.json` + `.codex/hooks/` | `AGENTS.md` |
| Gemini Antigravity | `.agents/skills/` | `.agents/hooks.json` + `.agents/gemini/hooks/` | `GEMINI.md` |
| Claude Code | `.claude/skills/<name>` → `../../.agents/skills/<name>` | `.claude/settings.json` | `CLAUDE.md` |
```

Replace the "Lệnh CLI" table with:

```markdown
| Lệnh | Mô tả |
|:---|:---|
| `install` | Cài tất cả skill, hooks, và root instructions (alias: `init`) |
| `install --profile a,b` | Thêm skill theo profile khai báo trong `templates/kit.json` |
| `install <skill...>` | Thêm từng skill |
| `remove <skill...>` | Bỏ skill khỏi lựa chọn và khỏi project |
| `update` | Cập nhật skill do kit quản lý, hooks, và block `KIT` |
| `list` | Liệt kê skill và profile có sẵn |
| `status` | Kiểm tra trạng thái (không cần mạng) |

Tùy chọn chung: `--path <dir>`, `--ref <ref>`, `--source <dir>`, `--link`,
`--dry-run`, `--force`.
```

Add a section after it:

````markdown
## Phát Triển Skill Với `--link`

Khi sửa skill trên máy này, link project vào checkout của kit để thấy thay đổi
ngay mà không cần push hay cài lại:

```bash
hieund-ai-kit install --path ~/code/my-project --source ~/code/hieund-ai-kit-cli --link --profile starter
```

Thêm/xóa skill hoặc sửa profile thì chạy `update`. Quay lại bản copy từ GitHub:
`hieund-ai-kit update --ref main`.

Skill trong `.agents/skills/` không có trong `managedSkills` của `.ai-kit.json`
là skill của project; kit không bao giờ sửa hay xóa chúng.
````

Replace the template tree and the "Phát Triển Skill" section so it lists only `templates/.agents/skills/<skill-name>/` and `templates/kit.json`, and delete the paragraph about `shared/runtime/` and `npm run sync:shared-runtime`.

- [ ] **Step 2: Architecture and Harness docs**

In `docs/ARCHITECTURE.md`, remove `shared/runtime/` from the tree and the bullet at line 62 about editing shared scripts there; add `lib/` with one line per module from this plan's File Structure table, and `templates/kit.json`.

In `docs/HARNESS.md` lines 159 and 170, replace `templates/.agents/gemini/skills/` with `templates/.agents/skills/`, and delete the line that validates Gemini skills separately if it becomes a duplicate.

In `docs/product/toolkits.md` Claude Code section, replace the bullet about hook files with:

```markdown
- Skills: each managed skill is exposed as `.claude/skills/<name>`, a relative
  symlink to `../../.agents/skills/<name>`.
- The current template ships Claude hook files under `.agents/claude/hooks/`.
```

- [ ] **Step 3: ADR 0015**

`docs/decisions/0015-single-skill-source-and-manifest-installer.md`:

```markdown
# 0015 Single Skill Source and Manifest-Based Installer

Date: 2026-09-29

## Status

Accepted. Supersedes the per-runtime skill folders of ADR 0008. Extends the
ownership table of ADR 0014.

## Context

Codex and Gemini skills were maintained as two diverged copies, skill scripts
existed three times, Claude Code discovered no skills, and `update` replaced
`.agents/skills/` wholesale, deleting project-owned skills.

## Decision

- `templates/.agents/skills/` is the only skill source. Codex and Antigravity
  read `.agents/skills/`; Claude Code reads relative symlinks in
  `.claude/skills/`.
- `templates/kit.json` holds `formatVersion` and named profiles.
- `.ai-kit.json` records source, selection, and `managedSkills` with content
  hashes. Only managed skills are updated or removed; locally modified managed
  skills are skipped unless `--force`.
- `--source <dir> --link` symlinks project skills to a local checkout for
  development; GitHub by ref remains the release channel.

| Component / Path | Owner | Install / Update Rule |
| --- | --- | --- |
| `.agents/skills/<name>` listed in `managedSkills` | Kit | Replaced per skill; skipped when locally modified. |
| `.agents/skills/<name>` not listed | Project | Never modified or removed. |
| `.claude/skills/<name>` symlink into `.agents/skills/` | Kit | Created and removed with the managed skill. |
| Other `.claude/skills/` entries | Project | Never modified. |

## Consequences

Positive: one edit per skill, all three tools discover skills natively,
selective installs, safe updates.

Tradeoffs: symlinks are required (no Windows support); legacy installs have no
recorded hashes, so edits made before migration are overwritten by the first
`update`.
```

- [ ] **Step 4: Story KIT-027**

Copy `docs/templates/story.md` to `docs/stories/KIT-027-skill-distribution.md` and fill it: goal from the spec's Goal section, link to the spec and this plan, acceptance criteria equal to the spec's success criteria, verification command `npm run verify`, and the result of Task 11 Step 5.

- [ ] **Step 5: Verify**

Run each separately:

```bash
npm run verify
git grep -n -E "gemini/(skills|agents|workflows)|shared/runtime|sync-shared-runtime" -- ':!docs/stories' ':!docs/specs' ':!docs/decisions/0013-local-backlog-mcp.md'
git diff --check
```

Expected: verify passes; the grep prints nothing (historical stories, specs, and ADR 0013 are excluded on purpose); `git diff --check` prints nothing.

- [ ] **Step 6: Commit**

```bash
git add README.md docs
git commit -m "docs: record single skill source, manifest installer, and link mode"
```
