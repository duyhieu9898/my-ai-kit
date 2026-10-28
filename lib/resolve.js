import { KitError } from './errors.js';

const union = (a, b) => [...new Set([...a, ...b])];

/** A fresh install without `--agent` sets up Claude Code and Codex; Gemini is opt-in. */
export const DEFAULT_AGENTS = ['claude', 'codex'];

export const emptySelection = () => ({ agents: [], all: false, profiles: [], skills: [], exclude: [] });

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

/** A skill exclusive to some agents installs only while one of them is selected. */
export const isSkillAllowed = (selection, registry, skill) => {
    const owners = registry.exclusiveOwners(skill);
    return owners.length === 0 || owners.some((agent) => selection.agents.includes(agent));
};

const coveredSkills = (selection, registry) => {
    const allowed = (skill) => isSkillAllowed(selection, registry, skill);
    const covered = new Set(selection.all ? registry.skills.filter(allowed) : []);
    for (const profile of selection.profiles) {
        for (const skill of registry.profiles[profile] ?? []) {
            if (allowed(skill)) covered.add(skill);
        }
    }
    return covered;
};

const unknownAgentsMessage = (names, registry) =>
    `Unknown agent${names.length > 1 ? 's' : ''} ${names.map((name) => `"${name}"`).join(', ')}. ` +
    `Available: ${registry.agentNames.join(', ')}`;

export const validateAgents = (names, registry) => {
    const unknown = names.filter((name) => !registry.agentNames.includes(name));
    if (unknown.length) throw new KitError(unknownAgentsMessage(unknown, registry));
};

/** Names given on the command line must be installable for the selected agents. */
export const assertSkillsAllowed = (selection, registry, names) => {
    const blocked = names.filter((name) => registry.skills.includes(name) && !isSkillAllowed(selection, registry, name));
    if (blocked.length) {
        throw new KitError(blocked.map((name) => {
            const owners = registry.exclusiveOwners(name);
            return `Skill "${name}" is only for ${owners.join(', ')}: add --agent ${owners[0]}`;
        }).join('\n'));
    }
};

export const addToSelection = (selection, { agents = [], all = false, profiles = [], skills = [] }) => ({
    agents: union(selection.agents, agents),
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
    const knownAgent = (name) => registry.agentNames.includes(name);
    const dropped = [
        ...selection.agents.filter((name) => !knownAgent(name)),
        ...selection.profiles.filter((name) => !knownProfile(name)),
        ...selection.skills.filter((name) => !knownSkill(name)),
        ...selection.exclude.filter((name) => !knownSkill(name)),
    ];
    return {
        selection: {
            ...selection,
            agents: selection.agents.filter(knownAgent),
            profiles: selection.profiles.filter(knownProfile),
            skills: selection.skills.filter(knownSkill),
            exclude: selection.exclude.filter(knownSkill),
        },
        dropped: [...new Set(dropped)],
    };
};

export const removeAgentsFromSelection = (selection, agents, registry) => {
    validateAgents(agents, registry);
    const missing = agents.filter((name) => !selection.agents.includes(name));
    if (missing.length) throw new KitError(`Not installed: ${missing.join(', ')}. Installed agents: ${selection.agents.join(', ')}`);
    const remaining = selection.agents.filter((name) => !agents.includes(name));
    if (remaining.length === 0) throw new KitError('Cannot remove every agent: keep at least one');
    return { ...selection, agents: remaining };
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

    // A named skill whose agents were removed stays selected but is not installed until one returns.
    const wanted = coveredSkills(selection, registry);
    for (const skill of selection.skills) {
        if (!registry.skills.includes(skill) || isSkillAllowed(selection, registry, skill)) wanted.add(skill);
    }

    const known = new Set(registry.skills);
    const unknown = [...wanted].filter((skill) => !known.has(skill));
    if (unknown.length) {
        throw new KitError(unknownSkillsMessage(unknown, registry.skills));
    }

    for (const skill of selection.exclude) wanted.delete(skill);
    return [...wanted].sort();
};
