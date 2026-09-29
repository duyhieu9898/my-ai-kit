import path from 'node:path';
import { KitError } from './errors.js';
import { detectHarness, installIntegrations } from './integrations.js';
import { createManifest, readManifest, writeManifest } from './manifest.js';
import { planSkills } from './plan.js';
import { loadRegistry } from './registry.js';
import { addToSelection, removeFromSelection, resolveTargetSkills, unknownSkillsMessage } from './resolve.js';
import { PROJECT_SKILLS_DIR, adoptLegacySkills, applySkillPlan, syncClaudeLinks } from './skills.js';
import { fetchTemplates, resolveSource, sourceMode } from './source.js';

const nextSelection = ({ command, existing, manifest, add, remove, registry }) => {
    if (command === 'install') {
        const nothingRequested = !add.all && add.profiles.length === 0 && add.skills.length === 0;
        return addToSelection(manifest.selection, !existing && nothingRequested ? { all: true } : add);
    }
    if (command === 'remove') {
        const unknown = remove.filter((name) => !registry.skills.includes(name));
        if (unknown.length) throw new KitError(unknownSkillsMessage(unknown, registry.skills));
        return removeFromSelection(manifest.selection, remove, registry);
    }
    return manifest.selection;
};

export const runPipeline = async ({ projectDir, command, add = { all: false, profiles: [], skills: [] }, remove = [], options }) => {
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
        manifest.selection = nextSelection({ command, existing, manifest, add, remove, registry });

        const mode = sourceMode(source);
        const plan = planSkills({
            targetSkills: resolveTargetSkills(manifest.selection, registry),
            managedSkills: manifest.managedSkills,
            projectSkillsDir,
            sourceSkillsDir: registry.skillsDir,
            mode,
            force: Boolean(options.force),
        });
        if (options.dryRun) return { plan, warnings: [], dryRun: true, manifest };

        const conflicts = plan.filter((item) => item.action === 'conflict').map((item) => item.name);
        if (conflicts.length) {
            throw new KitError(
                `Project-owned skills collide with kit skills: ${conflicts.join(', ')}. ` +
                'Rename them, or rerun with --force to let the kit take them over.',
            );
        }

        manifest.managedSkills = applySkillPlan({
            plan, projectSkillsDir, sourceSkillsDir: registry.skillsDir, mode, managedSkills: manifest.managedSkills,
        });
        const warnings = syncClaudeLinks({ projectDir, managedNames: Object.keys(manifest.managedSkills) });
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
