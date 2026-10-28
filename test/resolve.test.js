import assert from 'node:assert/strict';
import test from 'node:test';
import {
    addToSelection, assertSkillsAllowed, closeMatches, emptySelection, pruneSelection, removeAgentsFromSelection,
    removeFromSelection, resolveTargetSkills,
} from '../lib/resolve.js';

const registry = {
    skills: ['clean-code', 'debugger', 'security-auditor', 'verify-changes'],
    profiles: { starter: ['clean-code', 'debugger'], broken: ['missing-skill'] },
    agentNames: ['claude', 'codex', 'gemini'],
    exclusiveOwners: () => [],
};

test('all selects every skill', () => {
    assert.deepEqual(resolveTargetSkills({ ...emptySelection(), all: true }, registry), registry.skills);
});

test('profiles and skills are unioned, excludes subtracted', () => {
    const selection = { agents: [], all: false, profiles: ['starter'], skills: ['verify-changes'], exclude: ['debugger'] };
    assert.deepEqual(resolveTargetSkills(selection, registry), ['clean-code', 'verify-changes']);
});

test('unknown profile fails with available profiles', () => {
    assert.throws(
        () => resolveTargetSkills({ ...emptySelection(), profiles: ['nope'] }, registry),
        { name: 'KitError', message: /Unknown profile "nope".*starter/ },
    );
});

test('unknown skill fails with close matches', () => {
    assert.throws(
        () => resolveTargetSkills({ ...emptySelection(), skills: ['debuger'] }, registry),
        { name: 'KitError', message: /Unknown skill "debuger" \(did you mean: debugger\?\)/ },
    );
});

test('a profile naming a missing skill fails', () => {
    assert.throws(
        () => resolveTargetSkills({ ...emptySelection(), profiles: ['broken'] }, registry),
        { name: 'KitError', message: /missing-skill/ },
    );
});

test('addToSelection merges and re-includes explicitly added skills', () => {
    const start = { agents: ['claude'], all: false, profiles: ['starter'], skills: [], exclude: ['debugger'] };
    const next = addToSelection(start, { agents: ['gemini', 'claude'], skills: ['debugger', 'verify-changes'] });
    assert.deepEqual(next, {
        agents: ['claude', 'gemini'], all: false, profiles: ['starter'], skills: ['debugger', 'verify-changes'], exclude: [],
    });
});

test('removeFromSelection drops explicit skills and excludes covered ones', () => {
    const start = { agents: [], all: false, profiles: ['starter'], skills: ['verify-changes'], exclude: [] };
    const next = removeFromSelection(start, ['verify-changes', 'debugger'], registry);
    assert.deepEqual(next, { agents: [], all: false, profiles: ['starter'], skills: [], exclude: ['debugger'] });
});

const mixed = {
    skills: ['debugger', 'security-auditor'],
    profiles: { core: ['debugger', 'security-auditor'] },
    agentNames: ['claude', 'codex', 'gemini'],
    exclusiveOwners: (name) => (name === 'debugger' ? ['gemini'] : []),
};
const withAgents = (agents, rest) => ({ ...emptySelection(), agents, ...rest });

test('a skill exclusive to an agent installs only while that agent is selected', () => {
    for (const rest of [{ all: true }, { profiles: ['core'] }, { skills: ['debugger', 'security-auditor'] }]) {
        assert.deepEqual(resolveTargetSkills(withAgents(['claude', 'codex'], rest), mixed), ['security-auditor']);
        assert.deepEqual(resolveTargetSkills(withAgents(['codex', 'gemini'], rest), mixed), ['debugger', 'security-auditor']);
    }
});

test('naming an exclusive skill without its agent fails with the flag to add', () => {
    assert.throws(
        () => assertSkillsAllowed(withAgents(['claude']), mixed, ['debugger']),
        { name: 'KitError', message: 'Skill "debugger" is only for gemini: add --agent gemini' },
    );
    assert.doesNotThrow(() => assertSkillsAllowed(withAgents(['gemini']), mixed, ['debugger', 'unknown']));
});

test('removeAgentsFromSelection checks names and keeps at least one agent', () => {
    const start = withAgents(['claude', 'gemini']);
    assert.deepEqual(removeAgentsFromSelection(start, ['gemini'], mixed).agents, ['claude']);
    assert.throws(() => removeAgentsFromSelection(start, ['cursor'], mixed), { message: /Unknown agent "cursor".*claude, codex, gemini/ });
    assert.throws(() => removeAgentsFromSelection(start, ['codex'], mixed), { message: /Not installed: codex/ });
    assert.throws(() => removeAgentsFromSelection(start, ['claude', 'gemini'], mixed), { message: /keep at least one/ });
});

test('pruneSelection drops agents the kit no longer ships', () => {
    const { selection, dropped } = pruneSelection(withAgents(['claude', 'cursor']), mixed);
    assert.deepEqual(selection.agents, ['claude']);
    assert.deepEqual(dropped, ['cursor']);
});

test('closeMatches finds typos and substrings', () => {
    assert.deepEqual(closeMatches('security', registry.skills), ['security-auditor']);
});
