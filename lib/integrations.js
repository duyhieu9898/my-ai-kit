import fs from 'node:fs';
import path from 'node:path';
import { readJsonFile } from './fsx.js';
import { hashFile, isIgnoredName } from './hash.js';
import { removeEmptyDirs } from './skills.js';

const CODEX_HOOK_COMMAND_MARKERS = [
    '.codex/hooks/codex_adapter.py',
    '.codex/hooks/harness_guard.py',
];
const CLAUDE_HOOK_COMMAND_MARKERS = [
    '.agents/claude/hooks/claude_adapter.py',
    '.agents/claude/hooks/harness_guard.py',
];
const KIT_GEMINI_HOOK_KEY = 'hieund-ai-kit-harness-guard';
const INSTRUCTION_BLOCK_PATTERN = /^<!--\s*([A-Z0-9_-]+):BEGIN\s*-->[\s\S]*?^<!--\s*\1:END\s*-->/gm;

const isKitCodexHookGroup = (group) =>
    Array.isArray(group?.hooks) &&
    group.hooks.some((hook) =>
        typeof hook?.command === 'string' &&
        CODEX_HOOK_COMMAND_MARKERS.some((marker) => hook.command.includes(marker))
    );

const isKitClaudeHookGroup = (group) =>
    Array.isArray(group?.hooks) &&
    group.hooks.some((hook) =>
        typeof hook?.command === 'string' &&
        CLAUDE_HOOK_COMMAND_MARKERS.some((marker) => hook.command.includes(marker))
    );

const mergeCodexHooksFile = (src, dest) => {
    const incoming = readJsonFile(src);
    const existing = fs.existsSync(dest)
        ? readJsonFile(dest)
        : {};
    const merged = { ...existing, hooks: { ...(existing.hooks || {}) } };

    for (const [event, incomingGroups] of Object.entries(incoming.hooks || {})) {
        const existingGroups = Array.isArray(merged.hooks[event])
            ? merged.hooks[event].filter((group) => !isKitCodexHookGroup(group))
            : [];
        merged.hooks[event] = [...existingGroups, ...incomingGroups];
    }

    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, `${JSON.stringify(merged, null, 2)}\n`);
};

const mergeClaudeSettingsFile = (src, dest) => {
    const incoming = readJsonFile(src);
    const existing = fs.existsSync(dest)
        ? readJsonFile(dest)
        : {};
    const merged = { ...existing, hooks: { ...(existing.hooks || {}) } };

    for (const [event, incomingGroups] of Object.entries(incoming.hooks || {})) {
        const existingGroups = Array.isArray(merged.hooks[event])
            ? merged.hooks[event].filter((group) => !isKitClaudeHookGroup(group))
            : [];
        merged.hooks[event] = [...existingGroups, ...incomingGroups];
    }

    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, `${JSON.stringify(merged, null, 2)}\n`);
};


const extractInstructionBlocks = (text) =>
    [...text.matchAll(INSTRUCTION_BLOCK_PATTERN)].map((match) => ({
        name: match[1],
        text: match[0],
    }));

const mergeInstructionBlocks = (incomingText, existingText) => {
    const incomingBlocks = extractInstructionBlocks(incomingText);

    // If incomingText has no blocks, fall back to old behavior of appending existing blocks to incomingText
    if (incomingBlocks.length === 0) {
        const existingBlocks = extractInstructionBlocks(existingText);
        if (existingBlocks.length === 0) {
            return incomingText;
        }
        const appendedBlocks = existingBlocks.map((block) => block.text);
        return `${incomingText.trimEnd()}\n\n${appendedBlocks.join('\n\n')}\n`;
    }

    // New behavior: existingText (project-owned file) is the base.
    let mergedText = existingText;
    const existingBlocks = extractInstructionBlocks(existingText);
    const existingBlockNames = new Set(existingBlocks.map((block) => block.name));

    for (const block of incomingBlocks) {
        if (existingBlockNames.has(block.name)) {
            const blockPattern = new RegExp(
                `^<!--\\s*${block.name}:BEGIN\\s*-->[\\s\\S]*?^<!--\\s*${block.name}:END\\s*-->`,
                'm',
            );
            mergedText = mergedText.replace(blockPattern, () => block.text);
        } else {
            mergedText = `${mergedText.trimEnd()}\n\n${block.text}\n`;
        }
    }

    return mergedText;
};

const mergeRootInstructionBlock = (src, dest, overwriteRootInstruction) => {
    if (!fs.existsSync(src)) {
        return;
    }
    if (overwriteRootInstruction || !fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
        return;
    }
    const incomingText = fs.readFileSync(src, 'utf8');
    const existingText = fs.readFileSync(dest, 'utf8');
    fs.writeFileSync(dest, mergeInstructionBlocks(incomingText, existingText));
};

const mergeWorkspaceHooks = (src, dest, targetName) => {
    if (!fs.existsSync(src)) {
        return;
    }
    if (targetName === 'codex') {
        mergeCodexHooksFile(src, dest);
    } else if (targetName === 'claude') {
        mergeClaudeSettingsFile(src, dest);
    } else if (targetName === 'gemini') {
        const existing = fs.existsSync(dest)
            ? readJsonFile(dest)
            : {};
        const incoming = readJsonFile(src);

        const merged = {
            ...existing,
            ...incoming,
            [KIT_GEMINI_HOOK_KEY]: incoming[KIT_GEMINI_HOOK_KEY],
        };
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, `${JSON.stringify(merged, null, 2)}\n`);
    }
};

const HOOK_GROUP_FILTERS = { codex: isKitCodexHookGroup, claude: isKitClaudeHookGroup };

/** Deletes a file and then each parent folder inside the project that it left empty. */
const removeFileAndEmptyParents = (filePath, projectDir) => {
    fs.rmSync(filePath, { force: true });
    const dirs = [];
    for (let dir = path.dirname(filePath); dir.startsWith(`${projectDir}${path.sep}`); dir = path.dirname(dir)) dirs.push(dir);
    removeEmptyDirs(dirs);
};

const writeJsonOrDelete = (dest, value, isEmpty, projectDir) => {
    if (isEmpty) removeFileAndEmptyParents(dest, projectDir);
    else fs.writeFileSync(dest, `${JSON.stringify(value, null, 2)}\n`);
};

/** Strips the kit's hook entries for an agent; deletes the file when nothing else is left in it. */
const removeWorkspaceHooks = (dest, targetName, projectDir) => {
    if (!fs.existsSync(dest)) return;
    const existing = readJsonFile(dest);
    if (targetName === 'gemini') {
        const { [KIT_GEMINI_HOOK_KEY]: _kit, ...rest } = existing;
        writeJsonOrDelete(dest, rest, Object.keys(rest).length === 0, projectDir);
        return;
    }
    const isKitGroup = HOOK_GROUP_FILTERS[targetName];
    if (!isKitGroup) return;
    const hooks = {};
    for (const [event, groups] of Object.entries(existing.hooks || {})) {
        const kept = Array.isArray(groups) ? groups.filter((group) => !isKitGroup(group)) : groups;
        if (!Array.isArray(kept) || kept.length) hooks[event] = kept;
    }
    const { hooks: _hooks, ...rest } = existing;
    const next = Object.keys(hooks).length ? { ...rest, hooks } : rest;
    writeJsonOrDelete(dest, next, Object.keys(next).length === 0, projectDir);
};

/** Strips the template's named blocks from a root instruction; deletes the file when only blanks remain. */
const removeRootInstructionBlocks = (src, dest, projectDir) => {
    if (!fs.existsSync(src) || !fs.existsSync(dest)) return;
    let text = fs.readFileSync(dest, 'utf8');
    for (const block of extractInstructionBlocks(fs.readFileSync(src, 'utf8'))) {
        const blockPattern = new RegExp(
            `^<!--\\s*${block.name}:BEGIN\\s*-->[\\s\\S]*?^<!--\\s*${block.name}:END\\s*-->\\n?`,
            'm',
        );
        text = text.replace(blockPattern, '');
    }
    text = text.replace(/\n{3,}/g, '\n\n');
    if (text.trim() === '') removeFileAndEmptyParents(dest, projectDir);
    else fs.writeFileSync(dest, `${text.trimEnd()}\n`);
};

/**
 * Install a shared file unless the project changed it since the kit last wrote it.
 * A file counts as kit-owned when it is missing, matches its recorded hash, or when
 * no hashes were ever recorded (`managedFiles: null`, a legacy install being adopted).
 */
const copySharedFile = (src, dest, state) => {
    const key = path.relative(state.projectDir, dest).split(path.sep).join('/');
    const srcHash = hashFile(src);
    if (fs.existsSync(dest)) {
        const destHash = hashFile(dest);
        const recorded = state.managedFiles?.[key];
        const kitOwned = state.managedFiles === null || destHash === recorded ||
            (state.adoptUnrecorded && recorded === undefined);
        if (destHash !== srcHash && !kitOwned && !state.force) {
            state.warnings.push(`Kept locally modified shared file "${key}" (use --force to overwrite)`);
            if (recorded) state.nextManagedFiles[key] = recorded;
            return;
        }
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    state.nextManagedFiles[key] = srcHash;
};

const listFiles = (dir) => fs.readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(dir, path.join(entry.parentPath || entry.path, entry.name)))
    .filter((relPath) => !relPath.split(path.sep).some(isIgnoredName))
    .sort();

/** Expands config `files` entries into project-relative destination keys mapped to template paths. */
const wantedFiles = (templateDir, configs) => {
    const wanted = new Map();
    for (const config of configs) {
        for (const { src, dest } of config.files) {
            const srcPath = path.join(templateDir, src);
            if (src.endsWith('/')) {
                for (const relPath of listFiles(srcPath)) {
                    wanted.set(path.join(dest, relPath).split(path.sep).join('/'), path.join(srcPath, relPath));
                }
            } else {
                wanted.set(path.normalize(dest).split(path.sep).join('/'), srcPath);
            }
        }
    }
    return wanted;
};

/** Deletes kit files no selected agent wants any more, keeping ones the project changed. */
const removeStaleFiles = (wanted, state) => {
    for (const [key, recorded] of Object.entries(state.managedFiles ?? {})) {
        if (wanted.has(key)) continue;
        // The manifest is project data: never delete through a key or symlink that leaves the project.
        const outside = () => state.warnings.push(`Ignored managed file "${key}": it points outside the project`);
        if (path.isAbsolute(key) || key.split(/[\\/]/).includes('..')) {
            outside();
            continue;
        }
        const filePath = path.join(state.projectDir, key);
        if (!fs.existsSync(filePath)) continue;
        if (!fs.realpathSync(filePath).startsWith(`${fs.realpathSync(state.projectDir)}${path.sep}`)) {
            outside();
            continue;
        }
        if (hashFile(filePath) === recorded || state.force) {
            removeFileAndEmptyParents(filePath, state.projectDir);
        } else {
            state.warnings.push(`Left locally modified "${key}" in place; the kit no longer installs it`);
        }
    }
};

/** Pre-4.0 installs kept Gemini skills, agents, and workflows under `.agents/gemini/`. */
const LEGACY_GEMINI_FOLDERS = ['skills', 'agents', 'workflows'];

/**
 * Installs the root instruction `KIT` block, hook registration, and files of every selected agent
 * plus `agents/shared.json`, and takes out the instruction block and hooks of agents removed since
 * the last run. Files the kit recorded but no longer wants are deleted when unmodified.
 * `adoptUnrecorded` treats existing unrecorded files as kit-owned (migrating an install that did
 * not hash its hook scripts). Returns the file hashes to record and warnings.
 */
export const installIntegrations = (registry, projectDir, {
    agents, previousAgents = [], managedFiles = null, force = false, adoptUnrecorded = false,
}) => {
    const { templateDir } = registry;
    const state = { projectDir, managedFiles, force, adoptUnrecorded, nextManagedFiles: {}, warnings: [] };
    for (const agent of agents) {
        const { instruction, hooks } = registry.agents[agent];
        if (instruction) {
            mergeRootInstructionBlock(path.join(templateDir, instruction.src), path.join(projectDir, instruction.dest), false);
        }
        if (hooks) mergeWorkspaceHooks(path.join(templateDir, hooks.src), path.join(projectDir, hooks.dest), agent);
    }
    for (const agent of previousAgents.filter((name) => !agents.includes(name) && registry.agents[name])) {
        const { instruction, hooks } = registry.agents[agent];
        if (instruction) {
            removeRootInstructionBlocks(path.join(templateDir, instruction.src), path.join(projectDir, instruction.dest), projectDir);
        }
        if (hooks) removeWorkspaceHooks(path.join(projectDir, hooks.dest), agent, projectDir);
    }

    const wanted = wantedFiles(templateDir, [registry.shared, ...agents.map((agent) => registry.agents[agent])]);
    for (const [key, src] of wanted) copySharedFile(src, path.join(projectDir, key), state);
    removeStaleFiles(wanted, state);

    if (adoptUnrecorded) {
        for (const folder of LEGACY_GEMINI_FOLDERS) {
            fs.rmSync(path.join(projectDir, '.agents', 'gemini', folder), { recursive: true, force: true });
        }
    }
    return { managedFiles: state.nextManagedFiles, warnings: state.warnings };
};

export const detectHarness = (projectDir) => {
    const enabled = fs.existsSync(path.join(projectDir, 'docs', 'HARNESS.md')) ||
        fs.existsSync(path.join(projectDir, 'scripts', 'bin', 'harness-cli'));
    return { enabled, source: enabled ? 'repository-harness' : 'standalone' };
};

export { mergeInstructionBlocks, mergeRootInstructionBlock, mergeWorkspaceHooks, copySharedFile };
