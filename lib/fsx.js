import fs from 'node:fs';
import { KitError } from './errors.js';

/** `fs.lstatSync` that returns null instead of throwing when the path is missing. */
export const lstatOrNull = (p) => {
    try {
        return fs.lstatSync(p);
    } catch {
        return null;
    }
};

/** Parse a JSON file, reporting a malformed one as a KitError that names the file. */
export const readJsonFile = (filePath) => {
    const text = fs.readFileSync(filePath, 'utf8');
    try {
        return JSON.parse(text);
    } catch (error) {
        throw new KitError(`Cannot parse ${filePath}: ${error.message}`);
    }
};
