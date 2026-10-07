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
import { PROJECT_SKILLS_DIR, adoptLegacySkills, applySkillPlan, skillLabel, syncClaudeLinks } from './skills.js';
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
        const manifest = existing ? { ...existing } : createManifest({ source });
        manifest.source = source;
        if (manifest.managedSkills === null) {
            manifest.managedSkills = adoptLegacySkills(path.join(projectDir, PROJECT_SKILLS_DIR), registry.skills);
        }
        const next = nextSelection({ command, existing, manifest, add, remove, removeProfiles, registry });
        manifest.selection = next.selection;

        const mode = sourceMode(source);
        const targetSkills = resolveTargetSkills(manifest.selection, registry);
        // A skill that moved between scopes is removed from its old folder and added to its new one.
        const scopePlans = registry.scopes.map((scope) => {
            const projectSkillsDir = path.join(projectDir, scope.dir);
            const plan = planSkills({
                targetSkills: targetSkills.filter((name) => scope.skills.includes(name)),
                managedSkills: manifest[scope.manifestKey],
                projectSkillsDir,
                sourceSkillsDir: scope.skillsDir,
                mode,
                force: Boolean(options.force),
            }).map((item) => ({ ...item, scope: scope.id }));
            return { scope, projectSkillsDir, plan };
        });
        const plan = scopePlans.flatMap((scopePlan) => scopePlan.plan);
        if (options.dryRun) return { plan, warnings: next.warnings, dryRun: true, manifest };

        const conflicts = plan.filter((item) => item.action === 'conflict').map((item) => skillLabel(item.name, item.scope));
        if (conflicts.length) {
            throw new KitError(
                `Project-owned skills collide with kit skills: ${conflicts.join(', ')}. ` +
                'Rename them, or rerun with --force to let the kit take them over.',
            );
        }

        const previousManagedNames = Object.keys(manifest.managedSkills);
        for (const { scope, projectSkillsDir, plan: scopePlan } of scopePlans) {
            if (scopePlan.length === 0) continue;
            manifest[scope.manifestKey] = applySkillPlan({
                plan: scopePlan, projectSkillsDir, sourceSkillsDir: scope.skillsDir, mode,
                managedSkills: manifest[scope.manifestKey],
            });
        }
        const warnings = [...next.warnings, ...syncClaudeLinks({
            projectDir, managedNames: Object.keys(manifest.managedSkills), previousManagedNames,
        })];
        for (const item of plan) {
            if (item.action === 'skip-modified') {
                warnings.push(`Kept locally modified skill "${skillLabel(item.name, item.scope)}" (use --force to overwrite)`);
            }
        }
        if (command !== 'remove') {
            const integrations = installIntegrations(templateDir, projectDir, {
                managedFiles: manifest.managedFiles, force: Boolean(options.force),
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
            geminiSkills: registry.scopes.find((scope) => scope.id === 'gemini').skills,
            profiles: registry.profiles,
            installed: [...Object.keys(manifest?.managedSkills ?? {}), ...Object.keys(manifest?.managedGeminiSkills ?? {})],
        };
    } finally {
        cleanup();
    }
};
