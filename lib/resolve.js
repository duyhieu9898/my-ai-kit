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

const unknownProfileMessage = (name, registry) =>
    `Unknown profile "${name}". Available: ${Object.keys(registry.profiles).join(', ') || '(none)'}`;

/** Drops stored names the kit no longer has, so a skill or profile deleted upstream cannot break every run. */
export const pruneSelection = (selection, registry) => {
    const knownSkill = (name) => registry.skills.includes(name);
    const knownProfile = (name) => Object.hasOwn(registry.profiles, name);
    const dropped = [
        ...selection.profiles.filter((name) => !knownProfile(name)),
        ...selection.skills.filter((name) => !knownSkill(name)),
        ...selection.exclude.filter((name) => !knownSkill(name)),
    ];
    return {
        selection: {
            ...selection,
            profiles: selection.profiles.filter(knownProfile),
            skills: selection.skills.filter(knownSkill),
            exclude: selection.exclude.filter(knownSkill),
        },
        dropped: [...new Set(dropped)],
    };
};

export const removeProfilesFromSelection = (selection, profiles, registry) => {
    for (const name of profiles) {
        if (!selection.profiles.includes(name) && !Object.hasOwn(registry.profiles, name)) {
            throw new KitError(unknownProfileMessage(name, registry));
        }
    }
    return { ...selection, profiles: selection.profiles.filter((name) => !profiles.includes(name)) };
};

export const resolveTargetSkills = (selection, registry) => {
    for (const profile of selection.profiles) {
        if (!Object.hasOwn(registry.profiles, profile)) throw new KitError(unknownProfileMessage(profile, registry));
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
