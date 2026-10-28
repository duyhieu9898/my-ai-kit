import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { detectHarness, installIntegrations } from '../lib/integrations.js';
import { loadRegistry } from '../lib/registry.js';
import { makeKit, makeProject, writeTemplateFile } from './helpers.js';

const KIT_BLOCK = '<!-- KIT:BEGIN -->\nkit rules\n<!-- KIT:END -->\n';
const CODEX_HOOKS = { hooks: { PreToolUse: [{ hooks: [{ type: 'command', command: 'python3 .codex/hooks/codex_adapter.py pre-tool' }] }] } };
const GEMINI_HOOKS = { 'hieund-ai-kit-harness-guard': { PreToolUse: [] } };

/** A template whose Codex and Gemini configs look like the real ones, and a shared `scripts/` folder. */
const makeAgentKit = () => {
    const kit = makeKit({
        shared: { files: [{ src: 'scripts/', dest: '.agents/scripts/' }] },
        agents: {
            codex: {
                instruction: { src: 'instructions/AGENTS.md', dest: 'AGENTS.md' },
                hooks: { src: 'hooks/codex.json', dest: '.codex/hooks.json' },
                files: [{ src: 'hooks/guard.py', dest: '.codex/hooks/guard.py' }],
            },
            gemini: {
                instruction: { src: 'instructions/GEMINI.md', dest: 'GEMINI.md' },
                hooks: { src: 'hooks/gemini.json', dest: '.agents/hooks.json' },
                files: [
                    { src: 'hooks/guard.py', dest: '.agents/gemini/hooks/guard.py' },
                    { src: 'rules/', dest: '.agents/rules/' },
                ],
            },
        },
    });
    writeTemplateFile(kit.templateDir, 'instructions/AGENTS.md', KIT_BLOCK);
    writeTemplateFile(kit.templateDir, 'instructions/GEMINI.md', KIT_BLOCK);
    writeTemplateFile(kit.templateDir, 'hooks/codex.json', JSON.stringify(CODEX_HOOKS));
    writeTemplateFile(kit.templateDir, 'hooks/gemini.json', JSON.stringify(GEMINI_HOOKS));
    writeTemplateFile(kit.templateDir, 'hooks/guard.py', 'guard\n');
    writeTemplateFile(kit.templateDir, 'rules/kit.md', 'kit rule\n');
    writeTemplateFile(kit.templateDir, 'scripts/checklist.py', 'v1\n');
    return kit;
};

const install = (templateDir, projectDir, options) =>
    installIntegrations(loadRegistry(templateDir), projectDir, { agents: ['codex', 'gemini'], managedFiles: {}, ...options });

const exists = (projectDir, relPath) => fs.existsSync(path.join(projectDir, relPath));
const read = (projectDir, relPath) => fs.readFileSync(path.join(projectDir, relPath), 'utf8');

test('installIntegrations installs only the selected agents plus shared files', () => {
    const { templateDir } = makeAgentKit();
    const projectDir = makeProject();

    const { managedFiles, warnings } = install(templateDir, projectDir, { agents: ['codex'] });

    assert.equal(read(projectDir, 'AGENTS.md'), KIT_BLOCK);
    assert.deepEqual(JSON.parse(read(projectDir, '.codex/hooks.json')), CODEX_HOOKS);
    assert.deepEqual(Object.keys(managedFiles).sort(), ['.agents/scripts/checklist.py', '.codex/hooks/guard.py']);
    for (const relPath of ['GEMINI.md', '.agents/hooks.json', '.agents/gemini', '.agents/rules']) {
        assert.equal(exists(projectDir, relPath), false, relPath);
    }
    assert.deepEqual(warnings, []);
});

test('installIntegrations adds an agent without touching the others', () => {
    const { templateDir } = makeAgentKit();
    const projectDir = makeProject();
    const first = install(templateDir, projectDir, { agents: ['codex'] });
    fs.writeFileSync(path.join(projectDir, 'AGENTS.md'), `# Mine\n\n${KIT_BLOCK}`);

    const { managedFiles } = install(templateDir, projectDir, {
        agents: ['codex', 'gemini'], previousAgents: ['codex'], managedFiles: first.managedFiles,
    });

    assert.equal(read(projectDir, 'AGENTS.md'), `# Mine\n\n${KIT_BLOCK}`);
    assert.equal(read(projectDir, '.agents/rules/kit.md'), 'kit rule\n');
    assert.ok(managedFiles['.agents/gemini/hooks/guard.py']);
    assert.ok(managedFiles['.codex/hooks/guard.py']);
});

test('installIntegrations removes a dropped agent and keeps what the project owns', () => {
    const { templateDir } = makeAgentKit();
    const projectDir = makeProject();
    fs.writeFileSync(path.join(projectDir, 'AGENTS.md'), '# Project notes\n');
    fs.mkdirSync(path.join(projectDir, '.codex'));
    fs.writeFileSync(path.join(projectDir, '.codex', 'hooks.json'), JSON.stringify({
        hooks: { PostToolUse: [{ hooks: [{ type: 'command', command: 'mine.sh' }] }] },
    }));
    const first = install(templateDir, projectDir);
    fs.mkdirSync(path.join(projectDir, '.agents', 'rules'), { recursive: true });
    fs.writeFileSync(path.join(projectDir, '.agents', 'rules', 'mine.md'), 'mine\n');

    const { managedFiles, warnings } = install(templateDir, projectDir, {
        agents: ['gemini'], previousAgents: ['codex', 'gemini'], managedFiles: first.managedFiles,
    });

    assert.equal(read(projectDir, 'AGENTS.md'), '# Project notes\n');
    assert.deepEqual(JSON.parse(read(projectDir, '.codex/hooks.json')), {
        hooks: { PostToolUse: [{ hooks: [{ type: 'command', command: 'mine.sh' }] }] },
    });
    assert.equal(exists(projectDir, '.codex/hooks'), false);
    assert.equal(managedFiles['.codex/hooks/guard.py'], undefined);
    assert.equal(read(projectDir, '.agents/rules/mine.md'), 'mine\n');
    assert.deepEqual(warnings, []);

    const second = install(templateDir, projectDir, {
        agents: ['codex'], previousAgents: ['gemini'], managedFiles,
    });
    assert.equal(exists(projectDir, 'GEMINI.md'), false);
    assert.equal(exists(projectDir, '.agents/hooks.json'), false);
    assert.equal(exists(projectDir, '.agents/gemini'), false);
    assert.equal(exists(projectDir, '.agents/rules/kit.md'), false);
    assert.equal(read(projectDir, '.agents/rules/mine.md'), 'mine\n');
    assert.deepEqual(second.warnings, []);
});

test('installIntegrations keeps a locally modified file of a dropped agent', () => {
    const { templateDir } = makeAgentKit();
    const projectDir = makeProject();
    const first = install(templateDir, projectDir);
    fs.writeFileSync(path.join(projectDir, '.agents', 'rules', 'kit.md'), 'edited\n');

    const { managedFiles, warnings } = install(templateDir, projectDir, {
        agents: ['codex'], previousAgents: ['codex', 'gemini'], managedFiles: first.managedFiles,
    });

    assert.equal(read(projectDir, '.agents/rules/kit.md'), 'edited\n');
    assert.equal(managedFiles['.agents/rules/kit.md'], undefined);
    assert.deepEqual(warnings, ['Left locally modified ".agents/rules/kit.md" in place; the kit no longer installs it']);
});

test('installIntegrations never deletes a managed file outside the project', () => {
    const { templateDir } = makeAgentKit();
    const projectDir = makeProject();
    const outside = writeTemplateFile(makeProject(), 'victim.txt', 'keep\n');
    fs.symlinkSync(path.dirname(outside), path.join(projectDir, 'link'));
    const managedFiles = { '../victim.txt': 'x', [outside]: 'x', 'link/victim.txt': 'x' };

    const { warnings } = install(templateDir, projectDir, { agents: ['codex'], managedFiles, force: true });

    assert.equal(fs.readFileSync(outside, 'utf8'), 'keep\n');
    assert.equal(warnings.filter((w) => w.includes('points outside the project')).length, 3);
});

test('installIntegrations skips Python bytecode in folder mappings', () => {
    const { templateDir } = makeAgentKit();
    writeTemplateFile(templateDir, 'scripts/__pycache__/checklist.pyc', 'x');
    const projectDir = makeProject();
    const { managedFiles } = install(templateDir, projectDir, { agents: ['codex'] });
    assert.equal(managedFiles['.agents/scripts/__pycache__/checklist.pyc'], undefined);
    assert.equal(exists(projectDir, '.agents/scripts/__pycache__'), false);
});

const SCRIPT = '.agents/scripts/checklist.py';

const setupSharedScript = (templateText, projectText) => {
    const { templateDir } = makeAgentKit();
    writeTemplateFile(templateDir, 'scripts/checklist.py', templateText);
    const projectDir = makeProject();
    if (projectText !== undefined) writeTemplateFile(projectDir, SCRIPT, projectText);
    const run = (options) => install(templateDir, projectDir, { agents: ['codex'], ...options });
    return { templateDir, projectDir, run };
};

test('installIntegrations updates a shared file left as the kit installed it', () => {
    const { templateDir, projectDir, run } = setupSharedScript('v1\n');
    const { managedFiles } = run();
    assert.match(managedFiles[SCRIPT], /^sha256:[0-9a-f]{64}$/);
    writeTemplateFile(templateDir, 'scripts/checklist.py', 'v2\n');

    const result = run({ managedFiles });

    assert.equal(read(projectDir, SCRIPT), 'v2\n');
    assert.notEqual(result.managedFiles[SCRIPT], managedFiles[SCRIPT]);
    assert.deepEqual(result.warnings, []);
});

test('installIntegrations keeps a locally modified shared file unless forced', () => {
    const { templateDir, projectDir, run } = setupSharedScript('v1\n');
    const { managedFiles } = run();
    fs.writeFileSync(path.join(projectDir, SCRIPT), 'mine\n');
    writeTemplateFile(templateDir, 'scripts/checklist.py', 'v2\n');

    const kept = run({ managedFiles });
    assert.equal(read(projectDir, SCRIPT), 'mine\n');
    assert.equal(kept.managedFiles[SCRIPT], managedFiles[SCRIPT]);
    assert.deepEqual(kept.warnings, [`Kept locally modified shared file "${SCRIPT}" (use --force to overwrite)`]);

    run({ managedFiles: kept.managedFiles, force: true });
    assert.equal(read(projectDir, SCRIPT), 'v2\n');
});

test('installIntegrations adopts existing files when no hashes were recorded', () => {
    const { projectDir, run } = setupSharedScript('v2\n', 'stale v1\n');
    const { managedFiles, warnings } = run({ managedFiles: null });
    assert.equal(read(projectDir, SCRIPT), 'v2\n');
    assert.ok(managedFiles[SCRIPT]);
    assert.deepEqual(warnings, []);
});

test('installIntegrations adopts unrecorded files while migrating an install without agents', () => {
    const { projectDir, run } = setupSharedScript('v2\n', 'old hook\n');
    writeTemplateFile(projectDir, '.agents/gemini/workflows/old.md', 'old\n');
    const { managedFiles, warnings } = run({ adoptUnrecorded: true });
    assert.equal(read(projectDir, SCRIPT), 'v2\n');
    assert.ok(managedFiles[SCRIPT]);
    assert.equal(exists(projectDir, '.agents/gemini/workflows'), false);
    assert.deepEqual(warnings, []);
});

test('installIntegrations keeps an untracked shared file that differs from the kit', () => {
    const { projectDir, run } = setupSharedScript('v2\n', 'mine\n');
    const { managedFiles, warnings } = run();
    assert.equal(read(projectDir, SCRIPT), 'mine\n');
    assert.equal(managedFiles[SCRIPT], undefined);
    assert.equal(warnings.length, 1);
});

test('detectHarness reports standalone when no harness files exist', () => {
    assert.deepEqual(detectHarness(makeProject()), { enabled: false, source: 'standalone' });
});

for (const [agent, relPath] of [
    ['codex', '.codex/hooks.json'],
    ['claude', '.claude/settings.json'],
    ['gemini', '.agents/hooks.json'],
]) {
    test(`installIntegrations reports malformed project ${agent} hooks with their path`, () => {
        const { templateDir } = makeKit({ agents: { [agent]: { hooks: { src: `hooks/${agent}.json`, dest: relPath } } } });
        writeTemplateFile(templateDir, `hooks/${agent}.json`, JSON.stringify({ hooks: {} }));
        const projectDir = makeProject();
        writeTemplateFile(projectDir, relPath, '{oops');
        assert.throws(
            () => install(templateDir, projectDir, { agents: [agent] }),
            { name: 'KitError', message: new RegExp(`^Cannot parse ${path.join(projectDir, relPath).replace(/[.]/g, '\\.')}: `) },
        );
    });
}
