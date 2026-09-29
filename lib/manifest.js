import fs from 'node:fs';
import path from 'node:path';
import { KitError } from './errors.js';
import { readJsonFile } from './fsx.js';
import { emptySelection } from './resolve.js';

export const MANIFEST_FILE = '.ai-kit.json';
const FORMAT_VERSION = 1;
const DEFAULT_FEATURES = { backlog: true, guardHooks: true, toolRegistry: true };

export const createManifest = ({ source }) => ({
    formatVersion: FORMAT_VERSION,
    source,
    selection: emptySelection(),
    managedSkills: {},
    installedAt: null,
    harness: null,
    features: { ...DEFAULT_FEATURES },
});

/** Pre-1 manifests recorded no hashes; `managedSkills: null` asks the pipeline to adopt existing skills. */
const migrateLegacyManifest = (raw) => ({
    formatVersion: FORMAT_VERSION,
    source: { type: 'github', ref: raw.ref || 'main' },
    selection: { ...emptySelection(), all: true },
    managedSkills: null,
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
    return raw;
};

export const writeManifest = (projectDir, manifest) => {
    fs.writeFileSync(path.join(projectDir, MANIFEST_FILE), `${JSON.stringify(manifest, null, 2)}\n`);
};
