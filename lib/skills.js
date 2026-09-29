import fs from 'node:fs';
import path from 'node:path';
import { KitError } from './errors.js';
import { lstatOrNull } from './fsx.js';
import { hashSkillDir, isIgnoredName } from './hash.js';

export const PROJECT_SKILLS_DIR = path.join('.agents', 'skills');
export const CLAUDE_SKILLS_DIR = path.join('.claude', 'skills');

const CLAUDE_LINK_PREFIX = `${path.join('..', '..', '.agents', 'skills')}${path.sep}`;
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

export const applySkillPlan = ({ plan, projectSkillsDir, sourceSkillsDir, mode, managedSkills }) => {
    fs.mkdirSync(projectSkillsDir, { recursive: true });
    removeStaleStaging(projectSkillsDir);
    const next = { ...managedSkills };

    for (const { name, action } of plan) {
        const destPath = path.join(projectSkillsDir, name);
        const sourcePath = path.join(sourceSkillsDir, name);
        if (action === 'conflict') {
            throw new KitError(`Refusing to overwrite project-owned skill "${name}"`);
        }
        if (action === 'add' || action === 'update') {
            if (mode === 'link') replaceWithLink(sourcePath, destPath);
            else replaceWithCopy(sourcePath, destPath);
            next[name] = recordFor(destPath, mode);
        } else if (action === 'unchanged') {
            next[name] = recordFor(destPath, mode);
        } else if (action === 'remove') {
            fs.rmSync(destPath, { recursive: true, force: true });
            delete next[name];
        }
    }
    return next;
};

const isKitClaudeLink = (linkPath) =>
    Boolean(lstatOrNull(linkPath)?.isSymbolicLink()) && fs.readlinkSync(linkPath).startsWith(CLAUDE_LINK_PREFIX);

export const syncClaudeLinks = ({ projectDir, managedNames }) => {
    const claudeDir = path.join(projectDir, CLAUDE_SKILLS_DIR);
    fs.mkdirSync(claudeDir, { recursive: true });
    const managed = new Set(managedNames);
    const warnings = [];

    for (const name of managed) {
        const linkPath = path.join(claudeDir, name);
        const expected = path.join('..', '..', '.agents', 'skills', name);
        if (!lstatOrNull(linkPath)) {
            createSymlink(expected, linkPath);
        } else if (isKitClaudeLink(linkPath)) {
            if (fs.readlinkSync(linkPath) !== expected) {
                fs.unlinkSync(linkPath);
                createSymlink(expected, linkPath);
            }
        } else {
            warnings.push(`Left ${path.join(CLAUDE_SKILLS_DIR, name)} alone: it is not a kit-managed link`);
        }
    }

    for (const entry of fs.readdirSync(claudeDir)) {
        const linkPath = path.join(claudeDir, entry);
        if (!managed.has(entry) && isKitClaudeLink(linkPath)) fs.unlinkSync(linkPath);
    }
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
