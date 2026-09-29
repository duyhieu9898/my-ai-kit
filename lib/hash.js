import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const isIgnoredName = (name) => name === '__pycache__' || name.endsWith('.pyc');

const byName = (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

/** SHA-256 over sorted relative paths and file contents, ignoring Python bytecode. */
export const hashSkillDir = (dir) => {
    const hash = crypto.createHash('sha256');
    const walk = (relativeDir) => {
        const entries = fs.readdirSync(path.join(dir, relativeDir), { withFileTypes: true })
            .filter((entry) => !isIgnoredName(entry.name))
            .sort(byName);
        for (const entry of entries) {
            const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
            if (entry.isDirectory()) {
                walk(relativePath);
            } else if (entry.isFile()) {
                hash.update(`${relativePath}\0`);
                hash.update(fs.readFileSync(path.join(dir, relativePath)));
                hash.update('\0');
            }
        }
    };
    walk('');
    return `sha256:${hash.digest('hex')}`;
};

export const hashFile = (file) =>
    `sha256:${crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}`;
