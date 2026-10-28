import fs from 'node:fs';
import path from 'node:path';
import { KitError } from './errors.js';
import { readJsonFile } from './fsx.js';
import { emptySelection } from './resolve.js';

export const MANIFEST_FILE = '.ai-kit.json';
const FORMAT_VERSION = 2;
const DEFAULT_FEATURES = { backlog: true, guardHooks: true, toolRegistry: true };
/** Installs made before agents were selectable wrote every agent's files. */
const LEGACY_AGENTS = ['claude', 'codex', 'gemini'];
/** One path segment: no separators, no leading dot. */
const SKILL_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export const createManifest = ({ source }) => ({
    formatVersion: FORMAT_VERSION,
    source,
    selection: emptySelection(),
    managedSkills: {},
    managedFiles: {},
    installedAt: null,
    harness: null,
    features: { ...DEFAULT_FEATURES },
});

/**
 * Pre-1 manifests recorded no hashes; `managedSkills: null` and `managedFiles: null` ask the
 * pipeline to adopt the existing skills and shared files.
 */
const migrateLegacyManifest = (raw) => ({
    formatVersion: FORMAT_VERSION,
    source: { type: 'github', ref: raw.ref || 'main' },
    selection: { ...emptySelection(), agents: [...LEGACY_AGENTS], all: true },
    legacyAgents: true,
    managedSkills: null,
    managedFiles: null,
    installedAt: raw.installedAt ?? null,
    harness: raw.harness ?? null,
    features: { ...DEFAULT_FEATURES, ...(raw.features ?? {}) },
});

export const readManifest = (projectDir) => {
    const manifestPath = path.join(projectDir, MANIFEST_FILE);
    if (!fs.existsSync(manifestPath)) return null;
    const raw = readJsonFile(manifestPath);
    if (raw.formatVersion === undefined) return migrateLegacyManifest(raw);
    if (raw.formatVersion > FORMAT_VERSION) {
        throw new KitError(
            `${manifestPath} has formatVersion ${raw.formatVersion}, newer than this CLI supports (${FORMAT_VERSION}). ` +
            'Upgrade the CLI: npx -y hieund-ai-kit@latest',
        );
    }
    if (typeof raw.managedSkills !== 'object' || raw.managedSkills === null) {
        throw new KitError(`${manifestPath} is missing managedSkills`);
    }
    // Skill names become paths under .agents/skills, .claude/skills, and .agent/skills.
    const badNames = [...Object.keys(raw.managedSkills), ...Object.keys(raw.managedGeminiSkills ?? {})]
        .filter((name) => !SKILL_NAME_PATTERN.test(name));
    if (badNames.length) {
        throw new KitError(`${manifestPath} lists invalid skill names: ${badNames.map((name) => JSON.stringify(name)).join(', ')}`);
    }
    // Early formatVersion 1 manifests predate shared-file hashes. Manifests without selected agents
    // get every agent (`legacyAgents` asks the pipeline to adopt their unrecorded files). Pre-release
    // 5.0 manifests may still list `.agent/skills` records under managedGeminiSkills, which the
    // pipeline cleans up, and mark Gemini-only skills with `scope: "gemini"`.
    const { gemini: _gemini, ...rawSelection } = raw.selection ?? {};
    const legacyAgents = !Array.isArray(rawSelection.agents);
    const selection = { ...emptySelection(), ...rawSelection, agents: legacyAgents ? [...LEGACY_AGENTS] : rawSelection.agents };
    const managedSkills = Object.fromEntries(Object.entries(raw.managedSkills).map(([name, record]) => {
        const { scope, ...rest } = record;
        return [name, scope === 'gemini' ? { ...rest, agents: ['gemini'] } : rest];
    }));
    return {
        ...raw,
        formatVersion: FORMAT_VERSION,
        selection,
        ...(legacyAgents ? { legacyAgents } : {}),
        managedSkills,
        managedFiles: raw.managedFiles ?? null,
    };
};

export const writeManifest = (projectDir, { legacyAgents: _legacyAgents, ...manifest }) => {
    fs.writeFileSync(path.join(projectDir, MANIFEST_FILE), `${JSON.stringify(manifest, null, 2)}\n`);
};
