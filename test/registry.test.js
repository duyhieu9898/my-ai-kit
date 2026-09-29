import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { loadRegistry } from '../lib/registry.js';
import { makeKit } from './helpers.js';

test('loadRegistry lists skill directories and profiles', () => {
    const { templateDir } = makeKit({ skills: ['b-skill', 'a-skill'], profiles: { starter: ['a-skill'] } });
    fs.mkdirSync(path.join(templateDir, '.agents', 'skills', '.a-skill.tmp-1-2'));
    const registry = loadRegistry(templateDir);
    assert.deepEqual(registry.skills, ['a-skill', 'b-skill']);
    assert.deepEqual(registry.profiles, { starter: ['a-skill'] });
    assert.ok(path.isAbsolute(registry.skillsDir));
});

test('loadRegistry rejects a directory without kit.json', () => {
    const { templateDir } = makeKit();
    fs.rmSync(path.join(templateDir, 'kit.json'));
    assert.throws(() => loadRegistry(templateDir), { name: 'KitError', message: /missing .*kit\.json/ });
});

test('loadRegistry rejects a newer formatVersion', () => {
    const { templateDir } = makeKit({ formatVersion: 2 });
    assert.throws(() => loadRegistry(templateDir), { name: 'KitError', message: /formatVersion 2 .*Upgrade/ });
});

test('loadRegistry reports a malformed kit.json with its path', () => {
    const { templateDir } = makeKit();
    fs.writeFileSync(path.join(templateDir, 'kit.json'), '{oops');
    assert.throws(() => loadRegistry(templateDir), { name: 'KitError', message: /^Cannot parse .*kit\.json: / });
});
