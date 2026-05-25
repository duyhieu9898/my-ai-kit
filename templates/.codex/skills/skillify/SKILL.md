---
name: skillify
description: >-
  Use when the user requests 'make this a skill' or when a repetitive pattern warrants extraction.
  Auto-creates new skills from repetitive workflows.
  NOT for one-off tasks.
allowed-tools: Read Write Glob Grep
---

# Skillify — Auto-Create Skills from Workflows

> Turn repetitive patterns into reusable skills. If you've done it three times, it should be a skill.

## When to Use

✅ **Good candidates:**
- You've seen the user ask for the same type of work 3+ times
- A workflow involves 5+ consistent steps
- The pattern works across different projects
- Other agents could benefit from this knowledge

❌ **Bad candidates:**
- One-off tasks (just do them)
- Project-specific hacks (use memory instead)
- Already covered by existing skills (check first)

---

## Skill Creation Protocol

### Step 1: Identify the Pattern
```
What triggers this workflow? (user says X, file type Y, domain Z)
What steps are always the same?
What parts vary between uses?
What's the expected output?
```

### Step 2: Generate SKILL.md and openai.yaml

Use this template for `SKILL.md`:

```markdown
---
name: [kebab-case-name]
description: >-
  [Imperative "Use when..." description merging triggering intent and scope limits,
  under 1024 characters.]
allowed-tools: [Read Write Edit Grep Glob - space-separated]
---

# [Skill Name] — [Short Subtitle]

> [One-line philosophy or principle]

## 📑 Content Map

| File | Description | When to Read |
|------|-------------|--------------|
| `references/[name].md` | [Reference description] | [Trigger for reading] |

## Overview
[2-3 sentences explaining what this skill enables]

## Protocol
### Step 1: [First Action]
[Instructions]

### Step 2: [Second Action]
[Instructions]

### Step N: [Verification]
[How to verify the skill worked correctly]

## Best Practices
[3-5 key rules]
```

And use this template for `agents/openai.yaml`:

```yaml
interface:
  display_name: "[Display Name]"
  short_description: "[Brief UI description]"
  brand_color: "[Accent hex/HSL color]"
  default_prompt: "$[kebab-case-name]"

policy:
  allow_implicit_invocation: [true | false]
```

### Step 3: Place the Skill
```
.codex/skills/[skill-name]/SKILL.md
.codex/skills/[skill-name]/agents/openai.yaml
```

### Step 4: Verify
- [ ] Frontmatter has all required fields (name, description, allowed-tools)
- [ ] `description` clearly defines triggers AND exclusions
- [ ] `openai.yaml` exists with interface and policy parameters
- [ ] Steps are actionable, not vague
- [ ] Skill doesn't duplicate an existing one

---

## Naming Conventions

| Pattern | Skill Name | Example |
|---|---|---|
| Action-based | `[verb]-[noun]` | `verify-changes`, `batch-operations` |
| Domain-based | `[domain]-[aspect]` | `database-design`, `api-patterns` |
| Tool-based | `[tool]-patterns` | `tailwind-patterns`, `prisma-expert` |

**Rules:**
- kebab-case only
- 2-3 words maximum
- Descriptive, not clever
- No abbreviations unless universally known

---

## Quality Checklist

Before finalizing a new skill:

| Check | Criteria |
|---|---|
| **Uniqueness** | No existing skill covers this (grep `.codex/skills/`) |
| **Reusability** | Useful across multiple projects, not just one |
| **Completeness** | Has overview, when to use, protocol, verification |
| **Frontmatter** | All required fields present and accurate |
| **Clarity** | A new agent could follow these instructions cold |
