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
import { installIntegrations, detectHarness } from '../lib/integrations.js';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const REPO = 'github:duyhieu9898/my-ai-kit';
const TEMPLATES_FOLDER = 'templates';
const TEMP_PREFIX = 'hieund-ai-kit-';
const INSTALL_FOLDER = '.agents';
const CLAUDE_CONFIG_FOLDER = '.claude';
const CONFIG_FILE = '.ai-kit.json';

const BANNER_COLOR = chalk.magentaBright;
const BANNER_RUNTIME_LINE = 'Codex + Gemini + Claude Code';

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Display the installer banner.
 */
const showBanner = () => {
    const runtimeLine = `  Runtimes: ${BANNER_RUNTIME_LINE.padEnd(40)}  `;
    const formatLine = `  Format:   ${'Unified AI Kit'.padEnd(40)}  `;
    console.log(BANNER_COLOR([
        '    ╔══════════════════════════════════════════════════════╗',
        '    ║             ⚡ HIEUND AI KIT CLI ⚡                  ║',
        '    ╠══════════════════════════════════════════════════════╣',
        `    ║${runtimeLine}║`,
        `    ║${formatLine}║`,
        '    ╚══════════════════════════════════════════════════════╝'
    ].join('\n')));
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
 * Initialize the AI Kit in the project. Installs all runtimes side-by-side.
 */
const initCommand = async (options) => {
    const projectDir = path.resolve(options.path || process.cwd());
    showBanner();

    const spinner = ora({ text: 'Downloading templates from repository...', color: 'cyan' }).start();

    let templatePath = null;
    const ref = resolveRef(options);
    try {
        templatePath = await downloadTemplates(ref);
        spinner.stop();

        const collidingRootFiles = ['AGENTS.md', 'GEMINI.md', 'CLAUDE.md'].filter((f) => fs.existsSync(path.join(projectDir, f)));
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

        installIntegrations(templatePath, projectDir);
        const srcSkills = path.join(templatePath, INSTALL_FOLDER, 'skills');
        if (fs.existsSync(srcSkills)) {
            fs.cpSync(srcSkills, path.join(projectDir, INSTALL_FOLDER, 'skills'), { recursive: true, force: true });
        }

        cleanup(templatePath);

        const harness = detectHarness(projectDir);

        const configContent = {
            version: '2.0.0',
            ref: ref || 'main',
            installedAt: new Date().toISOString(),
            paths: {
                installDir: INSTALL_FOLDER,
            },
            harness,
            features: {
                backlog: true,
                guardHooks: true,
                claudeCode: true,
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
        console.log(`   ${chalk.cyan('CLAUDE.md')} → ${chalk.gray(path.join(projectDir, 'CLAUDE.md'))}`);
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

        installIntegrations(templatePath, projectDir);
        const srcSkills = path.join(templatePath, INSTALL_FOLDER, 'skills');
        if (fs.existsSync(srcSkills)) {
            fs.cpSync(srcSkills, path.join(projectDir, INSTALL_FOLDER, 'skills'), { recursive: true, force: true });
        }

        cleanup(templatePath);

        const harness = detectHarness(projectDir);

        const updatedConfig = {
            version: '2.0.0',
            ref: ref,
            installedAt: new Date().toISOString(),
            paths: {
                installDir: existingConfig.paths?.installDir || INSTALL_FOLDER,
            },
            harness,
            features: {
                backlog: existingConfig.features?.backlog !== undefined ? existingConfig.features.backlog : true,
                guardHooks: existingConfig.features?.guardHooks !== undefined ? existingConfig.features.guardHooks : true,
                claudeCode: existingConfig.features?.claudeCode !== undefined ? existingConfig.features.claudeCode : true,
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

            const harness = detectHarness(projectDir);
            if (config && config.harness && config.harness.enabled !== harness.enabled) {
                config.harness.enabled = harness.enabled;
                config.harness.source = harness.source;

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
    const claudeExists = fs.existsSync(path.join(installDir, 'claude')) &&
                         fs.existsSync(path.join(projectDir, CLAUDE_CONFIG_FOLDER, 'settings.json')) &&
                         fs.existsSync(path.join(projectDir, 'CLAUDE.md'));

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
    } else if (configExists && installDirExists && (!codexExists || !geminiExists || !claudeExists)) {
        statusText = 'CORRUPTED (Missing Codex, Gemini, or Claude runtime)';
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
        const harness = detectHarness(projectDir);
        const configContent = {
            version: '2.0.0',
            ref: 'main',
            installedAt: new Date().toISOString(),
            paths: {
                installDir: INSTALL_FOLDER,
            },
            harness,
            features: {
                backlog: true,
                guardHooks: true,
                claudeCode: true,
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

        installIntegrations(templatePath, projectDir);
        const srcSkills = path.join(templatePath, INSTALL_FOLDER, 'skills');
        if (fs.existsSync(srcSkills)) {
            fs.cpSync(srcSkills, path.join(projectDir, INSTALL_FOLDER, 'skills'), { recursive: true, force: true });
        }

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
    .description('Install the AI Kit runtimes and integrations (Codex, Gemini, and Claude Code)')
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
