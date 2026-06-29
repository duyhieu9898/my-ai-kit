#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { downloadTemplate } from 'giget';
import path from 'path';
import fs from 'fs';
import os from 'os';
import readline from 'readline';
import { fileURLToPath } from 'url';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const REPO = 'github:duyhieu9898/my-ai-kit';
const TEMPLATES_FOLDER = 'templates';
const TEMP_PREFIX = 'hieund-ai-kit-';
const INSTALL_FOLDER = '.agents';
const DEFAULT_TARGET = 'codex';
const CODEX_CONFIG_FOLDER = '.codex';
const CONFIG_FILE = '.ai-kit.json';
const CODEX_HOOK_COMMAND_MARKERS = [
    '.codex/hooks/codex_adapter.py',
    '.codex/hooks/harness_guard.py',
];
const GEMINI_HOOK_CONFIG = 'hooks.json';
const GEMINI_HOOK_FOLDER = 'hooks';
const KIT_GEMINI_HOOK_KEY = 'hieund-ai-kit-harness-guard';
const INSTRUCTION_BLOCK_PATTERN = /^<!--\s*([A-Z0-9_-]+):BEGIN\s*-->[\s\S]*?^<!--\s*\1:END\s*-->/gm;

/**
 * Target registry — maps a target name to its configuration.
 * Adding a new AI tool target means adding one entry here and one folder
 * under `templates/<templateDir>/`.
 */
const TARGET_REGISTRY = {
    codex: {
        displayName: 'OpenAI Codex Kit',
        bannerColor: chalk.magentaBright,
        tagLine: '✨ Codex Standard (Recommended)',
        description: 'Unified composable skills & cascading rules',
        templateDir: 'codex',
        // Signature root instruction file, used as a detection fallback when
        // the `.kit-target` marker is missing. Must be unique per target.
        rootInstruction: 'AGENTS.md',
    },
    gemini: {
        displayName: 'Gemini Antigravity Kit',
        bannerColor: chalk.blueBright,
        tagLine: '🚀 Gemini Framework',
        description: 'Multi-agent routing & slash workflows',
        templateDir: 'gemini',
        rootInstruction: 'GEMINI.md',
    },
};

// ============================================================================
// REGISTRY & DETECTION
// ============================================================================

/**
 * Resolve a target configuration by name. Exits the process with a non-zero
 * code and a helpful message when the target is unknown.
 * @param {string} targetName
 * @returns {object} target configuration
 */
const getTargetConfig = (targetName) => {
    const config = TARGET_REGISTRY[targetName];
    if (!config) {
        const validTargets = Object.keys(TARGET_REGISTRY).join(', ');
        console.error(chalk.red(`❌ Unknown target: "${targetName}". Valid targets: ${validTargets}`));
        process.exit(1);
    }
    return config;
};

/**
 * Convention-based root instruction detection. Returns the names of top-level
 * files in a template directory (everything that is not the `.agents/` install
 * folder).
 * @param {string} templatePath
 * @returns {string[]}
 */
const getRootInstructionFiles = (templatePath) => {
    if (!fs.existsSync(templatePath)) {
        return [];
    }
    return fs
        .readdirSync(templatePath, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name);
};

/**
 * Detect the installed target.
 *
 * Primary signal: the `.agents/.kit-target` marker file. When the marker is
 * missing or invalid, fall back to detecting a target by its signature root
 * instruction file (e.g. `AGENTS.md` for codex, `GEMINI.md` for gemini). The
 * fallback only resolves when exactly one target's signature is present, to
 * avoid guessing on ambiguous setups.
 * @param {string} projectDir
 * @returns {string|null} target name or null when none is detected
 */
const detectInstalledTarget = (projectDir) => {
    const configPath = path.join(projectDir, CONFIG_FILE);
    let configTarget = null;
    if (fs.existsSync(configPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            if (config && config.target && TARGET_REGISTRY[config.target]) {
                configTarget = config.target;
            }
        } catch {
            // Ignore parsing errors
        }
    }

    if (configTarget) {
        return configTarget;
    }

    // Fallback: infer from signature root instruction files.
    const installExists = fs.existsSync(path.join(projectDir, INSTALL_FOLDER));
    const matches = Object.entries(TARGET_REGISTRY).filter(([, cfg]) =>
        cfg.rootInstruction && fs.existsSync(path.join(projectDir, cfg.rootInstruction))
    );
    // Only trust the fallback when .agents/ exists and exactly one target's
    // signature file is found.
    if (installExists && matches.length === 1) {
        return matches[0][0];
    }
    return null;
};

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Display dynamic ASCII banner.
 * @param {object} config
 */
const showBanner = (config) => {
    console.log(config.bannerColor(`
    ╔══════════════════════════════════════════════════════╗
    ║             ⚡ HIEUND AI KIT CLI ⚡                  ║
    ╠══════════════════════════════════════════════════════╣
    ║  Target:   %-40s  ║
    ║  Format:   %-40s  ║
    ╚══════════════════════════════════════════════════════╝
    `),
    config.displayName,
    config.tagLine
    );
};

/**
 * Ask the user for confirmation.
 * @param {string} question
 * @returns {Promise<boolean>}
 */
const confirm = (question) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(chalk.yellow(`${question} (y/N): `), (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
};

/**
 * Remove the temporary directory if present.
 * @param {string} tempDir
 */
const cleanup = (tempDir) => {
    if (tempDir && fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
};

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

const mergeDirectory = (src, dest) => {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const entrySrc = path.join(src, entry.name);
        const entryDest = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            mergeDirectory(entrySrc, entryDest);
        } else if (
            path.basename(src) === CODEX_CONFIG_FOLDER &&
            entry.name === 'hooks.json'
        ) {
            mergeCodexHooksFile(entrySrc, entryDest);
        } else {
            fs.copyFileSync(entrySrc, entryDest);
        }
    }
};

const extractInstructionBlocks = (text) =>
    [...text.matchAll(INSTRUCTION_BLOCK_PATTERN)].map((match) => ({
        name: match[1],
        text: match[0],
    }));

const mergeInstructionBlocks = (incomingText, existingText) => {
    const incomingBlocks = extractInstructionBlocks(incomingText);

    // If incomingText has no blocks, fall back to old behavior of using incomingText as base
    if (incomingBlocks.length === 0) {
        const existingBlocks = extractInstructionBlocks(existingText);
        if (existingBlocks.length === 0) {
            return incomingText;
        }

        let mergedText = incomingText;
        const incomingBlockNames = new Set(extractInstructionBlocks(incomingText).map((block) => block.name));
        const appendedBlocks = [];

        for (const block of existingBlocks) {
            if (incomingBlockNames.has(block.name)) {
                const blockPattern = new RegExp(
                    `^<!--\\s*${block.name}:BEGIN\\s*-->[\\s\\S]*?^<!--\\s*${block.name}:END\\s*-->`,
                    'm',
                );
                mergedText = mergedText.replace(blockPattern, block.text);
            } else {
                appendedBlocks.push(block.text);
            }
        }

        if (appendedBlocks.length === 0) {
            return mergedText;
        }

        return `${mergedText.trimEnd()}\n\n${appendedBlocks.join('\n\n')}\n`;
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
            mergedText = mergedText.replace(blockPattern, block.text);
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

const installCodexRuntime = (templatePath, projectDir, overwriteRootInstruction) => {
    const srcAgents = path.join(templatePath, 'AGENTS.md');
    const destAgents = path.join(projectDir, 'AGENTS.md');
    mergeRootInstructionBlock(srcAgents, destAgents, overwriteRootInstruction);

    const srcHooks = path.join(templatePath, CODEX_CONFIG_FOLDER, 'hooks.json');
    const destHooks = path.join(projectDir, CODEX_CONFIG_FOLDER, 'hooks.json');
    mergeWorkspaceHooks(srcHooks, destHooks, 'codex');

    const srcSkills = path.join(templatePath, INSTALL_FOLDER, 'skills');
    const destSkills = path.join(projectDir, INSTALL_FOLDER, 'skills');
    if (fs.existsSync(srcSkills)) {
        atomicReplaceDir(srcSkills, destSkills);
    }

    mergeSharedAssets(path.join(templatePath, INSTALL_FOLDER), path.join(projectDir, INSTALL_FOLDER));
};

const installGeminiRuntime = (templatePath, projectDir, overwriteRootInstruction) => {
    const srcGemini = path.join(templatePath, 'GEMINI.md');
    const destGemini = path.join(projectDir, 'GEMINI.md');
    mergeRootInstructionBlock(srcGemini, destGemini, overwriteRootInstruction);

    const srcHooks = path.join(templatePath, INSTALL_FOLDER, 'hooks.json');
    const destHooks = path.join(projectDir, INSTALL_FOLDER, 'hooks.json');
    mergeWorkspaceHooks(srcHooks, destHooks, 'gemini');

    const srcGeminiDir = path.join(templatePath, INSTALL_FOLDER, 'gemini');
    const destGeminiDir = path.join(projectDir, INSTALL_FOLDER, 'gemini');
    if (fs.existsSync(srcGeminiDir)) {
        atomicReplaceDir(srcGeminiDir, destGeminiDir);
    }

    mergeSharedAssets(path.join(templatePath, INSTALL_FOLDER), path.join(projectDir, INSTALL_FOLDER));
};



/**
 * Download a single target's template subdirectory into a fresh temporary
 * directory (outside the project tree). Returns the path to the temp dir,
 * whose contents are the template files themselves.
 * @param {object} config target configuration
 * @param {string} [ref] optional repository ref (tag, commit, or branch) used
 *   to pin the download for reproducibility/security
 * @returns {Promise<string>} path to the downloaded template directory
 */
/**
 * Download the unified templates folder from the repository.
 * @param {string} [ref] optional repository ref
 * @returns {Promise<string>} path to the downloaded templates directory
 */
const downloadTemplates = async (ref) => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), TEMP_PREFIX));
    const localSource = process.env.HIEUND_AI_KIT_TEMPLATE_SOURCE;
    if (localSource) {
        if (fs.existsSync(localSource)) {
            fs.cpSync(localSource, tempDir, { recursive: true });
            return tempDir;
        }
    }
    const suffix = ref ? `#${ref}` : '';
    // giget supports fetching a subdirectory at a given ref: repo/sub/dir#ref
    await downloadTemplate(`${REPO}/${TEMPLATES_FOLDER}${suffix}`, { dir: tempDir, force: true });
    return tempDir;
};

/**
 * Resolve the repository ref to download from. `--ref` (tag/commit/branch)
 * takes precedence over the legacy `--branch` option.
 * @param {object} options
 * @returns {string|undefined}
 */
const resolveRef = (options) => options.ref || options.branch || undefined;

const isDirectCliInvocation = () => {
    if (!process.argv[1]) {
        return false;
    }

    try {
        return fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
    } catch {
        return false;
    }
};

// ============================================================================
// COMMANDS
// ============================================================================

/**
 * Initialize the AI Kit in the project. Installs both runtimes side-by-side.
 */
const initCommand = async (options) => {
    const projectDir = path.resolve(options.path || process.cwd());
    showBanner(TARGET_REGISTRY.codex);

    const spinner = ora({ text: 'Downloading templates from repository...', color: 'cyan' }).start();

    let templatePath = null;
    const ref = resolveRef(options);
    try {
        templatePath = await downloadTemplates(ref);
        spinner.stop();

        const collidingRootFiles = ['AGENTS.md', 'GEMINI.md'].filter((f) => fs.existsSync(path.join(projectDir, f)));
        const installDir = path.join(projectDir, INSTALL_FOLDER);
        const installExists = fs.existsSync(installDir);

        if (!options.force && (installExists || collidingRootFiles.length > 0)) {
            console.log(chalk.yellow(`\n⚠️  Existing AI Kit files/folders will be merged or updated:`));
            if (installExists) console.log(chalk.gray(`     - ${INSTALL_FOLDER}/`));
            collidingRootFiles.forEach((f) => console.log(chalk.gray(`     - ${f}`)));
            const ok = await confirm('Continue?');
            if (!ok) {
                console.log(chalk.gray('Operation cancelled.'));
                cleanup(templatePath);
                process.exit(0);
            }
        }

        installCodexRuntime(templatePath, projectDir, true);
        installGeminiRuntime(templatePath, projectDir, true);

        cleanup(templatePath);

        const harnessExists = fs.existsSync(path.join(projectDir, 'docs', 'HARNESS.md')) ||
                              fs.existsSync(path.join(projectDir, 'scripts', 'bin', 'harness-cli'));

        const configContent = {
            version: '2.0.0',
            ref: ref || 'main',
            installedAt: new Date().toISOString(),
            paths: {
                installDir: INSTALL_FOLDER,
            },
            harness: {
                enabled: harnessExists,
                source: harnessExists ? 'repository-harness' : 'standalone',
            },
            features: {
                backlog: true,
                guardHooks: true,
                toolRegistry: true,
            },
        };

        const configPath = path.join(projectDir, CONFIG_FILE);
        fs.writeFileSync(configPath, `${JSON.stringify(configContent, null, 2)}\n`);

        console.log(chalk.green(`\n✅ Successfully installed AI Kit!`));
        console.log(chalk.gray('\n──────────────────────────────────────────────────────'));
        console.log(chalk.white('📁 Installed:'));
        console.log(`   ${chalk.cyan(INSTALL_FOLDER + '/')} → ${chalk.gray(installDir)}`);
        console.log(`   ${chalk.cyan('AGENTS.md')} → ${chalk.gray(path.join(projectDir, 'AGENTS.md'))}`);
        console.log(`   ${chalk.cyan('GEMINI.md')} → ${chalk.gray(path.join(projectDir, 'GEMINI.md'))}`);
        console.log(chalk.gray('──────────────────────────────────────────────────────'));
        console.log(chalk.gray(`💡 Run tests via: ${chalk.cyan('python3 .agents/scripts/verify_all.py .')}\n`));
    } catch (error) {
        spinner.stop();
        console.error(chalk.red(`❌ Error: ${error.message}`));
        cleanup(templatePath);
        process.exit(1);
    }
};

/**
 * Update the installed AI Kit runtimes while preserving root instructions.
 */
const updateCommand = async (options) => {
    const projectDir = path.resolve(options.path || process.cwd());
    const configPath = path.join(projectDir, CONFIG_FILE);

    let existingConfig = {};
    if (fs.existsSync(configPath)) {
        try {
            existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8')) || {};
        } catch {
            // Ignore parse errors
        }
    }

    const spinner = ora({ text: 'Downloading templates from repository...', color: 'cyan' }).start();

    let templatePath = null;
    const ref = resolveRef(options) || existingConfig.ref || 'main';
    try {
        templatePath = await downloadTemplates(ref);
        spinner.stop();

        installCodexRuntime(templatePath, projectDir, false);
        installGeminiRuntime(templatePath, projectDir, false);

        cleanup(templatePath);

        const harnessExists = fs.existsSync(path.join(projectDir, 'docs', 'HARNESS.md')) ||
                              fs.existsSync(path.join(projectDir, 'scripts', 'bin', 'harness-cli'));

        const updatedConfig = {
            version: '2.0.0',
            ref: ref,
            installedAt: new Date().toISOString(),
            paths: {
                installDir: existingConfig.paths?.installDir || INSTALL_FOLDER,
            },
            harness: {
                enabled: harnessExists,
                source: harnessExists ? 'repository-harness' : 'standalone',
            },
            features: {
                backlog: existingConfig.features?.backlog !== undefined ? existingConfig.features.backlog : true,
                guardHooks: existingConfig.features?.guardHooks !== undefined ? existingConfig.features.guardHooks : true,
                toolRegistry: existingConfig.features?.toolRegistry !== undefined ? existingConfig.features.toolRegistry : true,
            },
        };
        fs.writeFileSync(configPath, `${JSON.stringify(updatedConfig, null, 2)}\n`);

        console.log(chalk.green(`\n✅ Updated AI Kit (${INSTALL_FOLDER}/ refreshed, shared configs merged, root instructions preserved).`));
    } catch (error) {
        spinner.stop();
        console.error(chalk.red(`❌ Error: ${error.message}`));
        cleanup(templatePath);
        process.exit(1);
    }
};

/**
 * Show the installation status of the project.
 */
const statusCommand = (options) => {
    const projectDir = path.resolve(options.path || process.cwd());
    const configPath = path.join(projectDir, CONFIG_FILE);
    
    const configExists = fs.existsSync(configPath);
    let config = null;
    if (configExists) {
        try {
            config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            
            const harnessExists = fs.existsSync(path.join(projectDir, 'docs', 'HARNESS.md')) ||
                                  fs.existsSync(path.join(projectDir, 'scripts', 'bin', 'harness-cli'));
            if (config && config.harness && config.harness.enabled !== harnessExists) {
                config.harness.enabled = harnessExists;
                config.harness.source = harnessExists ? 'repository-harness' : 'standalone';
                
                delete config.target;
                delete config.targets;

                fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
                console.log(chalk.gray('ℹ️ Automatically synchronized harness configuration state in .ai-kit.json.'));
            }
        } catch (e) {
            // Ignore parse errors
        }
    }

    let installDirName = INSTALL_FOLDER;
    if (config && config.paths && config.paths.installDir) {
        installDirName = config.paths.installDir;
    }
    const installDir = path.join(projectDir, installDirName);
    const installDirExists = fs.existsSync(installDir);

    const codexExists = fs.existsSync(path.join(installDir, 'skills'));
    const geminiExists = fs.existsSync(path.join(installDir, 'gemini'));

    console.log(chalk.blueBright('\n📊 AI Kit Installation Status\n'));

    if (!configExists && !installDirExists) {
        console.log(chalk.red('❌ AI Kit is not installed in this directory.'));
        console.log(chalk.yellow(`💡 Run ${chalk.cyan('hieund-ai-kit init')} to install.\n`));
        return;
    }

    let statusText = 'INSTALLED';
    let isCorrupted = false;
    let isUnconfigured = false;

    if (configExists && !installDirExists) {
        statusText = 'CORRUPTED (Install folder missing)';
        isCorrupted = true;
    } else if (!configExists && installDirExists) {
        statusText = 'UNCONFIGURED (Config file missing)';
        isUnconfigured = true;
    } else if (configExists && installDirExists && (!codexExists || !geminiExists)) {
        statusText = 'CORRUPTED (Missing Codex or Gemini runtime)';
        isCorrupted = true;
    }

    console.log(chalk.magentaBright(`AI Kit: ${statusText}`));
    console.log(chalk.gray('──────────────────────────────────────────────────────'));
    console.log(`📁 Path:         ${chalk.cyan(installDir)}`);
    
    if (config) {
        console.log(`📦 Version:      ${chalk.yellow(config.version || 'unknown')}`);
        console.log(`📍 Ref:          ${chalk.cyan(config.ref || 'unknown')}`);
        console.log(`📅 Installed At: ${chalk.gray(config.installedAt || 'unknown')}`);
        console.log(`🛠️  Harness:      ${chalk.gray(JSON.stringify(config.harness))}`);
        console.log(`✨ Features:     ${chalk.gray(JSON.stringify(config.features))}`);
    }

    if (installDirExists) {
        try {
            const stats = fs.statSync(installDir);
            const files = fs.readdirSync(installDir, { recursive: true });
            console.log(`📅 Modified:     ${chalk.gray(stats.mtime.toLocaleString('en-US'))}`);
            console.log(`📄 Items:        ${chalk.yellow(files.length)} items`);
        } catch (e) {
            // Ignore stats
        }
    }
    console.log(chalk.gray('──────────────────────────────────────────────────────'));

    if (isCorrupted) {
        console.log(chalk.red('\n❌ Error: The installation is corrupted.'));
        console.log(chalk.yellow(`💡 Run ${chalk.cyan('hieund-ai-kit repair')} to restore the missing runtimes.\n`));
    } else if (isUnconfigured) {
        console.log(chalk.yellow('\n⚠️  Warning: The installation is unconfigured.'));
        console.log(chalk.yellow(`💡 Run ${chalk.cyan('hieund-ai-kit update')} to automatically generate the configuration file.\n`));
    } else {
        console.log('');
    }
};

/**
 * Repair the installed AI Kit runtimes.
 */
const repairCommand = async (options) => {
    const projectDir = path.resolve(options.path || process.cwd());
    const configPath = path.join(projectDir, CONFIG_FILE);

    if (!fs.existsSync(configPath)) {
        console.log(chalk.yellow('⚠️  Configuration file missing. Re-creating config and repairing...'));
        const harnessExists = fs.existsSync(path.join(projectDir, 'docs', 'HARNESS.md')) ||
                              fs.existsSync(path.join(projectDir, 'scripts', 'bin', 'harness-cli'));
        const configContent = {
            version: '2.0.0',
            ref: 'main',
            installedAt: new Date().toISOString(),
            paths: {
                installDir: INSTALL_FOLDER,
            },
            harness: {
                enabled: harnessExists,
                source: harnessExists ? 'repository-harness' : 'standalone',
            },
            features: {
                backlog: true,
                guardHooks: true,
                toolRegistry: true,
            },
        };
        fs.writeFileSync(configPath, `${JSON.stringify(configContent, null, 2)}\n`);
    }

    let config;
    try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (e) {
        console.error(chalk.red(`❌ Failed to parse config file: ${e.message}`));
        process.exit(1);
    }

    const ref = config.ref || 'main';

    const spinner = ora({ text: `Downloading clean templates @${ref}...`, color: 'cyan' }).start();

    let templatePath = null;
    try {
        templatePath = await downloadTemplates(ref);
        spinner.stop();

        installCodexRuntime(templatePath, projectDir, false);
        installGeminiRuntime(templatePath, projectDir, false);

        cleanup(templatePath);

        config.installedAt = new Date().toISOString();
        fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

        console.log(chalk.green(`\n✅ Successfully repaired AI Kit!`));
    } catch (error) {
        spinner.stop();
        console.error(chalk.red(`❌ Repair failed: ${error.message}`));
        cleanup(templatePath);
        process.exit(1);
    }
};

// ============================================================================
// CLI DEFINITION
// ============================================================================

const program = new Command();

program
    .name('hieund-ai-kit')
    .description('Custom CLI tool to install and manage Hieund AI Kits')
    .version('2.0.0', '-v, --version', 'Display version number');

program
    .command('init')
    .description('Install the AI Kit runtimes and integrations (Codex and Gemini)')
    .option('-f, --force', 'Overwrite existing files without confirmation', false)
    .option('-p, --path <dir>', 'Path to the project directory', process.cwd())
    .option('-b, --branch <name>', 'Select repository branch')
    .option('-r, --ref <ref>', 'Pin to a repository ref (tag, commit, or branch); overrides --branch')
    .action(initCommand);

program
    .command('update')
    .description('Refresh the installed AI Kit runtimes and integrations')
    .option('-p, --path <dir>', 'Path to the project directory', process.cwd())
    .option('-b, --branch <name>', 'Select repository branch')
    .option('-r, --ref <ref>', 'Pin to a repository ref (tag, commit, or branch); overrides --branch')
    .action(updateCommand);

program
    .command('status')
    .description('Check installation status')
    .option('-p, --path <dir>', 'Path to the project directory', process.cwd())
    .action(statusCommand);

program
    .command('repair')
    .description('Restore missing or corrupted files of the installed AI Kit')
    .option('-p, --path <dir>', 'Path to the project directory', process.cwd())
    .action(repairCommand);

if (isDirectCliInvocation()) {
    program.parse(process.argv);

    if (!process.argv.slice(2).length) {
        program.outputHelp();
    }
}

export {
    installCodexRuntime,
    installGeminiRuntime,
    copySharedFile,
    mergeSharedAssets,
    mergeRootInstructionBlock,
    mergeWorkspaceHooks
};
