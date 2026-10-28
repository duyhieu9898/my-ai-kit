import path from 'node:path';
import { KitError } from './errors.js';
import { detectHarness, installIntegrations } from './integrations.js';
import { createManifest, readManifest, writeManifest } from './manifest.js';
import { planSkills } from './plan.js';
import { loadRegistry } from './registry.js';
import {
    DEFAULT_AGENTS, addToSelection, assertSkillsAllowed, pruneSelection, removeAgentsFromSelection, removeFromSelection,
    removeProfilesFromSelection, resolveTargetSkills, unknownSkillsMessage, validateAgents,
} from './resolve.js';
import {
    PROJECT_SKILLS_DIR, adoptLegacySkills, applySkillPlan, removeLegacyGeminiSkills, skillLabel, syncSkillLinks,
} from './skills.js';
import { fetchTemplates, resolveSource, sourceMode } from './source.js';

const droppedWarning = (name) => `Dropped "${name}" from the selection: it no longer exists in the kit`;

/** Stored names the kit dropped are pruned with a warning; names given in this run must still exist. */
const nextSelection = ({ command, existing, manifest, add, remove, removeProfiles, removeAgents, registry }) => {
    const { selection, dropped } = pruneSelection(manifest.selection, registry);
    if (command === 'install') {
        validateAgents(add.agents, registry);
        const nothingRequested = !add.all && add.profiles.length === 0 && add.skills.length === 0;
        const agents = !existing && add.agents.length === 0 ? DEFAULT_AGENTS : add.agents;
        const next = addToSelection(selection, { ...add, agents, all: add.all || (!existing && nothingRequested) });
        assertSkillsAllowed(next, registry, add.skills);
        return { selection: next, warnings: dropped.map(droppedWarning) };
    }
    if (command === 'remove') {
        const removable = (name) => registry.skills.includes(name) || manifest.selection.skills.includes(name) ||
            Object.hasOwn(manifest.managedSkills, name);
        const unknown = remove.filter((name) => !removable(name));
        if (unknown.length) throw new KitError(unknownSkillsMessage(unknown, registry.skills));
        let next = removeProfilesFromSelection(
            removeFromSelection(manifest.selection, remove, registry), removeProfiles, registry,
        );
        if (removeAgents.length) next = removeAgentsFromSelection(next, removeAgents, registry);
        const requested = new Set([...remove, ...removeProfiles, ...removeAgents]);
        return {
            selection: pruneSelection(next, registry).selection,
            warnings: dropped.filter((name) => !requested.has(name)).map(droppedWarning),
        };
    }
    return { selection, warnings: dropped.map(droppedWarning) };
};

export const runPipeline = async ({
    projectDir, command, add = {}, remove = [], removeProfiles = [], removeAgents = [], options,
}) => {
    const existing = readManifest(projectDir);
    if (command !== 'install' && !existing) {
        throw new KitError(`AI Kit is not installed in ${projectDir}. Run: hieund-ai-kit install`);
    }

    const source = resolveSource({ options, manifest: existing });
    const { templateDir, cleanup } = await fetchTemplates(source);
    try {
        const registry = loadRegistry(templateDir);
        const manifest = existing ? { ...existing } : createManifest({ source });
        manifest.source = source;
        if (manifest.managedSkills === null) {
            manifest.managedSkills = adoptLegacySkills(path.join(projectDir, PROJECT_SKILLS_DIR), registry.skills);
        }
        const previousAgents = existing ? manifest.selection.agents : [];
        const next = nextSelection({
            command, existing, manifest, add: { agents: [], all: false, profiles: [], skills: [], ...add }, remove,
            removeProfiles, removeAgents, registry,
        });
        manifest.selection = next.selection;
        const { agents } = manifest.selection;

        const mode = sourceMode(source);
        const targetSkills = resolveTargetSkills(manifest.selection, registry);
        const projectSkillsDir = path.join(projectDir, PROJECT_SKILLS_DIR);
        const plan = planSkills({
            targetSkills,
            managedSkills: manifest.managedSkills,
            projectSkillsDir,
            sourcePathOf: registry.sourcePathOf,
            mode,
            force: Boolean(options.force),
        }).map((item) => ({ ...item, agents: registry.exclusiveOwners(item.name) }));
        if (options.dryRun) return { plan, warnings: next.warnings, dryRun: true, manifest };

        const conflicts = plan.filter((item) => item.action === 'conflict').map((item) => skillLabel(item.name, item.agents));
        if (conflicts.length) {
            throw new KitError(
                `Project-owned skills collide with kit skills: ${conflicts.join(', ')}. ` +
                'Rename them, or rerun with --force to let the kit take them over.',
            );
        }

        const previousManagedNames = Object.keys(manifest.managedSkills);
        if (plan.length > 0) {
            manifest.managedSkills = applySkillPlan({
                plan, projectSkillsDir, sourcePathOf: registry.sourcePathOf, mode, managedSkills: manifest.managedSkills,
            });
        }
        const warnings = [...next.warnings];
        // An agent with a link folder sees every installed skill that is not exclusive to other agents.
        for (const [agent, config] of Object.entries(registry.agents)) {
            if (!config.skills?.link) continue;
            const managedNames = !agents.includes(agent) ? [] : Object.keys(manifest.managedSkills).filter((name) => {
                const owners = manifest.managedSkills[name].agents ?? [];
                return owners.length === 0 || owners.includes(agent);
            });
            warnings.push(...syncSkillLinks({ projectDir, linkDir: config.skills.link, managedNames, previousManagedNames }));
        }
        warnings.push(...removeLegacyGeminiSkills(projectDir, manifest.managedGeminiSkills ?? {}));
        delete manifest.managedGeminiSkills;
        for (const item of plan) {
            if (item.action === 'skip-modified') {
                warnings.push(`Kept locally modified skill "${skillLabel(item.name, item.agents)}" (use --force to overwrite)`);
            }
        }
        if (command !== 'remove' || removeAgents.length) {
            const integrations = installIntegrations(registry, projectDir, {
                agents, previousAgents, managedFiles: manifest.managedFiles, force: Boolean(options.force),
                adoptUnrecorded: Boolean(manifest.legacyAgents),
            });
            manifest.managedFiles = integrations.managedFiles;
            warnings.push(...integrations.warnings);
        }

        manifest.installedAt = new Date().toISOString();
        manifest.harness = detectHarness(projectDir);
        writeManifest(projectDir, manifest);
        return { plan, warnings, dryRun: false, manifest };
    } finally {
        cleanup();
    }
};

export const loadCatalog = async ({ projectDir, options }) => {
    const manifest = readManifest(projectDir);
    const source = resolveSource({ options, manifest });
    const { templateDir, cleanup } = await fetchTemplates(source);
    try {
        const registry = loadRegistry(templateDir);
        return {
            source,
            skills: registry.skills,
            agents: registry.agentNames,
            exclusiveOwners: Object.fromEntries(registry.skills.map((name) => [name, registry.exclusiveOwners(name)])),
            profiles: registry.profiles,
            installed: Object.keys(manifest?.managedSkills ?? {}),
        };
    } finally {
        cleanup();
    }
};
