import fs from 'node:fs';
import path from 'node:path';
import { KitError } from './errors.js';
import { lstatOrNull } from './fsx.js';
import { hashSkillDir, isIgnoredName } from './hash.js';

export const PROJECT_SKILLS_DIR = path.join('.agents', 'skills');
export const LEGACY_GEMINI_SKILLS_DIR = path.join('.agent', 'skills');
export const CLAUDE_SKILLS_DIR = path.join('.claude', 'skills');

/** `agents` lists the agents a skill is exclusive to; most skills have none. */
export const skillLabel = (name, agents = []) => (agents.length ? `${name} (${agents.join(', ')})` : name);
const STAGING_PATTERN = /^\..+\.tmp-\d+-\d+$/;

const createSymlink = (target, linkPath) => {
    try {
        fs.symlinkSync(target, linkPath, 'dir');
    } catch (error) {
        throw new KitError(`Cannot create symlink ${linkPath} -> ${target}: ${error.message}`);
    }
};

const removeStaleStaging = (projectSkillsDir) => {
    for (const entry of fs.readdirSync(projectSkillsDir)) {
        if (STAGING_PATTERN.test(entry)) {
            fs.rmSync(path.join(projectSkillsDir, entry), { recursive: true, force: true });
        }
    }
};

const replaceWithCopy = (sourcePath, destPath) => {
    const staging = path.join(path.dirname(destPath), `.${path.basename(destPath)}.tmp-${process.pid}-${Date.now()}`);
    try {
        fs.cpSync(sourcePath, staging, { recursive: true, filter: (src) => !isIgnoredName(path.basename(src)) });
        fs.rmSync(destPath, { recursive: true, force: true });
        fs.renameSync(staging, destPath);
    } catch (error) {
        fs.rmSync(staging, { recursive: true, force: true });
        throw error;
    }
};

const replaceWithLink = (sourcePath, destPath) => {
    fs.rmSync(destPath, { recursive: true, force: true });
    createSymlink(sourcePath, destPath);
};

const recordFor = (destPath, mode) => (mode === 'link' ? {} : { hash: hashSkillDir(destPath) });

export const applySkillPlan = ({
    plan, projectSkillsDir, sourceSkillsDir, sourcePathOf = (name) => path.join(sourceSkillsDir, name), mode, managedSkills,
}) => {
    const conflicts = plan.filter((item) => item.action === 'conflict').map((item) => item.name);
    if (conflicts.length > 0) {
        throw new KitError(`Refusing to overwrite project-owned skill(s): ${conflicts.join(', ')}`);
    }

    fs.mkdirSync(projectSkillsDir, { recursive: true });
    removeStaleStaging(projectSkillsDir);
    const next = { ...managedSkills };

    for (const { name, action, agents = [] } of plan) {
        const destPath = path.join(projectSkillsDir, name);
        const sourcePath = sourcePathOf(name);
        const agentsField = agents.length ? { agents } : {};
        if (action === 'add' || action === 'update') {
            if (mode === 'link') replaceWithLink(sourcePath, destPath);
            else replaceWithCopy(sourcePath, destPath);
            next[name] = { ...recordFor(destPath, mode), ...agentsField };
        } else if (action === 'unchanged') {
            next[name] = { ...recordFor(destPath, mode), ...agentsField };
        } else if (action === 'remove') {
            fs.rmSync(destPath, { recursive: true, force: true });
            delete next[name];
        }
    }
    return next;
};

export const removeEmptyDirs = (dirs) => {
    for (const dir of dirs) {
        if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
    }
};

/**
 * Points `<projectDir>/<linkDir>/<name>` at `.agents/skills/<name>` for every name in `managedNames`,
 * and removes only the links of skills the kit managed before this run, so users' own links survive.
 */
export const syncSkillLinks = ({ projectDir, linkDir = CLAUDE_SKILLS_DIR, managedNames, previousManagedNames }) => {
    const linksDir = path.join(projectDir, linkDir);
    const targetPrefix = `${path.relative(linksDir, path.join(projectDir, PROJECT_SKILLS_DIR))}${path.sep}`;
    const isKitLink = (linkPath) =>
        Boolean(lstatOrNull(linkPath)?.isSymbolicLink()) && fs.readlinkSync(linkPath).startsWith(targetPrefix);
    const managed = new Set(managedNames);
    const warnings = [];
    if (managed.size > 0) fs.mkdirSync(linksDir, { recursive: true });

    for (const name of managed) {
        const linkPath = path.join(linksDir, name);
        const expected = `${targetPrefix}${name}`;
        if (!lstatOrNull(linkPath)) {
            createSymlink(expected, linkPath);
        } else if (isKitLink(linkPath)) {
            if (fs.readlinkSync(linkPath) !== expected) {
                fs.unlinkSync(linkPath);
                createSymlink(expected, linkPath);
            }
        } else {
            warnings.push(`Left ${path.join(linkDir, name)} alone: it is not a kit-managed link`);
        }
    }

    for (const name of previousManagedNames) {
        const linkPath = path.join(linksDir, name);
        if (!managed.has(name) && isKitLink(linkPath)) fs.unlinkSync(linkPath);
    }
    if (managed.size === 0) removeEmptyDirs([linksDir, path.dirname(linksDir)]);
    return warnings;
};

/** Pre-release 5.0 builds put Gemini-only skills in `.agent/skills`; remove the kit's unmodified copies there. */
export const removeLegacyGeminiSkills = (projectDir, records) => {
    const legacyDir = path.join(projectDir, LEGACY_GEMINI_SKILLS_DIR);
    const warnings = [];
    for (const [name, record] of Object.entries(records)) {
        const entryPath = path.join(legacyDir, name);
        const stat = lstatOrNull(entryPath);
        if (!stat) continue;
        if (stat.isSymbolicLink() || (record.hash && hashSkillDir(entryPath) === record.hash)) {
            fs.rmSync(entryPath, { recursive: true, force: true });
        } else {
            warnings.push(`Left locally modified ${path.join(LEGACY_GEMINI_SKILLS_DIR, name)} in place; the kit now installs it in ${PROJECT_SKILLS_DIR}`);
        }
    }
    removeEmptyDirs([legacyDir, path.dirname(legacyDir)]);
    return warnings;
};

export const adoptLegacySkills = (projectSkillsDir, availableSkills) => {
    const adopted = {};
    for (const name of availableSkills) {
        const entryPath = path.join(projectSkillsDir, name);
        if (lstatOrNull(entryPath)?.isDirectory()) adopted[name] = { hash: hashSkillDir(entryPath) };
    }
    return adopted;
};
