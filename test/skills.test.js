import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { hashSkillDir } from '../lib/hash.js';
import { adoptLegacySkills, applySkillPlan, syncClaudeLinks } from '../lib/skills.js';
import { makeKit, makeProject } from './helpers.js';

const setup = () => {
    const kit = makeKit({ skills: ['a', 'b'] });
    const projectDir = makeProject();
    const projectSkillsDir = path.join(projectDir, '.agents', 'skills');
    const apply = (plan, mode = 'copy', managedSkills = {}) =>
        applySkillPlan({ plan, projectSkillsDir, sourceSkillsDir: kit.skillsDir, mode, managedSkills });
    return { kit, projectDir, projectSkillsDir, apply };
};

test('copy mode copies skills, records hashes, skips bytecode', () => {
    const { kit, projectSkillsDir, apply } = setup();
    fs.mkdirSync(path.join(kit.skillsDir, 'a', '__pycache__'));
    const managed = apply([{ name: 'a', action: 'add' }]);
    assert.ok(fs.existsSync(path.join(projectSkillsDir, 'a', 'SKILL.md')));
    assert.ok(!fs.existsSync(path.join(projectSkillsDir, 'a', '__pycache__')));
    assert.equal(managed.a.hash, hashSkillDir(path.join(projectSkillsDir, 'a')));
});

test('link mode creates absolute symlinks without hashes', () => {
    const { kit, projectSkillsDir, apply } = setup();
    const managed = apply([{ name: 'a', action: 'add' }], 'link');
    assert.equal(fs.readlinkSync(path.join(projectSkillsDir, 'a')), path.join(kit.skillsDir, 'a'));
    assert.deepEqual(managed.a, {});
});

test('update replaces a link with a copy', () => {
    const { projectSkillsDir, apply } = setup();
    apply([{ name: 'a', action: 'add' }], 'link');
    apply([{ name: 'a', action: 'update' }], 'copy', { a: {} });
    assert.ok(fs.lstatSync(path.join(projectSkillsDir, 'a')).isDirectory());
});

test('remove deletes the skill and its record; skip-modified keeps both', () => {
    const { projectSkillsDir, apply } = setup();
    const managed = apply([{ name: 'a', action: 'add' }, { name: 'b', action: 'add' }]);
    const next = apply([{ name: 'a', action: 'remove' }, { name: 'b', action: 'skip-modified' }], 'copy', managed);
    assert.ok(!fs.existsSync(path.join(projectSkillsDir, 'a')));
    assert.deepEqual(Object.keys(next), ['b']);
});

test('stale staging directories are removed', () => {
    const { projectSkillsDir, apply } = setup();
    fs.mkdirSync(path.join(projectSkillsDir, '.a.tmp-123-456'), { recursive: true });
    apply([]);
    assert.deepEqual(fs.readdirSync(projectSkillsDir), []);
});

test('conflict items are refused', () => {
    const { apply } = setup();
    assert.throws(() => apply([{ name: 'a', action: 'conflict' }]), { name: 'KitError' });
});

test('syncClaudeLinks links managed skills and removes stale kit links only', () => {
    const { projectDir, apply } = setup();
    apply([{ name: 'a', action: 'add' }]);
    const claudeDir = path.join(projectDir, '.claude', 'skills');
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.symlinkSync('../../.agents/skills/gone', path.join(claudeDir, 'gone'));
    fs.symlinkSync('/elsewhere/other', path.join(claudeDir, 'other'));

    const warnings = syncClaudeLinks({ projectDir, managedNames: ['a'] });

    assert.equal(fs.readlinkSync(path.join(claudeDir, 'a')), '../../.agents/skills/a');
    assert.ok(fs.existsSync(path.join(claudeDir, 'a', 'SKILL.md')));
    assert.equal(fs.lstatSync(path.join(claudeDir, 'gone'), { throwIfNoEntry: false }), undefined);
    assert.equal(fs.readlinkSync(path.join(claudeDir, 'other')), '/elsewhere/other');
    assert.deepEqual(warnings, []);
});

test('syncClaudeLinks leaves a foreign entry with a managed name alone', () => {
    const { projectDir } = setup();
    const claudeDir = path.join(projectDir, '.claude', 'skills');
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.symlinkSync('/elsewhere/a', path.join(claudeDir, 'a'));
    const warnings = syncClaudeLinks({ projectDir, managedNames: ['a'] });
    assert.equal(fs.readlinkSync(path.join(claudeDir, 'a')), '/elsewhere/a');
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /\.claude\/skills\/a/);
});

test('adoptLegacySkills records existing kit-named directories only', () => {
    const { projectSkillsDir } = setup();
    fs.mkdirSync(path.join(projectSkillsDir, 'a'), { recursive: true });
    fs.mkdirSync(path.join(projectSkillsDir, 'mine'), { recursive: true });
    assert.deepEqual(Object.keys(adoptLegacySkills(projectSkillsDir, ['a', 'b'])), ['a']);
});
