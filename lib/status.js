import fs from 'node:fs';
import path from 'node:path';
import { lstatOrNull } from './fsx.js';
import { hashSkillDir } from './hash.js';
import { readManifest } from './manifest.js';
import { CLAUDE_SKILLS_DIR, SKILL_SCOPES, skillLabel } from './skills.js';

export const collectStatus = (projectDir) => {
    const manifest = readManifest(projectDir);
    if (!manifest) return { installed: false };

    const managed = [];
    const missing = [];
    const modified = [];
    const brokenLinks = [];
    const projectOwned = [];

    for (const scope of SKILL_SCOPES) {
        const skillsDir = path.join(projectDir, scope.dir);
        const managedSkills = manifest[scope.manifestKey] ?? {};
        const label = (name) => skillLabel(name, scope.id);

        for (const [name, record] of Object.entries(managedSkills).sort(([a], [b]) => a.localeCompare(b))) {
            managed.push(label(name));
            const entryPath = path.join(skillsDir, name);
            const stat = lstatOrNull(entryPath);
            if (!stat) {
                missing.push(label(name));
                continue;
            }
            if (stat.isSymbolicLink() && !fs.existsSync(entryPath)) {
                brokenLinks.push(path.join(scope.dir, name));
            } else if (record.hash && stat.isDirectory() && hashSkillDir(entryPath) !== record.hash) {
                modified.push(label(name));
            }
            if (scope.id === 'shared' && !fs.existsSync(path.join(projectDir, CLAUDE_SKILLS_DIR, name))) {
                brokenLinks.push(path.join(CLAUDE_SKILLS_DIR, name));
            }
        }

        // A legacy manifest has not recorded which skills the kit owns yet.
        if (manifest[scope.manifestKey] === null || !fs.existsSync(skillsDir)) continue;
        const owned = fs.readdirSync(skillsDir).filter((name) => !name.startsWith('.') && !(name in managedSkills));
        projectOwned.push(...owned.sort().map(label));
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
