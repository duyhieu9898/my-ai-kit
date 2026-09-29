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

const SCRIPT = path.join('.agents', 'scripts', 'checklist.py');
const SCRIPT_KEY = '.agents/scripts/checklist.py';

const setupSharedScript = (templateText, projectText) => {
    const { templateDir } = makeKit();
    fs.mkdirSync(path.join(templateDir, '.agents', 'scripts'), { recursive: true });
    fs.writeFileSync(path.join(templateDir, SCRIPT), templateText);
    const projectDir = makeProject();
    if (projectText !== undefined) {
        fs.mkdirSync(path.join(projectDir, '.agents', 'scripts'), { recursive: true });
        fs.writeFileSync(path.join(projectDir, SCRIPT), projectText);
    }
    return { templateDir, projectDir };
};

const readScript = (projectDir) => fs.readFileSync(path.join(projectDir, SCRIPT), 'utf8');

test('installIntegrations records hashes of the shared files it installs', () => {
    const { templateDir, projectDir } = setupSharedScript('v1\n');
    const { managedFiles, warnings } = installIntegrations(templateDir, projectDir, { managedFiles: {} });
    assert.match(managedFiles[SCRIPT_KEY], /^sha256:[0-9a-f]{64}$/);
    assert.deepEqual(warnings, []);
});

test('installIntegrations skips Python bytecode in shared folders', () => {
    const { templateDir, projectDir } = setupSharedScript('v1\n');
    fs.mkdirSync(path.join(templateDir, '.agents', 'scripts', '__pycache__'));
    fs.writeFileSync(path.join(templateDir, '.agents', 'scripts', '__pycache__', 'checklist.pyc'), 'x');
    const { managedFiles } = installIntegrations(templateDir, projectDir, { managedFiles: {} });
    assert.deepEqual(Object.keys(managedFiles), [SCRIPT_KEY]);
    assert.equal(fs.existsSync(path.join(projectDir, '.agents', 'scripts', '__pycache__')), false);
});

test('installIntegrations updates a shared file left as the kit installed it', () => {
    const first = setupSharedScript('v1\n');
    const { managedFiles } = installIntegrations(first.templateDir, first.projectDir, { managedFiles: {} });
    fs.writeFileSync(path.join(first.templateDir, SCRIPT), 'v2\n');

    const result = installIntegrations(first.templateDir, first.projectDir, { managedFiles });

    assert.equal(readScript(first.projectDir), 'v2\n');
    assert.notEqual(result.managedFiles[SCRIPT_KEY], managedFiles[SCRIPT_KEY]);
    assert.deepEqual(result.warnings, []);
});

test('installIntegrations keeps a locally modified shared file unless forced', () => {
    const { templateDir, projectDir } = setupSharedScript('v1\n');
    const { managedFiles } = installIntegrations(templateDir, projectDir, { managedFiles: {} });
    fs.writeFileSync(path.join(projectDir, SCRIPT), 'mine\n');
    fs.writeFileSync(path.join(templateDir, SCRIPT), 'v2\n');

    const kept = installIntegrations(templateDir, projectDir, { managedFiles });
    assert.equal(readScript(projectDir), 'mine\n');
    assert.equal(kept.managedFiles[SCRIPT_KEY], managedFiles[SCRIPT_KEY]);
    assert.deepEqual(kept.warnings, [`Kept locally modified shared file "${SCRIPT_KEY}" (use --force to overwrite)`]);

    installIntegrations(templateDir, projectDir, { managedFiles: kept.managedFiles, force: true });
    assert.equal(readScript(projectDir), 'v2\n');
});

test('installIntegrations adopts existing shared files when no hashes were recorded', () => {
    const { templateDir, projectDir } = setupSharedScript('v2\n', 'stale v1\n');
    const { managedFiles, warnings } = installIntegrations(templateDir, projectDir, { managedFiles: null });
    assert.equal(readScript(projectDir), 'v2\n');
    assert.ok(managedFiles[SCRIPT_KEY]);
    assert.deepEqual(warnings, []);
});

test('installIntegrations keeps an untracked shared file that differs from the kit', () => {
    const { templateDir, projectDir } = setupSharedScript('v2\n', 'mine\n');
    const { managedFiles, warnings } = installIntegrations(templateDir, projectDir, { managedFiles: {} });
    assert.equal(readScript(projectDir), 'mine\n');
    assert.equal(managedFiles[SCRIPT_KEY], undefined);
    assert.equal(warnings.length, 1);
});

test('detectHarness reports standalone when no harness files exist', () => {
    assert.deepEqual(detectHarness(makeProject()), { enabled: false, source: 'standalone' });
});

for (const [label, relPath] of [
    ['Codex hooks', path.join('.codex', 'hooks.json')],
    ['Claude settings', path.join('.claude', 'settings.json')],
    ['Gemini hooks', path.join('.agents', 'hooks.json')],
]) {
    test(`installIntegrations reports malformed project ${label} with its path`, () => {
        const { templateDir } = makeKit();
        fs.mkdirSync(path.dirname(path.join(templateDir, relPath)), { recursive: true });
        fs.writeFileSync(path.join(templateDir, relPath), JSON.stringify({ hooks: {} }));
        const projectDir = makeProject();
        fs.mkdirSync(path.dirname(path.join(projectDir, relPath)), { recursive: true });
        fs.writeFileSync(path.join(projectDir, relPath), '{oops');
        assert.throws(
            () => installIntegrations(templateDir, projectDir),
            { name: 'KitError', message: new RegExp(`^Cannot parse ${path.join(projectDir, relPath).replace(/[.]/g, '\\.')}: `) },
        );
    });
}
