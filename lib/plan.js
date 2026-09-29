import fs from 'node:fs';
import path from 'node:path';
import { lstatOrNull } from './fsx.js';
import { hashSkillDir } from './hash.js';

const isLocallyModified = (entryPath, stat, record) =>
    Boolean(record.hash) && stat.isDirectory() && hashSkillDir(entryPath) !== record.hash;

const matchesSource = (entryPath, stat, sourcePath, mode) => {
    if (mode === 'link') {
        return stat.isSymbolicLink() && fs.readlinkSync(entryPath) === sourcePath;
    }
    return stat.isDirectory() && hashSkillDir(entryPath) === hashSkillDir(sourcePath);
};

export const planSkills = ({ targetSkills, managedSkills, projectSkillsDir, sourceSkillsDir, mode, force }) => {
    const target = new Set(targetSkills);
    const names = [...new Set([...targetSkills, ...Object.keys(managedSkills)])].sort();

    return names.map((name) => {
        const entryPath = path.join(projectSkillsDir, name);
        const stat = lstatOrNull(entryPath);
        const record = managedSkills[name];

        if (!record) {
            if (!stat) return { name, action: 'add' };
            return { name, action: force ? 'update' : 'conflict' };
        }
        if (!stat) return { name, action: target.has(name) ? 'add' : 'remove' };
        if (!force && isLocallyModified(entryPath, stat, record)) return { name, action: 'skip-modified' };
        if (!target.has(name)) return { name, action: 'remove' };

        const sourcePath = path.join(sourceSkillsDir, name);
        return { name, action: matchesSource(entryPath, stat, sourcePath, mode) ? 'unchanged' : 'update' };
    });
};
