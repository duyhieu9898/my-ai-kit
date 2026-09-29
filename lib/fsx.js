import fs from 'node:fs';

/** `fs.lstatSync` that returns null instead of throwing when the path is missing. */
export const lstatOrNull = (p) => {
    try {
        return fs.lstatSync(p);
    } catch {
        return null;
    }
};
