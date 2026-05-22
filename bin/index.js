#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { downloadTemplate } from 'giget';
import path from 'path';
import fs from 'fs';
import readline from 'readline';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const REPO = 'github:duyhieu9898/my-antigravity-kit';
const TEMPLATES_FOLDER = 'templates';
const TEMP_FOLDER = '.temp_ag_kit';

/**
 * Get active folder configuration
 * @param {boolean} isLegacy - True if requesting old Antigravity format
 */
const getFolderConfig = (isLegacy) => {
    if (isLegacy) {
        return {
            name: 'Antigravity Kit',
            folder: '.agent',
            bannerColor: chalk.blueBright,
            tag: '🚀 Legacy Framework',
            desc: 'Multi-agent routing & slash workflows'
        };
    } else {
        return {
            name: 'OpenAI Codex Kit',
            folder: '.codex',
            bannerColor: chalk.magentaBright,
            tag: '✨ Codex Standard (Recommended)',
            desc: 'Unified composable skills & cascading rules'
        };
    }
};

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Display dynamic ASCII banner
 * @param {object} config - Active configuration
 */
const showBanner = (config) => {
    console.log(config.bannerColor(`
    ╔══════════════════════════════════════════════════════╗
    ║             ⚡ HIEUND AG KIT CLI ⚡                  ║
    ╠══════════════════════════════════════════════════════╣
    ║  Target:   %-40s  ║
    ║  Format:   %-40s  ║
    ╚══════════════════════════════════════════════════════╝
    `), 
    config.name, 
    config.tag
    );
};

/**
 * Ask user for confirmation
 * @param {string} question - Question to ask
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
 * Clean up temporary directory
 * @param {string} tempDir - Temp directory path
 */
const cleanup = (tempDir) => {
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
};

/**
 * Copy dynamic folder from temp to destination
 * @param {string} tempDir - Temp directory
 * @param {string} destDir - Destination directory
 * @param {string} folderName - Subfolder to copy (e.g. .codex or .agent)
 */
const copyTemplateFolder = (tempDir, destDir, folderName) => {
    const sourcePath = path.join(tempDir, TEMPLATES_FOLDER, folderName);

    if (!fs.existsSync(sourcePath)) {
        throw new Error(`Could not find templates/${folderName} folder in source repository!`);
    }

    fs.cpSync(sourcePath, destDir, { recursive: true });
};

/**
 * Update .gitignore to include target folder
 * @param {string} targetDir - Target project directory
 * @param {string} folderName - Folder to ignore
 * @returns {boolean} - True if .gitignore was updated
 */
const updateGitignore = (targetDir, folderName) => {
    const gitignorePath = path.join(targetDir, '.gitignore');
    const entryToAdd = folderName;

    // Check if .gitignore exists
    if (fs.existsSync(gitignorePath)) {
        const content = fs.readFileSync(gitignorePath, 'utf-8');
        const lines = content.split(/\r?\n/);

        // Check if entry is already in .gitignore
        const hasEntry = lines.some(line =>
            line.trim() === entryToAdd ||
            line.trim() === `${entryToAdd}/` ||
            line.trim() === `/${entryToAdd}` ||
            line.trim() === `/${entryToAdd}/`
        );

        if (!hasEntry) {
            // Add folder to .gitignore
            const newContent = content.endsWith('\n')
                ? `${content}${entryToAdd}\n`
                : `${content}\n${entryToAdd}\n`;
            fs.writeFileSync(gitignorePath, newContent);
            return true;
        }
    } else {
        // Create new .gitignore
        fs.writeFileSync(gitignorePath, `${entryToAdd}\n`);
        return true;
    }

    return false;
};

// ============================================================================
// COMMANDS
// ============================================================================

/**
 * Initialize selected kit folder in project
 */
const initCommand = async (options) => {
    const config = getFolderConfig(!!options.legacy);
    showBanner(config);

    const targetDir = path.resolve(options.path || process.cwd());
    const tempDir = path.join(targetDir, TEMP_FOLDER);
    const destDir = path.join(targetDir, config.folder);

    // Check if folder already exists
    if (fs.existsSync(destDir)) {
        if (!options.force) {
            console.log(chalk.yellow(`⚠️  Folder ${chalk.cyan(config.folder)} already exists at: ${destDir}`));
            const shouldOverwrite = await confirm('Do you want to overwrite it?');

            if (!shouldOverwrite) {
                console.log(chalk.gray('Operation cancelled.'));
                process.exit(0);
            }
        }
        console.log(chalk.gray(`Overwriting ${chalk.cyan(config.folder)} folder...`));
    }

    const spinner = ora({
        text: 'Downloading templates from repository...',
        color: 'cyan',
    }).start();

    try {
        // Download repository using giget
        const repoSource = options.branch ? `${REPO}#${options.branch}` : REPO;
        await downloadTemplate(repoSource, {
            dir: tempDir,
            force: true,
        });

        spinner.text = 'Installing kit template...';

        // Copy selected folder (.codex or .agent)
        copyTemplateFolder(tempDir, destDir, config.folder);

        // Update .gitignore
        const gitignoreUpdated = updateGitignore(targetDir, config.folder);

        // Cleanup
        cleanup(tempDir);

        spinner.succeed(chalk.green(`Successfully installed ${config.name}!`));

        // Success message
        console.log(chalk.gray('\n──────────────────────────────────────────────────────'));
        console.log(chalk.white('📁 Installed Location:'));
        console.log(`   ${chalk.cyan(config.folder)} → ${chalk.gray(destDir)}`);
        if (gitignoreUpdated) {
            console.log(`   ${chalk.cyan('.gitignore')} → Added ignore entry: ${chalk.yellow(config.folder)}`);
        }
        console.log(chalk.gray('──────────────────────────────────────────────────────'));
        
        if (!options.legacy) {
            console.log(chalk.magentaBright(`\n✨ OpenAI Codex mode enabled.`));
            console.log(chalk.gray(`💡 Tip: Natural language commands will automatically load skills!`));
            console.log(chalk.gray(`   Run tests via: ${chalk.cyan('python .codex/scripts/verify_all.py .')}\n`));
        } else {
            console.log(chalk.blueBright(`\n🚀 Legacy Antigravity mode enabled.`));
            console.log(chalk.gray(`💡 Tip: Run slash commands like /plan or /brainstorm in chat.`));
            console.log(chalk.gray(`   Run tests via: ${chalk.cyan('python .agent/scripts/verify_all.py .')}\n`));
        }
        
    } catch (error) {
        spinner.fail(chalk.red(`❌ Error: ${error.message}`));
        cleanup(tempDir);
        process.exit(1);
    }
};

/**
 * Update existing kit folder
 */
const updateCommand = async (options) => {
    const config = getFolderConfig(!!options.legacy);
    showBanner(config);

    const targetDir = path.resolve(options.path || process.cwd());
    const destDir = path.join(targetDir, config.folder);

    // Check if folder exists
    if (!fs.existsSync(destDir)) {
        console.log(chalk.red(`❌ Could not find active ${chalk.cyan(config.folder)} folder at: ${targetDir}`));
        console.log(chalk.yellow(`💡 Tip: Run ${chalk.cyan('hieund-ag-kit init' + (options.legacy ? ' --legacy' : ''))} to install first.`));
        process.exit(1);
    }

    if (!options.force) {
        console.log(chalk.yellow(`⚠️  Update will overwrite the entire ${chalk.cyan(config.folder)} folder.`));
        const shouldUpdate = await confirm('Are you sure you want to continue?');

        if (!shouldUpdate) {
            console.log(chalk.gray('Operation cancelled.'));
            process.exit(0);
        }
    }

    // Call init with force option
    await initCommand({ ...options, force: true });
};

/**
 * Show status of installed folders
 */
const statusCommand = (options) => {
    const targetDir = path.resolve(options.path || process.cwd());
    
    const codexDir = path.join(targetDir, '.codex');
    const agentDir = path.join(targetDir, '.agent');

    console.log(chalk.blueBright('\n📊 Kit Installation Status\n'));

    let found = false;

    // Check OpenAI Codex (.codex)
    if (fs.existsSync(codexDir)) {
        found = true;
        const stats = fs.statSync(codexDir);
        const files = fs.readdirSync(codexDir, { recursive: true });
        
        console.log(chalk.magentaBright('✨ OpenAI Codex Standard Kit: INSTALLED'));
        console.log(chalk.gray('──────────────────────────────────────────────────────'));
        console.log(`📁 Path:     ${chalk.cyan(codexDir)}`);
        console.log(`📅 Modified: ${chalk.gray(stats.mtime.toLocaleString('en-US'))}`);
        console.log(`📄 Items:    ${chalk.yellow(files.length)} items (unified skills)`);
        console.log(chalk.gray('──────────────────────────────────────────────────────\n'));
    }

    // Check Antigravity (.agent)
    if (fs.existsSync(agentDir)) {
        found = true;
        const stats = fs.statSync(agentDir);
        const files = fs.readdirSync(agentDir, { recursive: true });

        console.log(chalk.blueBright('🚀 Legacy Antigravity Kit: INSTALLED'));
        console.log(chalk.gray('──────────────────────────────────────────────────────'));
        console.log(`📁 Path:     ${chalk.cyan(agentDir)}`);
        console.log(`📅 Modified: ${chalk.gray(stats.mtime.toLocaleString('en-US'))}`);
        console.log(`📄 Items:    ${chalk.yellow(files.length)} items (workflows & agents)`);
        console.log(chalk.gray('──────────────────────────────────────────────────────\n'));
    }

    if (!found) {
        console.log(chalk.red('❌ No active kits installed in this directory.'));
        console.log(chalk.yellow(`💡 Run ${chalk.cyan('hieund-ag-kit init')} to install Codex (Recommended).`));
        console.log(chalk.yellow(`💡 Run ${chalk.cyan('hieund-ag-kit init --legacy')} to install legacy Antigravity.\n`));
    }
};

// ============================================================================
// CLI DEFINITION
// ============================================================================

const program = new Command();

program
    .name('hieund-ag-kit')
    .description('Custom CLI tool to install and manage Hieund AG and Codex Kits')
    .version('1.0.0', '-v, --version', 'Display version number');

// Command: init
program
    .command('init')
    .description('Install .codex or .agent folder into your project')
    .option('-f, --force', 'Overwrite if folder already exists', false)
    .option('-p, --path <dir>', 'Path to the project directory', process.cwd())
    .option('-b, --branch <name>', 'Select repository branch')
    .option('-l, --legacy', 'Install legacy Antigravity (.agent) format instead of Codex', false)
    .action(initCommand);

// Command: update
program
    .command('update')
    .description('Update active folder to the latest version')
    .option('-f, --force', 'Skip confirmation prompt', false)
    .option('-p, --path <dir>', 'Path to the project directory', process.cwd())
    .option('-b, --branch <name>', 'Select repository branch')
    .option('-l, --legacy', 'Update legacy Antigravity (.agent) folder', false)
    .action(updateCommand);

// Command: status
program
    .command('status')
    .description('Check installation status')
    .option('-p, --path <dir>', 'Path to the project directory', process.cwd())
    .action(statusCommand);

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
    program.outputHelp();
}