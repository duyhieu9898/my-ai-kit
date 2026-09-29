import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { runPipeline } from '../lib/pipeline.js';
import { collectStatus } from '../lib/status.js';
import { makeKit, makeProject } from './helpers.js';

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

test('first install without arguments selects all and links Claude', async () => {
    const { projectDir, run } = setup();
    const { manifest } = await run('install');
    assert.equal(manifest.selection.all, true);
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
    assert.equal(manifest.formatVersion, 1);
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
