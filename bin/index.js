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

const REPO = 'github:duyhieu9898/my-ai-kit';
const TEMPLATES_FOLDER = 'templates';
const TEMP_FOLDER = '.temp_ag_kit';

/**
 * Get active folder configuration
 * @param {boolean} isGemini - True if requesting Gemini/Antigravity format
 */
const getFolderConfig = (isGemini) => {
    if (isGemini) {
        return {
            name: 'Gemini Antigravity Kit',
            sourceFolder: '.antigravity',
            installFolder: '.agents',
            rootInstruction: {
                source: 'rules/GEMINI.md',
                target: 'GEMINI.md',
            },
            bannerColor: chalk.blueBright,
            tag: '🚀 Gemini Framework',
            desc: 'Multi-agent routing & slash workflows'
        };
    } else {
        return {
            name: 'OpenAI Codex Kit',
            sourceFolder: '.codex',
            installFolder: '.agents',
            rootInstruction: {
                source: 'AGENTS.md',
                target: 'AGENTS.md',
            },
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
    ║             ⚡ HIEUND AI KIT CLI ⚡                  ║
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
 * @param {object} config - Active folder configuration
 */
const copyTemplateFolder = (tempDir, destDir, config) => {
    const sourcePath = path.join(tempDir, TEMPLATES_FOLDER, config.sourceFolder);

    if (!fs.existsSync(sourcePath)) {
        throw new Error(`Could not find templates/${config.sourceFolder} folder in source repository!`);
    }

    if (fs.existsSync(destDir)) {
        fs.rmSync(destDir, { recursive: true, force: true });
    }

    fs.cpSync(sourcePath, destDir, { recursive: true });
};

/**
 * Copy the root instruction file used by the target agent runtime.
 * @param {string} tempDir - Temp directory
 * @param {string} targetDir - Target project directory
 * @param {object} config - Active folder configuration
 * @param {boolean} force - Whether to overwrite an existing root instruction
 * @returns {"copied"|"overwritten"|"skipped"|"none"}
 */
const copyRootInstruction = (tempDir, targetDir, config, force) => {
    if (!config.rootInstruction) {
        return 'none';
    }

    const sourcePath = path.join(tempDir, TEMPLATES_FOLDER, config.sourceFolder, config.rootInstruction.source);
    const destPath = path.join(targetDir, config.rootInstruction.target);

    if (!fs.existsSync(sourcePath)) {
        return 'none';
    }

    const existedBefore = fs.existsSync(destPath);

    if (existedBefore && !force) {
        return 'skipped';
    }

    fs.copyFileSync(sourcePath, destPath);
    return existedBefore ? 'overwritten' : 'copied';
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
    const isGemini = !!options.gemini;
    const config = getFolderConfig(isGemini);
    showBanner(config);

    const targetDir = path.resolve(options.path || process.cwd());
    const tempDir = path.join(targetDir, TEMP_FOLDER);
    const destDir = path.join(targetDir, config.installFolder);

    // Check if folder already exists
    if (fs.existsSync(destDir)) {
        if (!options.force) {
            console.log(chalk.yellow(`⚠️  Folder ${chalk.cyan(config.installFolder)} already exists at: ${destDir}`));
            const shouldOverwrite = await confirm('Do you want to overwrite it?');

            if (!shouldOverwrite) {
                console.log(chalk.gray('Operation cancelled.'));
                process.exit(0);
            }
        }
        console.log(chalk.gray(`Overwriting ${chalk.cyan(config.installFolder)} folder...`));
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

        // Copy selected template source into the runtime .agents folder.
        copyTemplateFolder(tempDir, destDir, config);
        const rootInstructionStatus = copyRootInstruction(tempDir, targetDir, config, !!options.force);

        // Update .gitignore
        const gitignoreUpdated = updateGitignore(targetDir, config.installFolder);

        // Cleanup
        cleanup(tempDir);

        spinner.succeed(chalk.green(`Successfully installed ${config.name}!`));

        // Success message
        console.log(chalk.gray('\n──────────────────────────────────────────────────────'));
        console.log(chalk.white('📁 Installed Location:'));
        console.log(`   ${chalk.cyan(config.installFolder)} → ${chalk.gray(destDir)}`);
        if (rootInstructionStatus === 'copied' || rootInstructionStatus === 'overwritten') {
            console.log(`   ${chalk.cyan(config.rootInstruction.target)} → ${chalk.gray(path.join(targetDir, config.rootInstruction.target))}`);
        } else if (rootInstructionStatus === 'skipped') {
            console.log(`   ${chalk.yellow(config.rootInstruction.target)} → Existing file kept (use --force to overwrite)`);
        }
        if (gitignoreUpdated) {
            console.log(`   ${chalk.cyan('.gitignore')} → Added ignore entry: ${chalk.yellow(config.installFolder)}`);
        }
        console.log(chalk.gray('──────────────────────────────────────────────────────'));
        
        if (!isGemini) {
            console.log(chalk.magentaBright(`\n✨ OpenAI Codex mode enabled.`));
            console.log(chalk.gray(`💡 Tip: Natural language commands will automatically load skills!`));
            console.log(chalk.gray(`   Run tests via: ${chalk.cyan('python3 .agents/scripts/verify_all.py .')}\n`));
        } else {
            console.log(chalk.blueBright(`\n🚀 Gemini Antigravity mode enabled.`));
            console.log(chalk.gray(`💡 Tip: Run slash commands like /plan or /brainstorm in chat.`));
            console.log(chalk.gray(`   Run tests via: ${chalk.cyan('python3 .agents/scripts/verify_all.py .')}\n`));
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
    const isGemini = !!options.gemini;
    const config = getFolderConfig(isGemini);
    showBanner(config);

    const targetDir = path.resolve(options.path || process.cwd());
    const destDir = path.join(targetDir, config.installFolder);

    // Check if folder exists
    if (!fs.existsSync(destDir)) {
        console.log(chalk.red(`❌ Could not find active ${chalk.cyan(config.installFolder)} folder at: ${targetDir}`));
        console.log(chalk.yellow(`💡 Tip: Run ${chalk.cyan('hieund-ai-kit init' + (isGemini ? ' --gemini' : ''))} to install first.`));
        process.exit(1);
    }

    if (!options.force) {
        console.log(chalk.yellow(`⚠️  Update will overwrite the entire ${chalk.cyan(config.installFolder)} folder.`));
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
    
    const agentsDir = path.join(targetDir, '.agents');
    const oldCodexDir = path.join(targetDir, '.codex');
    const oldAgentDir = path.join(targetDir, '.agent');

    console.log(chalk.blueBright('\n📊 Kit Installation Status\n'));

    let found = false;

    // Check current runtime folder (.agents)
    if (fs.existsSync(agentsDir)) {
        found = true;
        const stats = fs.statSync(agentsDir);
        const files = fs.readdirSync(agentsDir, { recursive: true });
        const isAntigravity = fs.existsSync(path.join(agentsDir, 'agents')) || fs.existsSync(path.join(agentsDir, 'workflows'));
        const label = isAntigravity ? 'Gemini Antigravity Kit' : 'OpenAI Codex Kit';
        const itemLabel = isAntigravity ? 'agents, workflows & skills' : 'composable skills';
        
        console.log(chalk.magentaBright(`${label}: INSTALLED`));
        console.log(chalk.gray('──────────────────────────────────────────────────────'));
        console.log(`📁 Path:     ${chalk.cyan(agentsDir)}`);
        console.log(`📅 Modified: ${chalk.gray(stats.mtime.toLocaleString('en-US'))}`);
        console.log(`📄 Items:    ${chalk.yellow(files.length)} items (${itemLabel})`);
        console.log(chalk.gray('──────────────────────────────────────────────────────\n'));
    }

    // Check obsolete folders from older kit versions.
    if (fs.existsSync(oldCodexDir) || fs.existsSync(oldAgentDir)) {
        found = true;
        console.log(chalk.yellow('Old kit folders detected:'));
        if (fs.existsSync(oldCodexDir)) {
            console.log(`   ${chalk.cyan(oldCodexDir)} (old Codex install path)`);
        }
        if (fs.existsSync(oldAgentDir)) {
            console.log(`   ${chalk.cyan(oldAgentDir)} (old Gemini/Antigravity install path)`);
        }
        console.log(chalk.gray(`   Current installs use ${chalk.cyan('.agents')}.\n`));
    }

    if (!found) {
        console.log(chalk.red('❌ No active kits installed in this directory.'));
        console.log(chalk.yellow(`💡 Run ${chalk.cyan('hieund-ai-kit init')} to install Codex into .agents.`));
        console.log(chalk.yellow(`💡 Run ${chalk.cyan('hieund-ai-kit init --gemini')} to install Gemini Antigravity into .agents.\n`));
    }
};

// ============================================================================
// CLI DEFINITION
// ============================================================================

const program = new Command();

program
    .name('hieund-ai-kit')
    .description('Custom CLI tool to install and manage Hieund AI and Codex Kits')
    .version('1.0.0', '-v, --version', 'Display version number');

// Command: init
program
    .command('init')
    .description('Install Codex or Gemini Antigravity kit into .agents')
    .option('-f, --force', 'Overwrite if folder already exists', false)
    .option('-p, --path <dir>', 'Path to the project directory', process.cwd())
    .option('-b, --branch <name>', 'Select repository branch')
    .option('-g, --gemini', 'Install Gemini Antigravity format instead of Codex', false)
    .action(initCommand);

// Command: update
program
    .command('update')
    .description('Update active folder to the latest version')
    .option('-f, --force', 'Skip confirmation prompt', false)
    .option('-p, --path <dir>', 'Path to the project directory', process.cwd())
    .option('-b, --branch <name>', 'Select repository branch')
    .option('-g, --gemini', 'Update Gemini Antigravity format in .agents', false)
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
