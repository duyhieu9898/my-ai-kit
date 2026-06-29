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
};

const copyRootInstructionFile = (src, dest, overwriteRootInstruction) => {
    if (!overwriteRootInstruction && fs.existsSync(dest)) {
        return;
    }

    if (!fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
        return;
    }

    const incomingText = fs.readFileSync(src, 'utf8');
    const existingText = fs.readFileSync(dest, 'utf8');
    fs.writeFileSync(dest, mergeInstructionBlocks(incomingText, existingText));
};

const mergeGeminiHooks = (existingPath, incomingPath, destinationPath) => {
    const existing = fs.existsSync(existingPath)
        ? JSON.parse(fs.readFileSync(existingPath, 'utf8'))
        : {};
    const incoming = JSON.parse(fs.readFileSync(incomingPath, 'utf8'));
    const merged = {
        ...existing,
        ...incoming,
        [KIT_GEMINI_HOOK_KEY]: incoming[KIT_GEMINI_HOOK_KEY],
    };
    fs.writeFileSync(destinationPath, `${JSON.stringify(merged, null, 2)}\n`);
};

const atomicReplaceInstallDir = (src, dest) => {
    const incomingHooksPath = path.join(src, GEMINI_HOOK_CONFIG);
    if (!fs.existsSync(incomingHooksPath)) {
        atomicReplaceDir(src, dest);
        return;
    }

    const parent = path.dirname(dest);
    const staging = path.join(parent, `.${path.basename(dest)}.tmp-${process.pid}-${Date.now()}`);
    try {
        fs.rmSync(staging, { recursive: true, force: true });
        fs.mkdirSync(staging, { recursive: true });

        const existingHookFolder = path.join(dest, GEMINI_HOOK_FOLDER);
        if (fs.existsSync(existingHookFolder)) {
            fs.cpSync(existingHookFolder, path.join(staging, GEMINI_HOOK_FOLDER), {
                recursive: true,
            });
        }

        fs.cpSync(src, staging, { recursive: true });
        mergeGeminiHooks(
            path.join(dest, GEMINI_HOOK_CONFIG),
            incomingHooksPath,
            path.join(staging, GEMINI_HOOK_CONFIG),
        );

        fs.rmSync(dest, { recursive: true, force: true });
        fs.renameSync(staging, dest);
    } catch (error) {
        fs.rmSync(staging, { recursive: true, force: true });
        throw error;
    }
};

const removeKitCodexHooks = (projectDir) => {
    const codexConfigDir = path.join(projectDir, CODEX_CONFIG_FOLDER);
    const hooksDir = path.join(codexConfigDir, 'hooks');
    const hooksPath = path.join(codexConfigDir, 'hooks.json');

    if (fs.existsSync(hooksPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
            const hooks = {};
            for (const [event, groups] of Object.entries(config.hooks || {})) {
                const retained = Array.isArray(groups)
                    ? groups.filter((group) => !isKitCodexHookGroup(group))
                    : groups;
                if (!Array.isArray(retained) || retained.length > 0) {
                    hooks[event] = retained;
                }
            }
            const updated = { ...config, hooks };
            if (Object.keys(hooks).length === 0 && Object.keys(updated).length === 1) {
                fs.rmSync(hooksPath, { force: true });
            } else {
                fs.writeFileSync(hooksPath, `${JSON.stringify(updated, null, 2)}\n`);
            }
        } catch (e) {
            // Ignore error
        }
    }

    fs.rmSync(
        path.join(hooksDir, 'harness_guard.py'),
        { force: true }
    );
    fs.rmSync(
        path.join(hooksDir, 'codex_adapter.py'),
        { force: true }
    );

    // Clean up __pycache__ inside hooksDir
    const pycacheDir = path.join(hooksDir, '__pycache__');
    if (fs.existsSync(pycacheDir)) {
        try {
            const pycacheFiles = fs.readdirSync(pycacheDir);
            for (const file of pycacheFiles) {
                if (file.startsWith('harness_guard.cpython-') || file.startsWith('codex_adapter.cpython-')) {
                    fs.rmSync(path.join(pycacheDir, file), { force: true });
                }
            }
            if (fs.readdirSync(pycacheDir).length === 0) {
                fs.rmSync(pycacheDir, { recursive: true, force: true });
            }
        } catch (e) {
            // Ignore
        }
    }

    // Clean up hooks directory if empty
    if (fs.existsSync(hooksDir)) {
        try {
            if (fs.readdirSync(hooksDir).length === 0) {
                fs.rmSync(hooksDir, { recursive: true, force: true });
            }
        } catch (e) {
            // Ignore
        }
    }

    // Clean up .codex directory if empty
    if (fs.existsSync(codexConfigDir)) {
        try {
            if (fs.readdirSync(codexConfigDir).length === 0) {
                fs.rmSync(codexConfigDir, { recursive: true, force: true });
            }
        } catch (e) {
            // Ignore
        }
    }
};

/**
 * Mirror-copy a template directory into the project root. The `.agents/`
 * install folder is replaced atomically. Shared configuration directories such
 * as `.codex/` are merged so project-local settings are preserved.
 * @param {string} templatePath
 * @param {string} projectDir
 * @param {object} options
 * @param {boolean} options.overwriteRootInstruction
 */
const mirrorCopy = (templatePath, projectDir, { overwriteRootInstruction = true } = {}) => {
    if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templatePath}`);
    }

    const entries = fs.readdirSync(templatePath, { withFileTypes: true });

    for (const entry of entries) {
        const src = path.join(templatePath, entry.name);
        const dest = path.join(projectDir, entry.name);

        if (entry.isFile()) {
            copyRootInstructionFile(src, dest, overwriteRootInstruction);
        } else if (entry.name === CODEX_CONFIG_FOLDER) {
            mergeDirectory(src, dest);
        } else if (entry.name === INSTALL_FOLDER) {
            atomicReplaceInstallDir(src, dest);
        } else {
            atomicReplaceDir(src, dest);
        }
    }
};

/**
 * Delete an installed target's root instruction files from the project root.
 * @param {string} oldTemplatePath path to the old target's template directory
 * @param {string} projectDir
 */
const cleanupOldTarget = (oldTemplatePath, projectDir, oldTarget) => {
    const rootFiles = getRootInstructionFiles(oldTemplatePath);
    for (const file of rootFiles) {
        const filePath = path.join(projectDir, file);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(chalk.gray(`  Deleted: ${file}`));
        }
    }
    if (oldTarget === 'codex' || fs.existsSync(path.join(oldTemplatePath, CODEX_CONFIG_FOLDER))) {
        removeKitCodexHooks(projectDir);
    }
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
const downloadTarget = async (config, ref) => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), TEMP_PREFIX));
    const subdir = `${TEMPLATES_FOLDER}/${config.templateDir}`;
    const suffix = ref ? `#${ref}` : '';
    // giget supports fetching a subdirectory at a given ref: repo/sub/dir#ref
    await downloadTemplate(`${REPO}/${subdir}${suffix}`, { dir: tempDir, force: true });
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
 * Initialize a selected target in the project. Destructive: replaces the
 * install folder and (on switch/force) the root instruction files.
 */
const initCommand = async (options) => {
    // Handle the deprecated --gemini flag.
    let targetName = options.target;
    if (options.gemini) {
        console.log(chalk.yellow('⚠️  --gemini is deprecated. Use --target gemini instead.'));
        targetName = targetName && targetName !== DEFAULT_TARGET ? targetName : 'gemini';
    }
    targetName = targetName || DEFAULT_TARGET;

    const config = getTargetConfig(targetName);
    showBanner(config);

    const projectDir = path.resolve(options.path || process.cwd());

    const installedTarget = detectInstalledTarget(projectDir);
    const isSwitch = installedTarget && installedTarget !== targetName;
    const isSameTarget = installedTarget === targetName;
    const installDir = path.join(projectDir, INSTALL_FOLDER);

    const spinner = ora({ text: 'Downloading templates from repository...', color: 'cyan' }).start();

    let templatePath = null;
    let oldTemplatePath = null;
    const ref = resolveRef(options);
    try {
        templatePath = await downloadTarget(config, ref);
        // On a switch, fetch the old target's template too so we can detect
        // which root instruction files it left behind.
        if (isSwitch) {
            oldTemplatePath = await downloadTarget(TARGET_REGISTRY[installedTarget], ref);
        }
        spinner.stop();

        // Determine which existing files would be affected.
        const newRootFiles = getRootInstructionFiles(templatePath);
        const collidingRootFiles = newRootFiles.filter((f) => fs.existsSync(path.join(projectDir, f)));
        const installExists = fs.existsSync(installDir);

        // Confirmation gate (skipped with --force).
        if (!options.force) {
            if (isSwitch) {
                console.log(chalk.yellow(`\n⚠️  Switching target: ${chalk.cyan(installedTarget)} → ${chalk.cyan(targetName)}`));
                const oldRootFiles = getRootInstructionFiles(oldTemplatePath).filter((f) =>
                    fs.existsSync(path.join(projectDir, f))
                );
                console.log(chalk.gray('   Will delete:'));
                oldRootFiles.forEach((f) => console.log(chalk.gray(`     - ${f}`)));
                if (installExists) console.log(chalk.gray(`     - ${INSTALL_FOLDER}/`));
                console.log(chalk.gray('   Will install:'));
                newRootFiles.forEach((f) => console.log(chalk.gray(`     + ${f}`)));
                console.log(chalk.gray(`     + ${INSTALL_FOLDER}/`));
            } else if (isSameTarget || installExists || collidingRootFiles.length > 0) {
                console.log(chalk.yellow(`\n⚠️  Existing files will be overwritten:`));
                if (installExists) console.log(chalk.gray(`     - ${INSTALL_FOLDER}/`));
                collidingRootFiles.forEach((f) => console.log(chalk.gray(`     - ${f}`)));
            }

            if (isSwitch || isSameTarget || installExists || collidingRootFiles.length > 0) {
                const ok = await confirm('Continue?');
                if (!ok) {
                    console.log(chalk.gray('Operation cancelled.'));
                    cleanup(templatePath);
                    cleanup(oldTemplatePath);
                    process.exit(0);
                }
            }
        }

        // Clean up the old target's root instructions on a switch.
        if (isSwitch) {
            cleanupOldTarget(oldTemplatePath, projectDir, installedTarget);
        }

        // Install.
        const installsCodexConfig = fs.existsSync(path.join(templatePath, CODEX_CONFIG_FOLDER));
        mirrorCopy(templatePath, projectDir, { overwriteRootInstruction: true });
        cleanup(templatePath);
        cleanup(oldTemplatePath);

        // Auto-detect harness
        const harnessExists = fs.existsSync(path.join(projectDir, 'docs', 'HARNESS.md')) ||
                              fs.existsSync(path.join(projectDir, 'scripts', 'bin', 'harness-cli'));

        const configContent = {
            target: targetName,
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

        // Success summary.
        console.log(chalk.green(`\n✅ Successfully installed ${config.displayName}!`));
        console.log(chalk.gray('\n──────────────────────────────────────────────────────'));
        console.log(chalk.white('📁 Installed:'));
        console.log(`   ${chalk.cyan(INSTALL_FOLDER + '/')} → ${chalk.gray(installDir)}`);
        if (installsCodexConfig) {
            console.log(`   ${chalk.cyan(CODEX_CONFIG_FOLDER + '/')} → ${chalk.gray(path.join(projectDir, CODEX_CONFIG_FOLDER))}`);
        }
        newRootFiles.forEach((f) => {
            console.log(`   ${chalk.cyan(f)} → ${chalk.gray(path.join(projectDir, f))}`);
        });
        console.log(chalk.gray('──────────────────────────────────────────────────────'));
        console.log(config.bannerColor(`\n${config.tagLine}`));
        console.log(chalk.gray(`💡 Run tests via: ${chalk.cyan('python3 .agents/scripts/verify_all.py .')}\n`));
    } catch (error) {
        spinner.stop();
        console.error(chalk.red(`❌ Error: ${error.message}`));
        cleanup(templatePath);
        cleanup(oldTemplatePath);
        process.exit(1);
    }
};

/**
 * Update the installed target's `.agents/` folder while preserving root
 * instruction files. Auto-detects the target when --target is omitted.
 */
const updateCommand = async (options) => {
    const projectDir = path.resolve(options.path || process.cwd());
    const installedTarget = detectInstalledTarget(projectDir);

    // Resolve which target to update.
    let targetName = options.target;
    if (options.gemini) {
        console.log(chalk.yellow('⚠️  --gemini is deprecated. Use --target gemini instead.'));
        targetName = targetName || 'gemini';
    }

    if (!targetName) {
        // Auto-detect.
        if (!installedTarget) {
            console.error(chalk.red('❌ No installed target detected.'));
            console.log(chalk.yellow(`💡 Run ${chalk.cyan('hieund-ai-kit init')} to install first.`));
            process.exit(1);
        }
        targetName = installedTarget;
    } else if (installedTarget && installedTarget !== targetName) {
        // Mismatch.
        console.error(chalk.red(`❌ Target mismatch: ${chalk.cyan(installedTarget)} is installed, but --target ${chalk.cyan(targetName)} was requested.`));
        console.log(chalk.yellow(`💡 To switch targets, run ${chalk.cyan('hieund-ai-kit init --target ' + targetName)}.`));
        process.exit(1);
    }

    const config = getTargetConfig(targetName);
    showBanner(config);

    const spinner = ora({ text: 'Downloading templates from repository...', color: 'cyan' }).start();

    let templatePath = null;
    try {
        const ref = resolveRef(options);
        templatePath = await downloadTarget(config, ref);
        spinner.stop();

        mirrorCopy(templatePath, projectDir, { overwriteRootInstruction: false });
        cleanup(templatePath);

        // Write or update `.ai-kit.json`
        const configPath = path.join(projectDir, CONFIG_FILE);
        let existingConfig = {};
        if (fs.existsSync(configPath)) {
            try {
                existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8')) || {};
            } catch {
                // Ignore parsing errors, overwrite
            }
        }

        const harnessExists = fs.existsSync(path.join(projectDir, 'docs', 'HARNESS.md')) ||
                              fs.existsSync(path.join(projectDir, 'scripts', 'bin', 'harness-cli'));

        const updatedConfig = {
            target: targetName,
            version: '2.0.0',
            ref: ref || existingConfig.ref || 'main',
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

        console.log(chalk.green(`\n✅ Updated ${config.displayName} (${INSTALL_FOLDER}/ refreshed, shared config merged, root instructions preserved).`));
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
    
    // Check if configuration file exists
    const configExists = fs.existsSync(configPath);
    let config = null;
    if (configExists) {
        try {
            config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            
            // Auto-sync harness state if mismatched
            const harnessExists = fs.existsSync(path.join(projectDir, 'docs', 'HARNESS.md')) ||
                                  fs.existsSync(path.join(projectDir, 'scripts', 'bin', 'harness-cli'));
            if (config && config.harness && config.harness.enabled !== harnessExists) {
                config.harness.enabled = harnessExists;
                config.harness.source = harnessExists ? 'repository-harness' : 'standalone';
                fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
                console.log(chalk.gray('ℹ️ Automatically synchronized harness configuration state in .ai-kit.json.'));
            }
        } catch (e) {
            // Ignore parse errors, config remains null
        }
    }

    // Determine target and installDir
    const installedTarget = detectInstalledTarget(projectDir);
    let installDirName = INSTALL_FOLDER;
    if (config && config.paths && config.paths.installDir) {
        installDirName = config.paths.installDir;
    }
    const installDir = path.join(projectDir, installDirName);
    const installDirExists = fs.existsSync(installDir);

    console.log(chalk.blueBright('\n📊 Kit Installation Status\n'));

    if (!installedTarget && !configExists && !installDirExists) {
        console.log(chalk.red('❌ No target installed in this directory.'));
        const validTargets = Object.keys(TARGET_REGISTRY).join(', ');
        console.log(chalk.yellow(`💡 Run ${chalk.cyan('hieund-ai-kit init --target <name>')} (targets: ${validTargets}).\n`));
        return;
    }

    // Detect corruption/mismatches
    let statusText = 'INSTALLED';
    let isCorrupted = false;
    let isUnconfigured = false;

    if (configExists && !installDirExists) {
        statusText = 'CORRUPTED (Install folder missing)';
        isCorrupted = true;
    } else if (!configExists && installDirExists) {
        statusText = 'UNCONFIGURED (Config file missing)';
        isUnconfigured = true;
    }

    const activeTarget = installedTarget || (config && config.target) || 'unknown';
    const targetConfig = TARGET_REGISTRY[activeTarget] || {
        displayName: 'Unknown Target',
        description: 'No registry metadata for this target',
        bannerColor: chalk.redBright,
    };

    console.log(targetConfig.bannerColor(`${targetConfig.displayName}: ${statusText}`));
    console.log(chalk.gray('──────────────────────────────────────────────────────'));
    console.log(`🎯 Target:       ${chalk.cyan(activeTarget)}`);
    console.log(`📝 About:        ${chalk.gray(targetConfig.description)}`);
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
            // Ignore stats errors
        }
    }
    console.log(chalk.gray('──────────────────────────────────────────────────────'));

    if (isCorrupted) {
        console.log(chalk.red('\n❌ Error: The installation is corrupted.'));
        console.log(chalk.yellow(`💡 Run ${chalk.cyan('hieund-ai-kit repair')} to fix the missing or mismatched files.\n`));
    } else if (isUnconfigured) {
        console.log(chalk.yellow('\n⚠️  Warning: The installation is unconfigured.'));
        console.log(chalk.yellow(`💡 Run ${chalk.cyan('hieund-ai-kit update')} to automatically generate the configuration file.\n`));
    } else {
        console.log('');
    }
};

/**
 * Repair the installed target's `.agents/` folder and config.
 */
const repairCommand = async (options) => {
    const projectDir = path.resolve(options.path || process.cwd());
    const configPath = path.join(projectDir, CONFIG_FILE);

    if (!fs.existsSync(configPath)) {
        // Check if we can fall back to detectInstalledTarget
        const detected = detectInstalledTarget(projectDir);
        if (!detected) {
            console.error(chalk.red('❌ No configuration file found and no installed target detected.'));
            console.log(chalk.yellow(`💡 Run ${chalk.cyan('hieund-ai-kit init')} to install a new kit.`));
            process.exit(1);
        }
        
        console.log(chalk.yellow('⚠️  Configuration file missing. Re-creating config and repairing...'));
        // Re-create the configuration file first
        const harnessExists = fs.existsSync(path.join(projectDir, 'docs', 'HARNESS.md')) ||
                              fs.existsSync(path.join(projectDir, 'scripts', 'bin', 'harness-cli'));
        const configContent = {
            target: detected,
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
        
        // Auto-sync harness state
        const harnessExists = fs.existsSync(path.join(projectDir, 'docs', 'HARNESS.md')) ||
                              fs.existsSync(path.join(projectDir, 'scripts', 'bin', 'harness-cli'));
        if (config && config.harness && config.harness.enabled !== harnessExists) {
            config.harness.enabled = harnessExists;
            config.harness.source = harnessExists ? 'repository-harness' : 'standalone';
            fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
        }
    } catch (e) {
        console.error(chalk.red(`❌ Failed to parse config file: ${e.message}`));
        process.exit(1);
    }

    const targetName = config.target;
    const installDirName = config.paths?.installDir || INSTALL_FOLDER;
    const ref = config.ref || 'main';

    if (!TARGET_REGISTRY[targetName]) {
        console.error(chalk.red(`❌ Unknown target in configuration: "${targetName}"`));
        process.exit(1);
    }

    const targetConfig = TARGET_REGISTRY[targetName];
    showBanner(targetConfig);

    const spinner = ora({ text: `Downloading clean template for ${targetName}@${ref}...`, color: 'cyan' }).start();

    let templatePath = null;
    try {
        templatePath = await downloadTarget(targetConfig, ref);
        spinner.stop();

        // Restore target files (mirrorCopy with overwriteRootInstruction = false so we don't destroy user modifications in project root files)
        mirrorCopy(templatePath, projectDir, { overwriteRootInstruction: false });
        
        cleanup(templatePath);

        // Update installedAt timestamp in config
        config.installedAt = new Date().toISOString();
        fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

        console.log(chalk.green(`\n✅ Successfully repaired ${targetConfig.displayName}!`));
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
    .description('Install a target kit and integrations (default: codex)')
    .option('-t, --target <name>', 'Target to install (codex, gemini)')
    .option('-f, --force', 'Overwrite existing files without confirmation', false)
    .option('-p, --path <dir>', 'Path to the project directory', process.cwd())
    .option('-b, --branch <name>', 'Select repository branch')
    .option('-r, --ref <ref>', 'Pin to a repository ref (tag, commit, or branch); overrides --branch')
    .option('-g, --gemini', '[deprecated] alias for --target gemini', false)
    .action(initCommand);

program
    .command('update')
    .description('Refresh the installed target runtime and integrations')
    .option('-t, --target <name>', 'Target to update (defaults to installed target)')
    .option('-p, --path <dir>', 'Path to the project directory', process.cwd())
    .option('-b, --branch <name>', 'Select repository branch')
    .option('-r, --ref <ref>', 'Pin to a repository ref (tag, commit, or branch); overrides --branch')
    .option('-g, --gemini', '[deprecated] alias for --target gemini', false)
    .action(updateCommand);

program
    .command('status')
    .description('Check installation status')
    .option('-p, --path <dir>', 'Path to the project directory', process.cwd())
    .action(statusCommand);

program
    .command('repair')
    .description('Restore missing or corrupted files of the installed target')
    .option('-p, --path <dir>', 'Path to the project directory', process.cwd())
    .action(repairCommand);

if (isDirectCliInvocation()) {
    program.parse(process.argv);

    if (!process.argv.slice(2).length) {
        program.outputHelp();
    }
}

export { cleanupOldTarget, detectInstalledTarget, mirrorCopy, removeKitCodexHooks };
