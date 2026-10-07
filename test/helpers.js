import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const writeSkill = (templateDir, name, body = `---\nname: ${name}\ndescription: test skill\n---\n`, scopeDir = '.agents') => {
    const dir = path.join(templateDir, scopeDir, 'skills', name);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'SKILL.md'), body);
    return dir;
};

export const makeKit = ({ skills = [], geminiSkills = [], profiles = {}, formatVersion = 2 } = {}) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-src-'));
    const templateDir = path.join(root, 'templates');
    fs.mkdirSync(path.join(templateDir, '.agents', 'skills'), { recursive: true });
    fs.writeFileSync(path.join(templateDir, 'kit.json'), JSON.stringify({ formatVersion, profiles }));
    for (const name of skills) writeSkill(templateDir, name);
    for (const name of geminiSkills) writeSkill(templateDir, name, undefined, '.agent');
    return {
        root, templateDir,
        skillsDir: path.join(templateDir, '.agents', 'skills'),
        geminiSkillsDir: path.join(templateDir, '.agent', 'skills'),
    };
};

export const makeProject = () => fs.mkdtempSync(path.join(os.tmpdir(), 'kit-proj-'));
