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
    assert.equal(manifest.formatVersion, 2);
    assert.deepEqual(manifest.source, { type: 'github', ref: 'v2' });
    assert.equal(manifest.selection.all, true);
    assert.equal(manifest.managedSkills, null);
    assert.deepEqual(manifest.selection.agents, ['claude', 'codex', 'gemini']);
    assert.equal(manifest.legacyAgents, true);
    assert.equal(manifest.managedFiles, null);
    assert.equal(manifest.features.backlog, false);
});

test('a formatVersion 1 manifest without managedFiles asks to adopt shared files', () => {
    const projectDir = makeProject();
    fs.writeFileSync(path.join(projectDir, '.ai-kit.json'), JSON.stringify({ formatVersion: 1, managedSkills: {} }));
    assert.equal(readManifest(projectDir).managedFiles, null);
});

test('a manifest without agents gets every agent and asks to adopt their files', () => {
    const projectDir = makeProject();
    fs.writeFileSync(path.join(projectDir, '.ai-kit.json'), JSON.stringify({
        formatVersion: 1, selection: { all: true, gemini: false, profiles: [], skills: [], exclude: [] }, managedSkills: { a: {} },
    }));
    const manifest = readManifest(projectDir);
    assert.equal(manifest.formatVersion, 2);
    assert.deepEqual(manifest.managedSkills, { a: {} });
    assert.deepEqual(manifest.selection, { agents: ['claude', 'codex', 'gemini'], all: true, profiles: [], skills: [], exclude: [] });
    assert.equal(manifest.legacyAgents, true);
    writeManifest(projectDir, manifest);
    assert.equal(JSON.parse(fs.readFileSync(path.join(projectDir, '.ai-kit.json'), 'utf8')).legacyAgents, undefined);
});

test('a pre-release 5.0 manifest keeps .agent/skills records for cleanup and marks Gemini-only skills', () => {
    const projectDir = makeProject();
    fs.writeFileSync(path.join(projectDir, '.ai-kit.json'), JSON.stringify({
        formatVersion: 2, selection: { all: true, profiles: [], skills: [], exclude: [] },
        managedSkills: { a: {}, d: { hash: 'h', scope: 'gemini' } }, managedGeminiSkills: { g: { hash: 'x' } },
    }));
    const manifest = readManifest(projectDir);
    assert.deepEqual(manifest.managedSkills, { a: {}, d: { hash: 'h', agents: ['gemini'] } });
    assert.deepEqual(manifest.managedGeminiSkills, { g: { hash: 'x' } });
});

test('a manifest with agents keeps them', () => {
    const projectDir = makeProject();
    fs.writeFileSync(path.join(projectDir, '.ai-kit.json'), JSON.stringify({
        formatVersion: 2, selection: { agents: ['codex'], all: true, profiles: [], skills: [], exclude: [] }, managedSkills: {},
    }));
    const manifest = readManifest(projectDir);
    assert.deepEqual(manifest.selection.agents, ['codex']);
    assert.equal(manifest.legacyAgents, undefined);
});

test('unparseable manifest fails with the file path', () => {
    const projectDir = makeProject();
    fs.writeFileSync(path.join(projectDir, '.ai-kit.json'), '{oops');
    assert.throws(() => readManifest(projectDir), { name: 'KitError', message: /\.ai-kit\.json/ });
});

test('a manifest from a newer CLI asks the user to upgrade', () => {
    const projectDir = makeProject();
    fs.writeFileSync(path.join(projectDir, '.ai-kit.json'), JSON.stringify({ formatVersion: 3, managedSkills: {} }));
    assert.throws(() => readManifest(projectDir), { name: 'KitError', message: /formatVersion 3\b.*Upgrade the CLI/ });
});

test('a formatVersion 1 manifest without managedSkills is rejected', () => {
    const projectDir = makeProject();
    fs.writeFileSync(path.join(projectDir, '.ai-kit.json'), JSON.stringify({ formatVersion: 1 }));
    assert.throws(() => readManifest(projectDir), { name: 'KitError', message: /\.ai-kit\.json is missing managedSkills$/ });
});
