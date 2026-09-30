import assert from 'node:assert/strict';
import test from 'node:test';
import { frontmatterScalar, lintSkill } from '../scripts/skill-standard.mjs';

const GOOD_DESCRIPTION = [
    'Writes, debugs, and stabilizes Playwright end-to-end tests for web apps.',
    'Use when adding a browser test or fixing a flaky E2E run.',
    'Not for unit tests (use testing-patterns).',
].join(' ');

const GOOD_YAML = [
    'interface:',
    '  display_name: "Web App Testing"',
    '  short_description: "Write and stabilize Playwright E2E tests"',
    '  default_prompt: "Use $webapp-testing to add an E2E test for checkout."',
    '',
].join('\n');

const skillMd = ({ frontmatter = [], description = GOOD_DESCRIPTION, body = '# Web App Testing\n' } = {}) =>
    ['---', 'name: webapp-testing', 'description: >-', `  ${description}`, ...frontmatter, '---', body].join('\n');

const lint = (overrides = {}) => lintSkill({
    name: 'webapp-testing',
    skillMd: skillMd(overrides),
    openAiYaml: GOOD_YAML,
    skillNames: new Set(['webapp-testing', 'testing-patterns']),
    ...overrides.skill,
});

const rules = (findings) => findings.map((finding) => `${finding.level}: ${finding.rule}`);

test('a skill that follows the standard has no findings', () => {
    assert.deepEqual(lint(), []);
});

test('frontmatterScalar folds block scalars into one line', () => {
    assert.equal(frontmatterScalar('description: >-\n  One\n  two.\nname: x', 'description'), 'One two.');
    assert.equal(frontmatterScalar('name: "x"', 'name'), 'x');
});

test('spec violations are errors', () => {
    assert.deepEqual(rules(lintSkill({
        name: 'other', skillMd: skillMd(), openAiYaml: null, skillNames: new Set(),
    })).filter((rule) => rule.startsWith('error')), [
        'error: name differs from folder',
        'error: missing agents/openai.yaml',
    ]);
    assert.deepEqual(rules(lintSkill({ name: 'x', skillMd: 'no frontmatter', openAiYaml: GOOD_YAML, skillNames: new Set() })), [
        'error: missing frontmatter',
    ]);
    assert.ok(rules(lint({ description: 'a'.repeat(1025) })).includes('error: description over 1024 chars'));
});

test('extra frontmatter keys are warned', () => {
    assert.deepEqual(rules(lint({ frontmatter: ['allowed-tools:', '  - Bash'] })), [
        'warn: frontmatter has keys other than name and description',
    ]);
});

test('disable-model-invocation is allowed only with the Codex policy switch', () => {
    const frontmatter = ['disable-model-invocation: true'];
    assert.deepEqual(rules(lint({ frontmatter })), [
        'warn: frontmatter has keys other than name and description',
        'warn: disable-model-invocation without policy.allow_implicit_invocation: false in openai.yaml',
    ]);
    const openAiYaml = `${GOOD_YAML}policy:\n  allow_implicit_invocation: false\n`;
    assert.deepEqual(lint({ frontmatter, skill: { openAiYaml } }), []);
});

test('description rules from the description guide are warned', () => {
    const cases = [
        ['Use for tests. Triggers on test, e2e.', [
            "warn: description lacks 'Use when'",
            "warn: description opens with 'Use' or a persona, not a capability",
            "warn: description has a 'Triggers on' keyword list",
        ]],
        ['Runs tests. Expert in testing. Use when testing.', ['warn: description has persona text']],
        ['Runs tests. Use when testing, NEVER in CI.', ['warn: description uses all-caps emphasis']],
        ['Runs tests. Use when testing. Not for units.', ["warn: 'Not for' does not name a sibling as (use <skill>)"]],
        ['Runs tests. Use when testing. Not for units (use nope).', ["warn: 'Not for' names a missing skill"]],
        ['Runs tests. Use when testing. Not for a (use testing-patterns). Not for b (use testing-patterns).', [
            "warn: description has more than one 'Not for'",
        ]],
        [`Runs tests. Use when testing. ${'x'.repeat(400)}`, ['warn: description over 400 chars']],
    ];
    for (const [description, expected] of cases) {
        assert.deepEqual(rules(lint({ description })), expected, description);
    }
});

test('body length, Claude-only syntax, and stray folders are warned', () => {
    assert.deepEqual(rules(lint({ body: 'line\n'.repeat(201) })), ['warn: body over 200 lines']);
    assert.deepEqual(rules(lint({ body: 'Run with $ARGUMENTS\n' })), ['warn: body uses Claude Code-only syntax']);
    assert.deepEqual(rules(lint({ skill: { strayPaths: ['x/scripts/__pycache__'] } })), ['warn: empty or cache folder']);
});

test('openai.yaml fields follow the Codex conventions', () => {
    const openAiYaml = [
        'interface:',
        '  short_description: "Too short"',
        '  default_prompt: "$webapp-testing"',
        'policy:',
        '  allow_implicit_invocation: true',
    ].join('\n');
    assert.deepEqual(rules(lint({ skill: { openAiYaml } })), [
        'warn: openai.yaml short_description not 25-64 chars',
        'warn: openai.yaml default_prompt is not a sentence mentioning $<name>',
        'warn: openai.yaml restates allow_implicit_invocation: true',
    ]);
});
