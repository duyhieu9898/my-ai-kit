import assert from 'node:assert/strict';
import test from 'node:test';
import {
    addToSelection, closeMatches, emptySelection, removeFromSelection, resolveTargetSkills,
} from '../lib/resolve.js';

const registry = {
    skills: ['clean-code', 'debugger', 'security-auditor', 'verify-changes'],
    profiles: { starter: ['clean-code', 'debugger'], broken: ['missing-skill'] },
};

test('all selects every skill', () => {
    assert.deepEqual(resolveTargetSkills({ ...emptySelection(), all: true }, registry), registry.skills);
});

test('profiles and skills are unioned, excludes subtracted', () => {
    const selection = { all: false, profiles: ['starter'], skills: ['verify-changes'], exclude: ['debugger'] };
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
    const start = { all: false, profiles: ['starter'], skills: [], exclude: ['debugger'] };
    const next = addToSelection(start, { skills: ['debugger', 'verify-changes'] });
    assert.deepEqual(next, { all: false, profiles: ['starter'], skills: ['debugger', 'verify-changes'], exclude: [] });
});

test('removeFromSelection drops explicit skills and excludes covered ones', () => {
    const start = { all: false, profiles: ['starter'], skills: ['verify-changes'], exclude: [] };
    const next = removeFromSelection(start, ['verify-changes', 'debugger'], registry);
    assert.deepEqual(next, { all: false, profiles: ['starter'], skills: [], exclude: ['debugger'] });
});

test('closeMatches finds typos and substrings', () => {
    assert.deepEqual(closeMatches('security', registry.skills), ['security-auditor']);
});
