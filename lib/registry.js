import fs from 'node:fs';
import path from 'node:path';
import { KitError } from './errors.js';
import { readJsonFile } from './fsx.js';

export const SUPPORTED_FORMAT_VERSION = 2;
export const TEMPLATE_SKILLS_DIR = 'skills';
const AGENTS_DIR = 'agents';
/** `agents/shared.json` lists what every install gets; the other files there are agents. */
const SHARED_CONFIG = 'shared';

const listSkillDirs = (skillsDir) => (fs.existsSync(skillsDir)
    ? fs.readdirSync(skillsDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
        .map((entry) => entry.name)
        .sort()
    : []);

const isSafeRelative = (value) =>
    typeof value === 'string' && value !== '' && !path.isAbsolute(value) &&
    !path.normalize(value).split(path.sep).includes('..');

const validateMapping = (mapping, where, templateDir) => {
    if (!isSafeRelative(mapping?.src) || !isSafeRelative(mapping?.dest)) {
        throw new KitError(`${where}: src and dest must be relative paths inside the template and project`);
    }
    if (!fs.existsSync(path.join(templateDir, mapping.src))) {
        throw new KitError(`${where}: ${mapping.src} does not exist in the template`);
    }
    if (mapping.src.endsWith('/') !== mapping.dest.endsWith('/')) {
        throw new KitError(`${where}: a folder mapping needs a trailing "/" on both src and dest`);
    }
};

const loadConfig = (templateDir, name, skills) => {
    const configPath = path.join(templateDir, AGENTS_DIR, `${name}.json`);
    const config = readJsonFile(configPath);
    for (const key of ['instruction', 'hooks']) {
        if (config[key]) validateMapping(config[key], `${configPath} ${key}`, templateDir);
    }
    for (const mapping of config.files ?? []) validateMapping(mapping, `${configPath} files`, templateDir);
    if (config.skills?.link !== undefined && !isSafeRelative(config.skills.link)) {
        throw new KitError(`${configPath} skills.link must be a relative path`);
    }
    const unknown = (config.exclusiveSkills ?? []).filter((skill) => !skills.includes(skill));
    if (unknown.length) throw new KitError(`${configPath} lists unknown exclusive skills: ${unknown.join(', ')}`);
    return { files: [], exclusiveSkills: [], ...config };
};

const loadAgentConfigs = (templateDir, skills) => {
    const agentsDir = path.join(templateDir, AGENTS_DIR);
    if (!fs.existsSync(path.join(agentsDir, `${SHARED_CONFIG}.json`))) {
        throw new KitError(`Not a kit template: missing ${path.join(agentsDir, `${SHARED_CONFIG}.json`)}`);
    }
    const names = fs.readdirSync(agentsDir)
        .filter((file) => file.endsWith('.json'))
        .map((file) => file.slice(0, -'.json'.length))
        .filter((name) => name !== SHARED_CONFIG)
        .sort();
    const agents = Object.fromEntries(names.map((name) => [name, loadConfig(templateDir, name, skills)]));
    return { shared: loadConfig(templateDir, SHARED_CONFIG, skills), agents };
};

export const loadRegistry = (templateDir) => {
    const kitPath = path.join(templateDir, 'kit.json');
    if (!fs.existsSync(kitPath)) {
        throw new KitError(`Not a kit template: missing ${kitPath}`);
    }
    const kit = readJsonFile(kitPath);
    if (!Number.isInteger(kit.formatVersion)) {
        throw new KitError(`${kitPath} has no integer formatVersion`);
    }
    if (kit.formatVersion > SUPPORTED_FORMAT_VERSION) {
        throw new KitError(
            `Template formatVersion ${kit.formatVersion} is newer than this CLI supports (${SUPPORTED_FORMAT_VERSION}). ` +
            'Upgrade the CLI: npx -y hieund-ai-kit@latest',
        );
    }

    const skillsDir = path.join(templateDir, TEMPLATE_SKILLS_DIR);
    const skills = listSkillDirs(skillsDir);
    const { shared, agents } = loadAgentConfigs(templateDir, skills);
    const ownersByName = new Map();
    for (const [agent, config] of Object.entries(agents)) {
        for (const skill of config.exclusiveSkills) ownersByName.set(skill, [...(ownersByName.get(skill) ?? []), agent]);
    }
    /** Agents a skill is exclusive to; empty when every agent gets it. */
    const exclusiveOwners = (name) => ownersByName.get(name) ?? [];
    const sourcePathOf = (name) => path.join(skillsDir, name);

    return {
        formatVersion: kit.formatVersion,
        skills,
        profiles: kit.profiles ?? {},
        agents,
        agentNames: Object.keys(agents),
        shared,
        exclusiveOwners,
        sourcePathOf,
        templateDir,
    };
};
