import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { hashSkillDir } from '../lib/hash.js';
import { makeKit, writeSkill } from './helpers.js';

test('hash is stable and changes with content', () => {
    const { templateDir } = makeKit();
    const dir = writeSkill(templateDir, 'x');
    const first = hashSkillDir(dir);
    assert.match(first, /^sha256:[0-9a-f]{64}$/);
    assert.equal(hashSkillDir(dir), first);
    fs.appendFileSync(path.join(dir, 'SKILL.md'), 'edit\n');
    assert.notEqual(hashSkillDir(dir), first);
});

test('hash changes when a file is renamed', () => {
    const { templateDir } = makeKit();
    const dir = writeSkill(templateDir, 'x');
    fs.mkdirSync(path.join(dir, 'references'));
    fs.writeFileSync(path.join(dir, 'references', 'a.md'), 'same');
    const before = hashSkillDir(dir);
    fs.renameSync(path.join(dir, 'references', 'a.md'), path.join(dir, 'references', 'b.md'));
    assert.notEqual(hashSkillDir(dir), before);
});

test('running a skill script does not change its hash', () => {
    const { templateDir } = makeKit();
    const dir = writeSkill(templateDir, 'x');
    const before = hashSkillDir(dir);
    fs.mkdirSync(path.join(dir, 'scripts', '__pycache__'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'scripts', '__pycache__', 'a.cpython-312.pyc'), 'bytecode');
    fs.writeFileSync(path.join(dir, 'scripts', 'b.pyc'), 'bytecode');
    assert.equal(hashSkillDir(dir), before);
});
