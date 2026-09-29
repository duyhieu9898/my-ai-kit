import fs from 'node:fs';
import path from 'node:path';
import { KitError } from './errors.js';

export const SUPPORTED_FORMAT_VERSION = 1;

export const loadRegistry = (templateDir) => {
    const kitPath = path.join(templateDir, 'kit.json');
    if (!fs.existsSync(kitPath)) {
        throw new KitError(`Not a kit template: missing ${kitPath}`);
    }
    const kit = JSON.parse(fs.readFileSync(kitPath, 'utf8'));
    if (!Number.isInteger(kit.formatVersion)) {
        throw new KitError(`${kitPath} has no integer formatVersion`);
    }
    if (kit.formatVersion > SUPPORTED_FORMAT_VERSION) {
        throw new KitError(
            `Template formatVersion ${kit.formatVersion} is newer than this CLI supports (${SUPPORTED_FORMAT_VERSION}). ` +
            'Upgrade the CLI: npx -y hieund-ai-kit@latest',
        );
    }

    const skillsDir = path.resolve(templateDir, '.agents', 'skills');
    const skills = fs.existsSync(skillsDir)
        ? fs.readdirSync(skillsDir, { withFileTypes: true })
            .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
            .map((entry) => entry.name)
            .sort()
        : [];

    return { formatVersion: kit.formatVersion, skills, profiles: kit.profiles ?? {}, skillsDir, templateDir };
};
