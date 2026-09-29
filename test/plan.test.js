import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { hashSkillDir } from '../lib/hash.js';
import { planSkills } from '../lib/plan.js';
import { makeKit, makeProject } from './helpers.js';

const setup = () => {
    const kit = makeKit({ skills: ['a', 'b'] });
    const projectDir = makeProject();
    const projectSkillsDir = path.join(projectDir, '.agents', 'skills');
    fs.mkdirSync(projectSkillsDir, { recursive: true });
    const copyIn = (name) => {
        fs.cpSync(path.join(kit.skillsDir, name), path.join(projectSkillsDir, name), { recursive: true });
        return { hash: hashSkillDir(path.join(projectSkillsDir, name)) };
    };
    const plan = (args) => planSkills({ projectSkillsDir, sourceSkillsDir: kit.skillsDir, mode: 'copy', force: false, ...args });
    return { kit, projectSkillsDir, copyIn, plan };
};

const actions = (items) => Object.fromEntries(items.map((item) => [item.name, item.action]));

test('new skills are added', () => {
    const { plan } = setup();
    assert.deepEqual(actions(plan({ targetSkills: ['a'], managedSkills: {} })), { a: 'add' });
});

test('identical managed skill is unchanged, changed source is update', () => {
    const { kit, copyIn, plan } = setup();
    const managedSkills = { a: copyIn('a'), b: copyIn('b') };
    fs.appendFileSync(path.join(kit.skillsDir, 'b', 'SKILL.md'), 'new\n');
    assert.deepEqual(actions(plan({ targetSkills: ['a', 'b'], managedSkills })), { a: 'unchanged', b: 'update' });
});

test('locally modified managed skill is skipped unless forced', () => {
    const { projectSkillsDir, copyIn, plan } = setup();
    const managedSkills = { a: copyIn('a') };
    fs.appendFileSync(path.join(projectSkillsDir, 'a', 'SKILL.md'), 'local\n');
    assert.deepEqual(actions(plan({ targetSkills: ['a'], managedSkills })), { a: 'skip-modified' });
    assert.deepEqual(actions(plan({ targetSkills: ['a'], managedSkills, force: true })), { a: 'update' });
    assert.deepEqual(actions(plan({ targetSkills: [], managedSkills })), { a: 'skip-modified' });
});

test('deselected managed skill is removed', () => {
    const { copyIn, plan } = setup();
    assert.deepEqual(actions(plan({ targetSkills: [], managedSkills: { a: copyIn('a') } })), { a: 'remove' });
});

test('unmanaged directory with a kit name is a conflict unless forced', () => {
    const { projectSkillsDir, plan } = setup();
    fs.mkdirSync(path.join(projectSkillsDir, 'a'));
    assert.deepEqual(actions(plan({ targetSkills: ['a'], managedSkills: {} })), { a: 'conflict' });
    assert.deepEqual(actions(plan({ targetSkills: ['a'], managedSkills: {}, force: true })), { a: 'update' });
});

test('unmanaged directory that already matches the source is adopted as unchanged', () => {
    const { projectSkillsDir, kit, plan } = setup();
    fs.cpSync(path.join(kit.skillsDir, 'a'), path.join(projectSkillsDir, 'a'), { recursive: true });
    assert.deepEqual(actions(plan({ targetSkills: ['a'], managedSkills: {} })), { a: 'unchanged' });
});

test('project-owned skills outside the target are not planned', () => {
    const { projectSkillsDir, plan } = setup();
    fs.mkdirSync(path.join(projectSkillsDir, 'mine'));
    assert.deepEqual(plan({ targetSkills: ['a'], managedSkills: {} }).map((item) => item.name), ['a']);
});

test('link mode: correct link is unchanged, copied dir is updated', () => {
    const { kit, projectSkillsDir, copyIn, plan } = setup();
    fs.symlinkSync(path.join(kit.skillsDir, 'a'), path.join(projectSkillsDir, 'a'), 'dir');
    const managedSkills = { a: {}, b: copyIn('b') };
    assert.deepEqual(actions(plan({ targetSkills: ['a', 'b'], managedSkills, mode: 'link' })), { a: 'unchanged', b: 'update' });
});

test('modified managed skill that already equals the source converges to unchanged', () => {
    const { kit, projectSkillsDir, copyIn, plan } = setup();
    const managedSkills = { a: copyIn('a') };
    fs.appendFileSync(path.join(projectSkillsDir, 'a', 'SKILL.md'), 'fix\n');
    fs.appendFileSync(path.join(kit.skillsDir, 'a', 'SKILL.md'), 'fix\n');
    assert.deepEqual(actions(plan({ targetSkills: ['a'], managedSkills })), { a: 'unchanged' });
    assert.deepEqual(actions(plan({ targetSkills: [], managedSkills })), { a: 'skip-modified' });
});

test('link mode: a link replaced by an edited directory is skipped unless forced', () => {
    const { kit, projectSkillsDir, plan } = setup();
    fs.cpSync(path.join(kit.skillsDir, 'a'), path.join(projectSkillsDir, 'a'), { recursive: true });
    fs.appendFileSync(path.join(projectSkillsDir, 'a', 'SKILL.md'), 'fork\n');
    const managedSkills = { a: {} };
    assert.deepEqual(actions(plan({ targetSkills: ['a'], managedSkills, mode: 'link' })), { a: 'skip-modified' });
    assert.deepEqual(actions(plan({ targetSkills: [], managedSkills, mode: 'link' })), { a: 'skip-modified' });
    assert.deepEqual(actions(plan({ targetSkills: ['a'], managedSkills, mode: 'link', force: true })), { a: 'update' });
});

test('link mode: a link replaced by an identical directory is updated', () => {
    const { kit, projectSkillsDir, plan } = setup();
    fs.cpSync(path.join(kit.skillsDir, 'a'), path.join(projectSkillsDir, 'a'), { recursive: true });
    assert.deepEqual(actions(plan({ targetSkills: ['a'], managedSkills: { a: {} }, mode: 'link' })), { a: 'update' });
});

test('managed skill that vanished from the source is removed without reading the source', () => {
    const { kit, copyIn, plan } = setup();
    const managedSkills = { a: copyIn('a') };
    fs.rmSync(path.join(kit.skillsDir, 'a'), { recursive: true });
    assert.deepEqual(actions(plan({ targetSkills: [], managedSkills })), { a: 'remove' });
    assert.deepEqual(actions(plan({ targetSkills: [], managedSkills: { a: {} }, mode: 'link' })), { a: 'skip-modified' });
});
