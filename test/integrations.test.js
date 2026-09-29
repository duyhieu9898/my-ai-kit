import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { detectHarness, installIntegrations } from '../lib/integrations.js';
import { makeKit, makeProject } from './helpers.js';

test('installIntegrations copies Codex hook scripts and top-level toolkit files', () => {
    const { templateDir } = makeKit();
    fs.mkdirSync(path.join(templateDir, '.codex', 'hooks'), { recursive: true });
    fs.writeFileSync(path.join(templateDir, '.codex', 'hooks', 'codex_adapter.py'), 'print(1)\n');
    fs.writeFileSync(path.join(templateDir, '.codex', 'hooks.json'), JSON.stringify({ hooks: {} }));
    fs.writeFileSync(path.join(templateDir, '.agents', 'ARCHITECTURE.md'), '# arch\n');
    const projectDir = makeProject();

    installIntegrations(templateDir, projectDir);

    assert.equal(fs.readFileSync(path.join(projectDir, '.codex', 'hooks', 'codex_adapter.py'), 'utf8'), 'print(1)\n');
    assert.equal(fs.readFileSync(path.join(projectDir, '.agents', 'ARCHITECTURE.md'), 'utf8'), '# arch\n');
});

test('installIntegrations tolerates a template without integration files', () => {
    const { templateDir } = makeKit();
    const projectDir = makeProject();
    assert.doesNotThrow(() => installIntegrations(templateDir, projectDir));
});

test('detectHarness reports standalone when no harness files exist', () => {
    assert.deepEqual(detectHarness(makeProject()), { enabled: false, source: 'standalone' });
});
