// Automatable rules of docs/skills/SKILL_STANDARD.md and DESCRIPTION_GUIDE.md.
// Pure functions over file contents so they can be unit tested without a repo.

const ALLOWED_KEYS = new Set(["name", "description"]);
const EXPLICIT_ONLY_KEY = "disable-model-invocation";
const MAX_DESCRIPTION = 1024;
const KIT_MAX_DESCRIPTION = 400;
const MAX_BODY_LINES = 200;
const SHORT_DESCRIPTION_RANGE = [25, 64];

export const splitFrontmatter = (text) => {
  const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return null;
  return { frontmatter: match[1], body: text.slice(match[0].length) };
};

export const frontmatterKeys = (frontmatter) =>
  [...frontmatter.matchAll(/^([A-Za-z0-9_-]+):/gm)].map((match) => match[1]);

/** Reads a top-level scalar, including `>-` / `|` block scalars, as one whitespace-collapsed line. */
export const frontmatterScalar = (frontmatter, key) => {
  const lines = frontmatter.split("\n");
  const start = lines.findIndex((line) => line.startsWith(`${key}:`));
  if (start === -1) return null;
  const inline = lines[start].slice(key.length + 1).trim();
  if (!/^[>|][+-]?$/.test(inline)) {
    return inline.replace(/^["']|["']$/g, "");
  }
  const block = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() !== "" && !/^\s/.test(line)) break;
    block.push(line.trim());
  }
  return block.join(" ").replace(/\s+/g, " ").trim();
};

const yamlValue = (text, key) => {
  const match = text.match(new RegExp(`^\\s*${key}:\\s*(.+)$`, "m"));
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : null;
};

const PERSONA = /\b(expert in|you are|senior [a-z]+ (architect|engineer)|elite)\b/i;
const SHOUTING = /\b(ONLY|NEVER|MUST|NOT|ALWAYS)\b/;
const CLAUDE_ONLY_BODY = /\$ARGUMENTS|\$\{CLAUDE_SKILL_DIR\}|!`/;

/**
* Lint one skill. Returns findings `{ rule, level, detail }`, where level is
* "error" for spec violations and "warn" for kit rules still being adopted.
* @param {object} skill
* @param {string} skill.name folder name
* @param {string} skill.skillMd SKILL.md contents
* @param {string|null} skill.openAiYaml agents/openai.yaml contents, or null
* @param {Set<string>} skill.skillNames every skill folder in the kit
* @param {string[]} [skill.strayPaths] empty folders or cache paths inside the skill
*/
export const lintSkill = ({ name, skillMd, openAiYaml, skillNames, strayPaths = [] }) => {
  const findings = [];
  const add = (level, rule, detail = "") => findings.push({ rule, level, detail });

  const parts = splitFrontmatter(skillMd);
  if (!parts) {
    add("error", "missing frontmatter");
    return findings;
  }
  const { frontmatter, body } = parts;

  const declaredName = frontmatterScalar(frontmatter, "name");
  if (declaredName !== name) add("error", "name differs from folder", `got ${declaredName ?? "missing"}`);

  const extraKeys = frontmatterKeys(frontmatter).filter((key) => !ALLOWED_KEYS.has(key));
  const explicitOnly = extraKeys.includes(EXPLICIT_ONLY_KEY) &&
    /allow_implicit_invocation:\s*false/.test(openAiYaml ?? "");
  const unexpected = extraKeys.filter((key) => !(explicitOnly && key === EXPLICIT_ONLY_KEY));
  if (unexpected.length) add("warn", "frontmatter has keys other than name and description", unexpected.join(", "));
  if (extraKeys.includes(EXPLICIT_ONLY_KEY) && !explicitOnly) {
    add("warn", "disable-model-invocation without policy.allow_implicit_invocation: false in openai.yaml");
  }

  const description = frontmatterScalar(frontmatter, "description");
  if (!description) {
    add("error", "missing description");
  } else {
    if (description.length > MAX_DESCRIPTION) add("error", "description over 1024 chars", `${description.length}`);
    else if (description.length > KIT_MAX_DESCRIPTION) add("warn", "description over 400 chars", `${description.length}`);
    if (!/\bUse when\b/.test(description)) add("warn", "description lacks 'Use when'");
    if (/^(use|expert|you are|senior|elite)\b/i.test(description)) {
      add("warn", "description opens with 'Use' or a persona, not a capability", description.split(/[.!?]/)[0]);
    }
    if (PERSONA.test(description)) add("warn", "description has persona text", description.match(PERSONA)[0]);
    if (/\btriggers on\b/i.test(description)) add("warn", "description has a 'Triggers on' keyword list");
    const shout = description.match(SHOUTING);
    if (shout) add("warn", "description uses all-caps emphasis", shout[0]);
    const boundaries = description.match(/\bnot for\b/gi) ?? [];
    if (boundaries.length > 1) add("warn", "description has more than one 'Not for'", `${boundaries.length}`);
    if (boundaries.length) {
      const target = description.match(/\(use ([a-z0-9-]+)\)/);
      if (!target) add("warn", "'Not for' does not name a sibling as (use <skill>)");
      else if (!skillNames.has(target[1])) add("warn", "'Not for' names a missing skill", target[1]);
    }
  }

  const bodyLines = body.split("\n").length;
  if (bodyLines > MAX_BODY_LINES) add("warn", "body over 200 lines", `${bodyLines}`);
  if (CLAUDE_ONLY_BODY.test(body)) add("warn", "body uses Claude Code-only syntax", body.match(CLAUDE_ONLY_BODY)[0]);

  for (const strayPath of strayPaths) add("warn", "empty or cache folder", strayPath);

  if (openAiYaml === null) {
    add("error", "missing agents/openai.yaml");
  } else {
    const shortDescription = yamlValue(openAiYaml, "short_description");
    const [min, max] = SHORT_DESCRIPTION_RANGE;
    if (!shortDescription || shortDescription.length < min || shortDescription.length > max) {
      add("warn", "openai.yaml short_description not 25-64 chars", `${shortDescription?.length ?? "missing"}`);
    }
    const defaultPrompt = yamlValue(openAiYaml, "default_prompt");
    if (!defaultPrompt || !defaultPrompt.includes(`$${name}`) || !/\s/.test(defaultPrompt)) {
      add("warn", "openai.yaml default_prompt is not a sentence mentioning $<name>", defaultPrompt ?? "missing");
    }
    if (/allow_implicit_invocation:\s*true/.test(openAiYaml)) {
      add("warn", "openai.yaml restates allow_implicit_invocation: true");
    }
  }

  return findings;
};
