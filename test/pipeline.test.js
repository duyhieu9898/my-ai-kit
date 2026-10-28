import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { runPipeline } from '../lib/pipeline.js';
import { hashSkillDir } from '../lib/hash.js';
import { collectStatus } from '../lib/status.js';
import { makeKit, makeProject, writeAgentConfig } from './helpers.js';

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

test('first install without arguments selects all skills for Claude and Codex and links Claude', async () => {
    const { projectDir, run } = setup();
    const { manifest } = await run('install');
    assert.equal(manifest.selection.all, true);
    assert.deepEqual(manifest.selection.agents, ['claude', 'codex']);
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
    assert.equal(manifest.formatVersion, 2);
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

test('rerun converges after a partial failure', async () => {
    const { projectDir, run } = setup();
    fs.mkdirSync(path.join(projectDir, '.claude'), { recursive: true });
    fs.writeFileSync(path.join(projectDir, '.claude', 'skills'), 'x');

    await assert.rejects(run('install'));
    assert.ok(!exists(projectDir, '.ai-kit.json'));

    fs.rmSync(path.join(projectDir, '.claude', 'skills'));
    const { manifest } = await run('install');
    assert.deepEqual(Object.keys(manifest.managedSkills).sort(), ['a', 'b', 'c']);
});

const dropFromKit = (kit, { skills = [], profiles = {} }) => {
    for (const name of skills) fs.rmSync(path.join(kit.skillsDir, name), { recursive: true });
    fs.writeFileSync(path.join(kit.templateDir, 'kit.json'), JSON.stringify({ formatVersion: 2, profiles }));
};

const geminiSetup = () => {
    const kit = makeKit({ skills: ['a', 'b'], geminiSkills: ['g', 'h'], profiles: { p: ['a', 'g'] } });
    const projectDir = makeProject();
    const run = (command, extra = {}) => runPipeline({
        projectDir, command, add: { all: false, profiles: [], skills: [] }, remove: [], ...extra,
        options: { source: kit.root, ...(extra.options ?? {}) },
    });
    return { kit, projectDir, run };
};

const addAgents = (agents, rest = {}) => ({ add: { agents, all: false, profiles: [], skills: [], ...rest } });

test('adding the Gemini agent installs its exclusive skills into .agents/skills without a Claude link', async () => {
    const { projectDir, run } = geminiSetup();
    const first = await run('install');
    assert.deepEqual(Object.keys(first.manifest.managedSkills).sort(), ['a', 'b']);

    const { manifest, plan } = await run('install', addAgents(['gemini']));
    assert.deepEqual(manifest.selection.agents, ['claude', 'codex', 'gemini']);
    assert.deepEqual(Object.keys(manifest.managedSkills).sort(), ['a', 'b', 'g', 'h']);
    assert.deepEqual(manifest.managedSkills.g, { hash: manifest.managedSkills.g.hash, agents: ['gemini'] });
    assert.ok(exists(projectDir, '.agents', 'skills', 'g', 'SKILL.md'));
    assert.ok(!exists(projectDir, '.agent'));
    assert.ok(!exists(projectDir, '.claude', 'skills', 'g'));
    assert.deepEqual(
        plan.filter((item) => item.agents.length).map((item) => [item.name, item.action, item.agents]),
        [['g', 'add', ['gemini']], ['h', 'add', ['gemini']]],
    );
    const status = collectStatus(projectDir);
    assert.ok(status.managed.includes('g (gemini)'));
    assert.deepEqual(status.brokenLinks, []);
    assert.deepEqual(status.projectOwned, []);
});

test('a Gemini-only install links nothing for Claude', async () => {
    const { projectDir, run } = geminiSetup();
    const { manifest } = await run('install', addAgents(['gemini']));
    assert.deepEqual(manifest.selection.agents, ['gemini']);
    assert.deepEqual(Object.keys(manifest.managedSkills).sort(), ['a', 'b', 'g', 'h']);
    assert.ok(!exists(projectDir, '.claude'));
    assert.deepEqual(collectStatus(projectDir).brokenLinks, []);
});

test('an exclusive skill needs its agent, and removing the agent removes the skill', async () => {
    const { projectDir, run } = geminiSetup();
    await run('install', { add: { all: false, profiles: ['p'], skills: [] } });
    await assert.rejects(
        run('install', { add: { all: false, profiles: [], skills: ['h'] } }),
        { name: 'KitError', message: 'Skill "h" is only for gemini: add --agent gemini' },
    );
    await run('install', addAgents(['gemini'], { skills: ['h'] }));
    assert.deepEqual(fs.readdirSync(path.join(projectDir, '.agents', 'skills')).sort(), ['a', 'g', 'h']);

    const { manifest } = await run('remove', { removeAgents: ['gemini'] });
    assert.deepEqual(manifest.selection.agents, ['claude', 'codex']);
    assert.deepEqual(manifest.selection.skills, ['h']);
    assert.deepEqual(fs.readdirSync(path.join(projectDir, '.agents', 'skills')).sort(), ['a']);
});

test('remove --agent claude takes out the kit links and keeps the skills for Codex', async () => {
    const { projectDir, run } = setup();
    await run('install');
    const { manifest } = await run('remove', { removeAgents: ['claude'] });
    assert.deepEqual(manifest.selection.agents, ['codex']);
    assert.deepEqual(Object.keys(manifest.managedSkills).sort(), ['a', 'b', 'c']);
    assert.ok(!exists(projectDir, '.claude'));
    await assert.rejects(run('remove', { removeAgents: ['codex'] }), { name: 'KitError', message: /keep at least one/ });
    await assert.rejects(run('install', addAgents(['cursor'])), { name: 'KitError', message: /Unknown agent "cursor"/ });
});

test('update drops the Claude link of a skill that became exclusive to Gemini', async () => {
    const { kit, projectDir, run } = setup();
    await run('install', addAgents(['claude', 'gemini']));
    writeAgentConfig(kit.templateDir, 'gemini', { exclusiveSkills: ['c'] });

    const { manifest } = await run('update');
    assert.deepEqual(manifest.managedSkills.c.agents, ['gemini']);
    assert.ok(exists(projectDir, '.agents', 'skills', 'c', 'SKILL.md'));
    assert.equal(fs.lstatSync(path.join(projectDir, '.claude', 'skills', 'c'), { throwIfNoEntry: false }), undefined);
    assert.deepEqual(collectStatus(projectDir).brokenLinks, []);
});

test('a project-owned folder conflicts with a Gemini-only skill', async () => {
    const { projectDir, run } = geminiSetup();
    fs.mkdirSync(path.join(projectDir, '.agents', 'skills', 'g'), { recursive: true });
    await assert.rejects(run('install', addAgents(['gemini'])), { name: 'KitError', message: /g \(gemini\).*--force/ });
});

test('update gives an install without agents every agent and moves skills out of .agent/skills', async () => {
    const { kit, projectDir, run } = geminiSetup();
    await run('install');
    const legacyDir = path.join(projectDir, '.agent', 'skills');
    fs.mkdirSync(legacyDir, { recursive: true });
    fs.cpSync(path.join(kit.skillsDir, 'g'), path.join(legacyDir, 'g'), { recursive: true });
    fs.cpSync(path.join(kit.skillsDir, 'h'), path.join(legacyDir, 'h'), { recursive: true });
    fs.appendFileSync(path.join(legacyDir, 'h', 'SKILL.md'), 'local edit\n');
    const manifestPath = path.join(projectDir, '.ai-kit.json');
    const stored = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    delete stored.selection.agents;
    stored.managedGeminiSkills = { g: { hash: hashSkillDir(path.join(kit.skillsDir, 'g')) }, h: { hash: 'before-edit' } };
    fs.writeFileSync(manifestPath, JSON.stringify(stored));

    const { manifest, warnings } = await run('update');
    assert.deepEqual(manifest.selection.agents, ['claude', 'codex', 'gemini']);
    assert.ok(!('managedGeminiSkills' in manifest));
    assert.ok(!('legacyAgents' in JSON.parse(fs.readFileSync(manifestPath, 'utf8'))));
    assert.ok(exists(projectDir, '.agents', 'skills', 'g', 'SKILL.md'));
    assert.ok(exists(projectDir, '.agents', 'skills', 'h', 'SKILL.md'));
    assert.deepEqual(fs.readdirSync(legacyDir), ['h']);
    assert.deepEqual(warnings, [`Left locally modified ${path.join('.agent', 'skills', 'h')} in place; the kit now installs it in ${path.join('.agents', 'skills')}`]);
});

test('update drops skills and profiles that vanished from the kit, with a warning', async () => {
    const { kit, projectDir, run } = setup();
    await run('install', { add: { all: false, profiles: ['p'], skills: ['c'] } });
    await run('remove', { remove: ['b'] });
    dropFromKit(kit, { skills: ['b', 'c'] });

    const { manifest, warnings } = await run('update');

    assert.deepEqual(manifest.selection, { agents: ['claude', 'codex'], all: false, profiles: [], skills: [], exclude: [] });
    assert.deepEqual(warnings.sort(), [
        'Dropped "b" from the selection: it no longer exists in the kit',
        'Dropped "c" from the selection: it no longer exists in the kit',
        'Dropped "p" from the selection: it no longer exists in the kit',
    ]);
    assert.ok(!exists(projectDir, '.agents', 'skills', 'c'));
    assert.equal(fs.lstatSync(path.join(projectDir, '.claude', 'skills', 'c'), { throwIfNoEntry: false }), undefined);
    assert.deepEqual(Object.keys(manifest.managedSkills), []);
});

test('install still rejects unknown names given on the command line', async () => {
    const { kit, run } = setup();
    await run('install', { add: { all: false, profiles: [], skills: ['c'] } });
    dropFromKit(kit, { skills: ['c'], profiles: { p: ['a', 'b'] } });
    await assert.rejects(run('install', { add: { all: false, profiles: [], skills: ['c'] } }), { name: 'KitError', message: /Unknown skill "c"/ });
    await assert.rejects(run('install', { add: { all: false, profiles: ['q'], skills: [] } }), { name: 'KitError', message: /Unknown profile "q"/ });
    const { warnings } = await run('install', { add: { all: false, profiles: [], skills: ['a'] } });
    assert.deepEqual(warnings, ['Dropped "c" from the selection: it no longer exists in the kit']);
});

test('remove accepts a skill that vanished from the kit', async () => {
    const { kit, projectDir, run } = setup();
    await run('install');
    dropFromKit(kit, { skills: ['c'], profiles: { p: ['a', 'b'] } });
    const { manifest, warnings } = await run('remove', { remove: ['c'] });
    assert.deepEqual(Object.keys(manifest.managedSkills).sort(), ['a', 'b']);
    assert.deepEqual(warnings, []);
    assert.ok(!exists(projectDir, '.agents', 'skills', 'c'));
});

test('remove --profile drops profiles from the selection', async () => {
    const { projectDir, run } = setup();
    await run('install', { add: { all: false, profiles: ['p'], skills: ['c'] } });
    const { manifest } = await run('remove', { removeProfiles: ['p'] });
    assert.deepEqual(manifest.selection.profiles, []);
    assert.deepEqual(Object.keys(manifest.managedSkills), ['c']);
    assert.ok(!exists(projectDir, '.agents', 'skills', 'a'));
    await assert.rejects(run('remove', { removeProfiles: ['nope'] }), { name: 'KitError', message: /Unknown profile "nope"/ });
});

test('status of a legacy install lists no project-owned skills', () => {
    const projectDir = makeProject();
    fs.writeFileSync(path.join(projectDir, '.ai-kit.json'), JSON.stringify({ version: '2.0.0', ref: 'main' }));
    fs.mkdirSync(path.join(projectDir, '.agents', 'skills', 'a'), { recursive: true });
    const status = collectStatus(projectDir);
    assert.equal(status.legacy, true);
    assert.deepEqual(status.projectOwned, []);
});
