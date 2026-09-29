import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const writeSkill = (templateDir, name, body = `---\nname: ${name}\ndescription: test skill\n---\n`) => {
    const dir = path.join(templateDir, '.agents', 'skills', name);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'SKILL.md'), body);
    return dir;
};

export const makeKit = ({ skills = [], profiles = {}, formatVersion = 1 } = {}) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-src-'));
    const templateDir = path.join(root, 'templates');
    fs.mkdirSync(path.join(templateDir, '.agents', 'skills'), { recursive: true });
    fs.writeFileSync(path.join(templateDir, 'kit.json'), JSON.stringify({ formatVersion, profiles }));
    for (const name of skills) writeSkill(templateDir, name);
    return { root, templateDir, skillsDir: path.join(templateDir, '.agents', 'skills') };
};

export const makeProject = () => fs.mkdtempSync(path.join(os.tmpdir(), 'kit-proj-'));
