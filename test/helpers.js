import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const writeSkill = (templateDir, name, body = `---\nname: ${name}\ndescription: test skill\n---\n`) => {
    const dir = path.join(templateDir, 'skills', name);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'SKILL.md'), body);
    return dir;
};

export const writeTemplateFile = (templateDir, relPath, text) => {
    const filePath = path.join(templateDir, relPath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, text);
    return filePath;
};

export const writeAgentConfig = (templateDir, name, config) =>
    writeTemplateFile(templateDir, path.join('agents', `${name}.json`), JSON.stringify(config));

/**
 * A template with `skills/`, `kit.json`, and agent configs. By default Claude links skills,
 * Codex reads `.agents/skills`, and Gemini owns `geminiSkills`; `agents` replaces those configs.
 */
export const makeKit = ({ skills = [], geminiSkills = [], profiles = {}, formatVersion = 2, agents, shared = { files: [] } } = {}) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-src-'));
    const templateDir = path.join(root, 'templates');
    fs.mkdirSync(path.join(templateDir, 'skills'), { recursive: true });
    fs.writeFileSync(path.join(templateDir, 'kit.json'), JSON.stringify({ formatVersion, profiles }));
    for (const name of [...skills, ...geminiSkills]) writeSkill(templateDir, name);
    const configs = agents ?? {
        claude: { skills: { link: '.claude/skills' } },
        codex: {},
        gemini: { exclusiveSkills: geminiSkills },
    };
    writeAgentConfig(templateDir, 'shared', shared);
    for (const [name, config] of Object.entries(configs)) writeAgentConfig(templateDir, name, config);
    return { root, templateDir, skillsDir: path.join(templateDir, 'skills') };
};

export const makeProject = () => fs.mkdtempSync(path.join(os.tmpdir(), 'kit-proj-'));
