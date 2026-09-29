import fs from 'node:fs';
import path from 'node:path';
import { lstatOrNull } from './fsx.js';
import { hashSkillDir } from './hash.js';
import { readManifest } from './manifest.js';
import { CLAUDE_SKILLS_DIR, PROJECT_SKILLS_DIR } from './skills.js';

export const collectStatus = (projectDir) => {
    const manifest = readManifest(projectDir);
    if (!manifest) return { installed: false };

    const skillsDir = path.join(projectDir, PROJECT_SKILLS_DIR);
    const managedSkills = manifest.managedSkills ?? {};
    const missing = [];
    const modified = [];
    const brokenLinks = [];

    for (const [name, record] of Object.entries(managedSkills).sort(([a], [b]) => a.localeCompare(b))) {
        const entryPath = path.join(skillsDir, name);
        const stat = lstatOrNull(entryPath);
        if (!stat) {
            missing.push(name);
            continue;
        }
        if (stat.isSymbolicLink() && !fs.existsSync(entryPath)) {
            brokenLinks.push(path.join(PROJECT_SKILLS_DIR, name));
        } else if (record.hash && stat.isDirectory() && hashSkillDir(entryPath) !== record.hash) {
            modified.push(name);
        }
        if (!fs.existsSync(path.join(projectDir, CLAUDE_SKILLS_DIR, name))) {
            brokenLinks.push(path.join(CLAUDE_SKILLS_DIR, name));
        }
    }

    const entries = fs.existsSync(skillsDir) ? fs.readdirSync(skillsDir).filter((name) => !name.startsWith('.')) : [];
    return {
        installed: true,
        legacy: manifest.managedSkills === null,
        source: manifest.source,
        selection: manifest.selection,
        managed: Object.keys(managedSkills).sort(),
        missing,
        modified,
        brokenLinks,
        // A legacy manifest has not recorded which skills the kit owns yet.
        projectOwned: manifest.managedSkills === null ? [] : entries.filter((name) => !(name in managedSkills)).sort(),
    };
};
