import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';

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

/**
 * Atomically replace a destination directory with the contents of `src`.
 * Copies into a staging sibling directory first (same filesystem as `dest`),
 * then swaps it in with `rename`. This guarantees `dest` is never left in a
 * half-written state: on any failure during the copy, the original is
 * untouched and the staging dir is cleaned up.
 * @param {string} src source directory
 * @param {string} dest destination directory
 */
const atomicReplaceDir = (src, dest) => {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const parent = path.dirname(dest);
    const staging = path.join(parent, `.${path.basename(dest)}.tmp-${process.pid}-${Date.now()}`);
    try {
        fs.rmSync(staging, { recursive: true, force: true });
        fs.cpSync(src, staging, { recursive: true });
        // Swap: remove old, move staging into place. The window between these
        // two calls is tiny; rename within a filesystem is atomic.
        fs.rmSync(dest, { recursive: true, force: true });
        fs.renameSync(staging, dest);
    } catch (error) {
        fs.rmSync(staging, { recursive: true, force: true });
        throw error;
    }
};

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
    const incoming = JSON.parse(fs.readFileSync(src, 'utf8'));
    const existing = fs.existsSync(dest)
        ? JSON.parse(fs.readFileSync(dest, 'utf8'))
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
    const incoming = JSON.parse(fs.readFileSync(src, 'utf8'));
    const existing = fs.existsSync(dest)
        ? JSON.parse(fs.readFileSync(dest, 'utf8'))
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
            ? JSON.parse(fs.readFileSync(dest, 'utf8'))
            : {};
        const incoming = JSON.parse(fs.readFileSync(src, 'utf8'));

        const merged = {
            ...existing,
            ...incoming,
            [KIT_GEMINI_HOOK_KEY]: incoming[KIT_GEMINI_HOOK_KEY],
        };
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, `${JSON.stringify(merged, null, 2)}\n`);
    }
};

const copySharedFile = (src, dest) => {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (fs.existsSync(dest)) {
        const srcBuf = fs.readFileSync(src);
        const destBuf = fs.readFileSync(dest);
        if (!srcBuf.equals(destBuf)) {
            console.log(chalk.yellow(`⚠️  Preserved manually modified shared file: ${path.basename(dest)}`));
            return;
        }
    }
    fs.copyFileSync(src, dest);
};

const mergeSharedAssets = (srcDir, destDir) => {
    const srcScripts = path.join(srcDir, 'scripts');
    const destScripts = path.join(destDir, 'scripts');
    if (fs.existsSync(srcScripts)) {
        const entries = fs.readdirSync(srcScripts, { recursive: true, withFileTypes: true });
        for (const entry of entries) {
            const relPath = path.relative(srcScripts, path.join(entry.parentPath || entry.path, entry.name));
            const srcFile = path.join(srcScripts, relPath);
            const destFile = path.join(destScripts, relPath);
            if (entry.isFile()) {
                copySharedFile(srcFile, destFile);
            }
        }
    }

    const srcShared = path.join(srcDir, 'shared');
    const destShared = path.join(destDir, 'shared');
    if (fs.existsSync(srcShared)) {
        const entries = fs.readdirSync(srcShared, { recursive: true, withFileTypes: true });
        for (const entry of entries) {
            const relPath = path.relative(srcShared, path.join(entry.parentPath || entry.path, entry.name));
            const srcFile = path.join(srcShared, relPath);
            const destFile = path.join(destShared, relPath);
            if (entry.isFile()) {
                copySharedFile(srcFile, destFile);
            }
        }
    }
};

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
