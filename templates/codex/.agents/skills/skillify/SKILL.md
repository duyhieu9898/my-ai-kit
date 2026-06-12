---
name: skillify
description: >-
  Use when the user requests 'make this a skill' or when a repetitive pattern warrants extraction.
  Auto-creates new skills from repetitive workflows.
  NOT for one-off tasks.
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
---

# Skillify — Auto-Create Skills from Workflows

> Turn repetitive patterns into reusable skills. If you've done it three times, it should be a skill.

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| _No supplementary files_ | Main skill extraction procedures are in this file | Use this file by default |

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| Orchestrating multi-agent plans | [`project-planner`](../project-planner/SKILL.md) |
| Writing atomic verifiable plans | [`plan-writing`](../plan-writing/SKILL.md) |
| Compressing context states | [`context-compression`](../context-compression/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When tasked with extracting repetitive developer workflows into reusable skills, strictly follow this step-by-step procedure:

### Step 1: Detect Workflow Patterns
1. Audit conversation logs or task histories to detect repetitive developer actions (requested 3+ times, involving 5+ steps).
2. Confirm the extraction is a good candidate (reusable across multiple projects, not covered by existing templates).

### Step 2: Establish the Skill Directory & Description
1. Determine a clear, action-based, tool-based, or domain-based name (2-3 words, kebab-case).
2. Formulate the `Use when...` trigger description starting within the first 100 characters.

### Step 3: Write the SKILL.md Template
1. Create the `SKILL.md` inside `.agents/skills/[skill-name]/` using the standard format.
2. Ensure you list: Frontmatter with YAML array `allowed-tools`, Content Map, Related Skills table, 5-step actionable Procedures, and a dedicated **Quality Audit Checklist** verifying task outcomes.

### Step 4: Add OpenAI config Sidecar
1. Configure `agents/openai.yaml` inside the skill directory.
2. Map the display parameters, description, brand color, and implicit policy triggers.

### Step 5: Verify and Register Compliance
1. Run lint checks and verify Markdown relative hyperlinking.
2. Confirm overall compliance against the **Quality Audit Checklist** before completing.

---

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

## ❌ Anti-Patterns

- Creating a skill for a one-off task that should be handled directly.
- Duplicating an existing skill instead of linking or extending it.
- Writing vague descriptions that do not start with a concrete `Use when` trigger.
- Omitting sidecar metadata or required body sections from the generated skill.

---

## ✅ Quality Audit Checklist

Before concluding a skill extraction or auto-creation task, verify compliance with the following:

- [ ] **Folder Match name**: Directory name exactly matches frontmatter `name` value in kebab-case.
- [ ] **First-line Trigger Bind**: The description field starts with a clean "Use when..." condition under 100 characters.
- [ ] **Unified Content Map**: The generated skill file includes a relative Markdown links content table.
- [ ] **Actionable Procedures Built**: Unified static directives into a sequential 5-step procedures pipeline.
- [ ] **Checklist Incorporated**: Appended a dedicated `Quality Audit Checklist` validating the new skill behaviors.
- [ ] **OpenAI Config Verified**: Created a matching `agents/openai.yaml` with implicit options configured.
