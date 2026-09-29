import path from 'node:path';
import { KitError } from './errors.js';
import { detectHarness, installIntegrations } from './integrations.js';
import { createManifest, readManifest, writeManifest } from './manifest.js';
import { planSkills } from './plan.js';
import { loadRegistry } from './registry.js';
import {
    addToSelection, pruneSelection, removeFromSelection, removeProfilesFromSelection, resolveTargetSkills,
    unknownSkillsMessage,
} from './resolve.js';
import { PROJECT_SKILLS_DIR, adoptLegacySkills, applySkillPlan, syncClaudeLinks } from './skills.js';
import { fetchTemplates, resolveSource, sourceMode } from './source.js';

const droppedWarning = (name) => `Dropped "${name}" from the selection: it no longer exists in the kit`;

/** Stored names the kit dropped are pruned with a warning; names given in this run must still exist. */
const nextSelection = ({ command, existing, manifest, add, remove, removeProfiles, registry }) => {
    const { selection, dropped } = pruneSelection(manifest.selection, registry);
    if (command === 'install') {
        const nothingRequested = !add.all && add.profiles.length === 0 && add.skills.length === 0;
        return {
            selection: addToSelection(selection, !existing && nothingRequested ? { all: true } : add),
            warnings: dropped.map(droppedWarning),
        };
    }
    if (command === 'remove') {
        const removable = (name) => registry.skills.includes(name) || manifest.selection.skills.includes(name) ||
            Object.hasOwn(manifest.managedSkills, name);
        const unknown = remove.filter((name) => !removable(name));
        if (unknown.length) throw new KitError(unknownSkillsMessage(unknown, registry.skills));
        const next = removeProfilesFromSelection(
            removeFromSelection(manifest.selection, remove, registry), removeProfiles, registry,
        );
        const requested = new Set([...remove, ...removeProfiles]);
        return {
            selection: pruneSelection(next, registry).selection,
            warnings: dropped.filter((name) => !requested.has(name)).map(droppedWarning),
        };
    }
    return { selection, warnings: dropped.map(droppedWarning) };
};

export const runPipeline = async ({
    projectDir, command, add = { all: false, profiles: [], skills: [] }, remove = [], removeProfiles = [], options,
}) => {
    const existing = readManifest(projectDir);
    if (command !== 'install' && !existing) {
        throw new KitError(`AI Kit is not installed in ${projectDir}. Run: hieund-ai-kit install`);
    }

    const source = resolveSource({ options, manifest: existing });
    const { templateDir, cleanup } = await fetchTemplates(source);
    try {
        const registry = loadRegistry(templateDir);
        const projectSkillsDir = path.join(projectDir, PROJECT_SKILLS_DIR);
        const manifest = existing ? { ...existing } : createManifest({ source });
        manifest.source = source;
        if (manifest.managedSkills === null) {
            manifest.managedSkills = adoptLegacySkills(projectSkillsDir, registry.skills);
        }
        const next = nextSelection({ command, existing, manifest, add, remove, removeProfiles, registry });
        manifest.selection = next.selection;

        const mode = sourceMode(source);
        const plan = planSkills({
            targetSkills: resolveTargetSkills(manifest.selection, registry),
            managedSkills: manifest.managedSkills,
            projectSkillsDir,
            sourceSkillsDir: registry.skillsDir,
            mode,
            force: Boolean(options.force),
        });
        if (options.dryRun) return { plan, warnings: next.warnings, dryRun: true, manifest };

        const conflicts = plan.filter((item) => item.action === 'conflict').map((item) => item.name);
        if (conflicts.length) {
            throw new KitError(
                `Project-owned skills collide with kit skills: ${conflicts.join(', ')}. ` +
                'Rename them, or rerun with --force to let the kit take them over.',
            );
        }

        const previousManagedNames = Object.keys(manifest.managedSkills);
        manifest.managedSkills = applySkillPlan({
            plan, projectSkillsDir, sourceSkillsDir: registry.skillsDir, mode, managedSkills: manifest.managedSkills,
        });
        const warnings = [...next.warnings, ...syncClaudeLinks({
            projectDir, managedNames: Object.keys(manifest.managedSkills), previousManagedNames,
        })];
        for (const item of plan) {
            if (item.action === 'skip-modified') {
                warnings.push(`Kept locally modified skill "${item.name}" (use --force to overwrite)`);
            }
        }
        if (command !== 'remove') installIntegrations(templateDir, projectDir);

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
            profiles: registry.profiles,
            installed: Object.keys(manifest?.managedSkills ?? {}),
        };
    } finally {
        cleanup();
    }
};
