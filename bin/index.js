#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { downloadTemplate } from 'giget';
import path from 'path';
import fs from 'fs';
import os from 'os';
import readline from 'readline';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const REPO = 'github:duyhieu9898/my-ai-kit';
const TEMPLATES_FOLDER = 'templates';
const TEMP_PREFIX = 'hieund-ai-kit-';
const INSTALL_FOLDER = '.agents';
const MARKER_FILE = '.kit-target';
const DEFAULT_TARGET = 'codex';

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
    },
    gemini: {
        displayName: 'Gemini Antigravity Kit',
        bannerColor: chalk.blueBright,
        tagLine: '🚀 Gemini Framework',
        description: 'Multi-agent routing & slash workflows',
        templateDir: 'gemini',
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
 * Detect the installed target by reading the `.agents/.kit-target` marker file.
 * @param {string} projectDir
 * @returns {string|null} target name or null when none is detected
 */
const detectInstalledTarget = (projectDir) => {
    const markerPath = path.join(projectDir, INSTALL_FOLDER, MARKER_FILE);
    if (!fs.existsSync(markerPath)) {
        return null;
    }
    const target = fs.readFileSync(markerPath, 'utf-8').trim();
    return TARGET_REGISTRY[target] ? target : null;
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
 * Mirror-copy a template directory into the project root. The `.agents/`
 * install folder is always replaced; top-level root instruction files honour
 * the overwrite flag.
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

        if (entry.name === INSTALL_FOLDER) {
            // Always replace the install folder wholesale.
            if (fs.existsSync(dest)) {
                fs.rmSync(dest, { recursive: true, force: true });
            }
            fs.cpSync(src, dest, { recursive: true });
        } else if (entry.isFile()) {
            // Root instruction file — respect the overwrite flag.
            if (!overwriteRootInstruction && fs.existsSync(dest)) {
                continue;
            }
            fs.copyFileSync(src, dest);
        } else {
            // Any other top-level directory: mirror it recursively.
            if (fs.existsSync(dest)) {
                fs.rmSync(dest, { recursive: true, force: true });
            }
            fs.cpSync(src, dest, { recursive: true });
        }
    }
};

/**
 * Delete an installed target's root instruction files from the project root.
 * @param {string} oldTemplatePath path to the old target's template directory
 * @param {string} projectDir
 */
const cleanupOldTarget = (oldTemplatePath, projectDir) => {
    const rootFiles = getRootInstructionFiles(oldTemplatePath);
    for (const file of rootFiles) {
        const filePath = path.join(projectDir, file);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(chalk.gray(`  Deleted: ${file}`));
        }
    }
};

/**
 * Download a single target's template subdirectory into a fresh temporary
 * directory (outside the project tree). Returns the path to the temp dir,
 * whose contents are the template files themselves.
 * @param {object} config target configuration
 * @param {string} [branch] optional repository branch
 * @returns {Promise<string>} path to the downloaded template directory
 */
const downloadTarget = async (config, branch) => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), TEMP_PREFIX));
    const subdir = `${TEMPLATES_FOLDER}/${config.templateDir}`;
    const ref = branch ? `#${branch}` : '';
    // giget supports fetching a subdirectory directly: repo/sub/dir#branch
    await downloadTemplate(`${REPO}/${subdir}${ref}`, { dir: tempDir, force: true });
    return tempDir;
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
    try {
        templatePath = await downloadTarget(config, options.branch);
        // On a switch, fetch the old target's template too so we can detect
        // which root instruction files it left behind.
        if (isSwitch) {
            oldTemplatePath = await downloadTarget(TARGET_REGISTRY[installedTarget], options.branch);
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
            cleanupOldTarget(oldTemplatePath, projectDir);
        }

        // Install.
        mirrorCopy(templatePath, projectDir, { overwriteRootInstruction: true });
        cleanup(templatePath);
        cleanup(oldTemplatePath);

        // Success summary.
        console.log(chalk.green(`\n✅ Successfully installed ${config.displayName}!`));
        console.log(chalk.gray('\n──────────────────────────────────────────────────────'));
        console.log(chalk.white('📁 Installed:'));
        console.log(`   ${chalk.cyan(INSTALL_FOLDER + '/')} → ${chalk.gray(installDir)}`);
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
        templatePath = await downloadTarget(config, options.branch);
        spinner.stop();

        mirrorCopy(templatePath, projectDir, { overwriteRootInstruction: false });
        cleanup(templatePath);

        console.log(chalk.green(`\n✅ Updated ${config.displayName} (${INSTALL_FOLDER}/ refreshed, root instructions preserved).`));
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
    const installedTarget = detectInstalledTarget(projectDir);

    console.log(chalk.blueBright('\n📊 Kit Installation Status\n'));

    if (!installedTarget) {
        console.log(chalk.red('❌ No target installed in this directory.'));
        const validTargets = Object.keys(TARGET_REGISTRY).join(', ');
        console.log(chalk.yellow(`💡 Run ${chalk.cyan('hieund-ai-kit init --target <name>')} (targets: ${validTargets}).\n`));
        return;
    }

    const config = TARGET_REGISTRY[installedTarget];
    const installDir = path.join(projectDir, INSTALL_FOLDER);
    const stats = fs.statSync(installDir);
    const files = fs.readdirSync(installDir, { recursive: true });

    console.log(config.bannerColor(`${config.displayName}: INSTALLED`));
    console.log(chalk.gray('──────────────────────────────────────────────────────'));
    console.log(`🎯 Target:   ${chalk.cyan(installedTarget)}`);
    console.log(`📝 About:    ${chalk.gray(config.description)}`);
    console.log(`📁 Path:     ${chalk.cyan(installDir)}`);
    console.log(`📅 Modified: ${chalk.gray(stats.mtime.toLocaleString('en-US'))}`);
    console.log(`📄 Items:    ${chalk.yellow(files.length)} items`);
    console.log(chalk.gray('──────────────────────────────────────────────────────\n'));
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
    .description('Install a target kit into .agents (default: codex)')
    .option('-t, --target <name>', 'Target to install (codex, gemini)')
    .option('-f, --force', 'Overwrite existing files without confirmation', false)
    .option('-p, --path <dir>', 'Path to the project directory', process.cwd())
    .option('-b, --branch <name>', 'Select repository branch')
    .option('-g, --gemini', '[deprecated] alias for --target gemini', false)
    .action(initCommand);

program
    .command('update')
    .description('Refresh .agents for the installed target (auto-detected)')
    .option('-t, --target <name>', 'Target to update (defaults to installed target)')
    .option('-p, --path <dir>', 'Path to the project directory', process.cwd())
    .option('-b, --branch <name>', 'Select repository branch')
    .option('-g, --gemini', '[deprecated] alias for --target gemini', false)
    .action(updateCommand);

program
    .command('status')
    .description('Check installation status')
    .option('-p, --path <dir>', 'Path to the project directory', process.cwd())
    .action(statusCommand);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
}
