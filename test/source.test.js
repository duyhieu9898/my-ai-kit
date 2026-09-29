import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fetchTemplates, resolveSource, sourceMode } from '../lib/source.js';
import { makeKit, makeProject } from './helpers.js';

const localManifest = { source: { type: 'local', path: '/kit', mode: 'link' } };

test('flags override the manifest, manifest overrides the default', () => {
    assert.deepEqual(resolveSource({ options: {}, manifest: null }), { type: 'github', ref: 'main' });
    assert.deepEqual(resolveSource({ options: {}, manifest: localManifest }), localManifest.source);
    assert.deepEqual(resolveSource({ options: { ref: 'v3' }, manifest: localManifest }), { type: 'github', ref: 'v3' });
    assert.deepEqual(
        resolveSource({ options: { source: 'kit' }, manifest: localManifest }),
        { type: 'local', path: path.resolve('kit'), mode: 'copy' },
    );
});

test('--link requires --source', () => {
    assert.throws(() => resolveSource({ options: { link: true }, manifest: null }), { name: 'KitError', message: /--link requires --source/ });
});

test('sourceMode is copy for GitHub', () => {
    assert.equal(sourceMode({ type: 'github', ref: 'main' }), 'copy');
    assert.equal(sourceMode(localManifest.source), 'link');
});

test('local source resolves its templates directory', async () => {
    const kit = makeKit();
    const { templateDir, cleanup } = await fetchTemplates({ type: 'local', path: kit.root, mode: 'copy' });
    assert.equal(templateDir, kit.templateDir);
    cleanup();
});

test('a moved checkout fails with recovery hints', async () => {
    await assert.rejects(
        fetchTemplates({ type: 'local', path: makeProject(), mode: 'link' }),
        { name: 'KitError', message: /--source <new path>.*--ref main/ },
    );
});
