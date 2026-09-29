import fs from 'node:fs';
import path from 'node:path';
import { KitError } from './errors.js';
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
    let raw;
    try {
        raw = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (error) {
        throw new KitError(`Cannot parse ${manifestPath}: ${error.message}`);
    }
    return raw.formatVersion === undefined ? migrateLegacyManifest(raw) : raw;
};

export const writeManifest = (projectDir, manifest) => {
    fs.writeFileSync(path.join(projectDir, MANIFEST_FILE), `${JSON.stringify(manifest, null, 2)}\n`);
};
