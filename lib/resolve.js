import { KitError } from './errors.js';

const union = (a, b) => [...new Set([...a, ...b])];

export const emptySelection = () => ({ all: false, profiles: [], skills: [], exclude: [] });

const editDistance = (a, b) => {
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        let previous = row[0];
        row[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const current = row[j];
            row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
            previous = current;
        }
    }
    return row[b.length];
};

export const closeMatches = (name, candidates) =>
    candidates
        .filter((candidate) => candidate.includes(name) || name.includes(candidate) || editDistance(candidate, name) <= 2)
        .slice(0, 3);

export const unknownSkillsMessage = (names, candidates) =>
    names.map((name) => {
        const matches = closeMatches(name, candidates);
        return `Unknown skill "${name}"${matches.length ? ` (did you mean: ${matches.join(', ')}?)` : ''}`;
    }).join('\n');

const coveredSkills = (selection, registry) => {
    const covered = new Set(selection.all ? registry.skills : []);
    for (const profile of selection.profiles) {
        for (const skill of registry.profiles[profile] ?? []) covered.add(skill);
    }
    return covered;
};

export const addToSelection = (selection, { all = false, profiles = [], skills = [] }) => ({
    all: selection.all || all,
    profiles: union(selection.profiles, profiles),
    skills: union(selection.skills, skills),
    exclude: selection.exclude.filter((skill) => !skills.includes(skill)),
});

export const removeFromSelection = (selection, names, registry) => {
    const covered = coveredSkills(selection, registry);
    return {
        ...selection,
        skills: selection.skills.filter((skill) => !names.includes(skill)),
        exclude: union(selection.exclude, names.filter((name) => covered.has(name))),
    };
};

export const resolveTargetSkills = (selection, registry) => {
    const available = Object.keys(registry.profiles);
    for (const profile of selection.profiles) {
        if (!registry.profiles[profile]) {
            throw new KitError(`Unknown profile "${profile}". Available: ${available.join(', ') || '(none)'}`);
        }
    }

    const wanted = coveredSkills(selection, registry);
    for (const skill of selection.skills) wanted.add(skill);

    const known = new Set(registry.skills);
    const unknown = [...wanted].filter((skill) => !known.has(skill));
    if (unknown.length) {
        throw new KitError(unknownSkillsMessage(unknown, registry.skills));
    }

    for (const skill of selection.exclude) wanted.delete(skill);
    return [...wanted].sort();
};
