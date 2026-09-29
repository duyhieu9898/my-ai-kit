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
