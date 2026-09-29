import { downloadTemplate } from 'giget';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { KitError } from './errors.js';

const REPO = 'github:duyhieu9898/my-ai-kit';

export const resolveSource = ({ options, manifest }) => {
    if (options.link && !options.source) {
        throw new KitError('--link requires --source <dir>');
    }
    if (options.source) {
        return { type: 'local', path: path.resolve(options.source), mode: options.link ? 'link' : 'copy' };
    }
    if (options.ref) return { type: 'github', ref: options.ref };
    if (manifest?.source) return manifest.source;
    return { type: 'github', ref: 'main' };
};

export const sourceMode = (source) => (source.type === 'local' ? source.mode : 'copy');

export const fetchTemplates = async (source) => {
    if (source.type === 'local') {
        const templateDir = path.join(source.path, 'templates');
        if (!fs.existsSync(path.join(templateDir, 'kit.json'))) {
            throw new KitError(
                `${source.path} is not a kit checkout (missing templates/kit.json). ` +
                'If the checkout moved, rerun with --source <new path>, or switch to GitHub with --ref main.',
            );
        }
        return { templateDir, cleanup: () => {} };
    }

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hieund-ai-kit-'));
    const cleanup = () => fs.rmSync(tempDir, { recursive: true, force: true });
    try {
        await downloadTemplate(`${REPO}/templates#${source.ref}`, { dir: tempDir, force: true });
    } catch (error) {
        cleanup();
        throw new KitError(`Download of ${REPO}@${source.ref} failed: ${error.message}`);
    }
    return { templateDir: tempDir, cleanup };
};
