import fs from 'node:fs';
import path from 'node:path';
import { lstatOrNull } from './fsx.js';
import { hashSkillDir } from './hash.js';
import { readManifest } from './manifest.js';
import { CLAUDE_SKILLS_DIR, PROJECT_SKILLS_DIR, skillLabel } from './skills.js';

export const collectStatus = (projectDir) => {
    const manifest = readManifest(projectDir);
    if (!manifest) return { installed: false };

    const managed = [];
    const missing = [];
    const modified = [];
    const brokenLinks = [];
    const projectOwned = [];

    const skillsDir = path.join(projectDir, PROJECT_SKILLS_DIR);
    const managedSkills = manifest.managedSkills ?? {};
    const claudeLinks = manifest.selection.agents.includes('claude');
    for (const [name, record] of Object.entries(managedSkills).sort(([a], [b]) => a.localeCompare(b))) {
        const label = skillLabel(name, record.agents);
        managed.push(label);
        const entryPath = path.join(skillsDir, name);
        const stat = lstatOrNull(entryPath);
        if (!stat) {
            missing.push(label);
            continue;
        }
        if (stat.isSymbolicLink() && !fs.existsSync(entryPath)) {
            brokenLinks.push(path.join(PROJECT_SKILLS_DIR, name));
        } else if (record.hash && stat.isDirectory() && hashSkillDir(entryPath) !== record.hash) {
            modified.push(label);
        }
        const claudeSees = !record.agents?.length || record.agents.includes('claude');
        if (claudeLinks && claudeSees && !fs.existsSync(path.join(projectDir, CLAUDE_SKILLS_DIR, name))) {
            brokenLinks.push(path.join(CLAUDE_SKILLS_DIR, name));
        }
    }

    // A legacy manifest has not recorded which skills the kit owns yet.
    if (manifest.managedSkills !== null && fs.existsSync(skillsDir)) {
        const owned = fs.readdirSync(skillsDir).filter((name) => !name.startsWith('.') && !(name in managedSkills));
        projectOwned.push(...owned.sort());
    }

    return {
        installed: true,
        legacy: manifest.managedSkills === null,
        source: manifest.source,
        selection: manifest.selection,
        managed,
        missing,
        modified,
        brokenLinks,
        projectOwned,
    };
};
