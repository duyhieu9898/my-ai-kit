import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { loadRegistry } from '../lib/registry.js';
import { makeKit, writeAgentConfig } from './helpers.js';

test('loadRegistry lists skill directories and profiles', () => {
    const { templateDir, skillsDir } = makeKit({ skills: ['b-skill', 'a-skill'], profiles: { starter: ['a-skill'] } });
    fs.mkdirSync(path.join(skillsDir, '.a-skill.tmp-1-2'));
    const registry = loadRegistry(templateDir);
    assert.deepEqual(registry.skills, ['a-skill', 'b-skill']);
    assert.deepEqual(registry.profiles, { starter: ['a-skill'] });
    assert.equal(registry.sourcePathOf('a-skill'), path.join(skillsDir, 'a-skill'));
});

test('loadRegistry loads agent configs apart from shared.json and knows exclusive skills', () => {
    const { templateDir } = makeKit({ skills: ['a', 'b'], geminiSkills: ['g'] });
    const registry = loadRegistry(templateDir);
    assert.deepEqual(registry.skills, ['a', 'b', 'g']);
    assert.deepEqual(registry.agentNames, ['claude', 'codex', 'gemini']);
    assert.deepEqual(registry.shared.files, []);
    assert.deepEqual(registry.exclusiveOwners('g'), ['gemini']);
    assert.deepEqual(registry.exclusiveOwners('a'), []);
});

test('loadRegistry rejects an exclusive skill the kit does not ship', () => {
    const { templateDir } = makeKit({ skills: ['a'] });
    writeAgentConfig(templateDir, 'gemini', { exclusiveSkills: ['gone'] });
    assert.throws(() => loadRegistry(templateDir), { name: 'KitError', message: /unknown exclusive skills: gone/ });
});

test('loadRegistry rejects a file mapping whose source is missing or escapes the project', () => {
    const { templateDir } = makeKit();
    writeAgentConfig(templateDir, 'codex', { files: [{ src: 'hooks/missing.py', dest: '.codex/hooks/missing.py' }] });
    assert.throws(() => loadRegistry(templateDir), { name: 'KitError', message: /hooks\/missing\.py does not exist/ });
    writeAgentConfig(templateDir, 'codex', { files: [{ src: 'kit.json', dest: '../outside.json' }] });
    assert.throws(() => loadRegistry(templateDir), { name: 'KitError', message: /must be relative paths/ });
});

test('loadRegistry rejects a template without agents/shared.json', () => {
    const { templateDir } = makeKit();
    fs.rmSync(path.join(templateDir, 'agents', 'shared.json'));
    assert.throws(() => loadRegistry(templateDir), { name: 'KitError', message: /missing .*shared\.json/ });
});

test('loadRegistry rejects a directory without kit.json', () => {
    const { templateDir } = makeKit();
    fs.rmSync(path.join(templateDir, 'kit.json'));
    assert.throws(() => loadRegistry(templateDir), { name: 'KitError', message: /missing .*kit\.json/ });
});

test('loadRegistry rejects a newer formatVersion', () => {
    const { templateDir } = makeKit({ formatVersion: 3 });
    assert.throws(() => loadRegistry(templateDir), { name: 'KitError', message: /formatVersion 3 .*Upgrade/ });
});

test('loadRegistry reports a malformed kit.json with its path', () => {
    const { templateDir } = makeKit();
    fs.writeFileSync(path.join(templateDir, 'kit.json'), '{oops');
    assert.throws(() => loadRegistry(templateDir), { name: 'KitError', message: /^Cannot parse .*kit\.json: / });
});
