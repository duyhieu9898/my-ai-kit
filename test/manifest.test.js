import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { createManifest, readManifest, writeManifest } from '../lib/manifest.js';
import { makeProject } from './helpers.js';

test('readManifest returns null when absent', () => {
    assert.equal(readManifest(makeProject()), null);
});

test('write then read round-trips', () => {
    const projectDir = makeProject();
    const manifest = createManifest({ source: { type: 'github', ref: 'main' } });
    writeManifest(projectDir, manifest);
    assert.deepEqual(readManifest(projectDir), manifest);
});

test('legacy manifest migrates to select all with unknown managed skills', () => {
    const projectDir = makeProject();
    fs.writeFileSync(path.join(projectDir, '.ai-kit.json'), JSON.stringify({
        version: '2.0.0', ref: 'v2', installedAt: 'x',
        harness: { enabled: false, source: 'standalone' },
        features: { backlog: false, claudeCode: true },
    }));
    const manifest = readManifest(projectDir);
    assert.equal(manifest.formatVersion, 1);
    assert.deepEqual(manifest.source, { type: 'github', ref: 'v2' });
    assert.equal(manifest.selection.all, true);
    assert.equal(manifest.managedSkills, null);
    assert.equal(manifest.features.backlog, false);
});

test('unparseable manifest fails with the file path', () => {
    const projectDir = makeProject();
    fs.writeFileSync(path.join(projectDir, '.ai-kit.json'), '{oops');
    assert.throws(() => readManifest(projectDir), { name: 'KitError', message: /\.ai-kit\.json/ });
});

test('a manifest from a newer CLI asks the user to upgrade', () => {
    const projectDir = makeProject();
    fs.writeFileSync(path.join(projectDir, '.ai-kit.json'), JSON.stringify({ formatVersion: 2, managedSkills: {} }));
    assert.throws(() => readManifest(projectDir), { name: 'KitError', message: /formatVersion 2\b.*Upgrade the CLI/ });
});

test('a formatVersion 1 manifest without managedSkills is rejected', () => {
    const projectDir = makeProject();
    fs.writeFileSync(path.join(projectDir, '.ai-kit.json'), JSON.stringify({ formatVersion: 1 }));
    assert.throws(() => readManifest(projectDir), { name: 'KitError', message: /\.ai-kit\.json is missing managedSkills$/ });
});
