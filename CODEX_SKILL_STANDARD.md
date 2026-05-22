# 📘 Skill Conversion Guide: Antigravity → OpenAI Codex

> Primary reference: [agentskills.io/specification](https://agentskills.io/specification)

This document is the **single source of truth** for converting skills between the **Google Antigravity** (`.agent/`) ecosystem and **OpenAI Codex** (`.codex/`). All skill conversion work must strictly follow this guide.

---

## 1. Concept Mapping (Antigravity ➜ Codex)

| # | Antigravity | Codex | How to handle during conversion |
|---|:---|:---|:---|
| 1 | Project skill directory: `[project]/.agent/skills/` | `[project]/.codex/skills/` | Change root path. |
| 2 | Global skill directory: `~/.gemini/antigravity/skills/` | `~/.codex/skills/` or `~/.agents/skills/` | Codex scans both. Prefer `~/.agents/skills/` (newer cross-platform standard). |
| 3 | Global Rules: `[project]/.agent/rules/` | Cascading `AGENTS.md` | Create `AGENTS.md` at repo root or subdirectories. Codex inherits from root downward. |
| 4 | Agents (personas): `[project]/.agent/agents/` | **No direct equivalent.** | Embed persona content into `AGENTS.md` or convert to standalone skills. |
| 5 | Workflows (slash commands): `[project]/.agent/workflows/` | **No direct equivalent.** | Convert to standalone skills or embed into `AGENTS.md`. |
| 6 | Frontmatter: `name` | Frontmatter: `name` | **Keep as-is.** Must match directory name, lowercase, hyphen-separated. |
| 7 | Frontmatter: `description` | Frontmatter: `description` | **Merge** `description` + `when_to_use` into a single description ≤ 1024 chars (see Section 3). |
| 8 | Frontmatter: `when_to_use` | ❌ Does not exist in spec | Content gets **merged into `description`**. Remove this field from frontmatter. |
| 9 | Frontmatter: `allowed-tools` | Frontmatter: `allowed-tools` *(experimental)* | **Keep if present**, but note this field is experimental and support varies across agent clients. |
| 10 | `scripts/` directory | `scripts/` directory | Keep structure and content as-is. |
| 11 | Loose `.md` reference files (same level as SKILL.md) | `references/` directory | **Move** supplementary `.md` files (not SKILL.md) into `references/`. Update paths in Content Map. |
| 12 | Cross-skill links: `@[skills/xxx]` | Relative paths or plain text | Replace `@[skills/xxx]` with relative paths or plain text descriptions. |

---

## 2. Standard Codex Skill Directory Structure

```plaintext
skill-name/                       # Directory name = `name` field value
├── SKILL.md                      # [REQUIRED] Metadata + Main instructions
├── agents/                       # [OPTIONAL] Client-specific configuration
│   └── openai.yaml               # UI, policy, and dependency config for Codex
├── scripts/                      # [OPTIONAL] Executable code (Python/Bash)
│   └── validator.py
├── references/                   # [OPTIONAL] Detailed documentation (Progressive Disclosure)
│   ├── rest.md
│   ├── graphql.md
│   └── auth.md
└── assets/                       # [OPTIONAL] Templates, images, data files
```

> **Important note:** Antigravity typically places supplementary `.md` files (e.g., `rest.md`, `auth.md`) at the same level as `SKILL.md`. The Agent Skills standard recommends placing them inside `references/` for better organization and progressive disclosure support.

---

## 3. `SKILL.md` Details — Frontmatter

### 3.1 Frontmatter Fields

| Field | Required? | Constraints | Source when converting |
|:---|:---|:---|:---|
| `name` | ✅ Required | 1–64 chars, lowercase `[a-z0-9-]`, cannot start/end with `-`, no `--`, must match directory name | Take from Antigravity `name` |
| `description` | ✅ Required | 1–1024 chars, **must not be empty** | **Merge** Antigravity `description` + `when_to_use` |
| `license` | Optional | License name or bundled license filename | Add if needed |
| `compatibility` | Optional | ≤ 500 chars, describes environment requirements | Add if skill requires specific packages/tools |
| `metadata` | Optional | Arbitrary key-value map | Add `author`, `version` if needed |
| `allowed-tools` | Optional *(experimental)* | Space-separated string | Keep from Antigravity if present |

### 3.2 Writing Effective Descriptions

This is the **most critical field** — it determines when Codex automatically triggers the skill.

**Principles from [agentskills.io](https://agentskills.io/skill-creation/optimizing-descriptions):**
- Use **imperative phrasing**: "Use this skill when…" instead of "This skill does…"
- Focus on **user intent**, not internal mechanics
- **Explicitly list contexts** where the skill should trigger, including cases where the user doesn't name the domain directly
- Keep it **concise** but comprehensive (≤ 1024 chars)
- Add **NOT for X** boundaries to prevent false triggers

**Conversion example:**
```yaml
# ❌ Antigravity original (2 separate fields)
description: API design principles and decision-making. REST vs GraphQL vs tRPC selection.
when_to_use: "When designing REST/GraphQL/tRPC APIs. NOT for UI/frontend work."

# ✅ Codex (merged into single description)
description: >-
  API design principles and decision-making — REST vs GraphQL vs tRPC selection,
  response formats, versioning, pagination, and authentication patterns.
  Use when designing or reviewing API architecture, defining response formats,
  planning versioning strategy, or selecting authentication patterns.
  NOT for UI/frontend implementation.
```

### 3.3 Frontmatter Template After Conversion

```yaml
---
name: skill-name-here
description: >-
  [What the skill does]. Use when [trigger contexts].
  NOT for [contexts that should NOT trigger].
---
```

---

## 4. `SKILL.md` Details — Body Content

The body contains Markdown instructions. Recommended to keep **under 5000 tokens** (~3000–4000 words).

### 4.1 Body Template

```markdown
# [Friendly Skill Name]

> [One-line description]

## Content Map
| File | Description | When to read |
|:---|:---|:---|
| `references/rest.md` | REST API conventions | When designing REST endpoints |
| `scripts/validate.py` | Validation script | When checking API compliance |

## Instructions
[Step-by-step procedures — favor procedures over declarations]

## Gotchas
[Common pitfalls, edge cases]

## Related Skills
| Skill | When to use |
|:---|:---|
| `database-design` | When designing schemas |
```

### 4.2 Body Writing Principles (from [Best Practices](https://agentskills.io/skill-creation/best-practices))

- **Add what the agent lacks, omit what it already knows.** Don't explain basic concepts.
- **Favor procedures over declarations.** Write reusable processes, not answers to specific tasks.
- **Provide defaults, not menus.** Give one clear default choice; mention alternatives only when necessary.
- **Content Map** links to files in `references/` — the agent reads them only when needed (Progressive Disclosure).
- **Internal links:** Use relative paths like `references/xxx.md` or `scripts/xxx.py`. Do NOT use Antigravity's `@[skills/xxx]` syntax.

---

## 5. `agents/openai.yaml` (Optional — Codex-specific)

This file is **not part of the core Agent Skills standard** — it is a sidecar configuration specific to OpenAI Codex. It controls UI display and invocation policy within Codex.

```yaml
interface:
  display_name: "Display Name"            # Shown in Codex UI
  short_description: "Brief description"   # ≤ 80 chars
  brand_color: "#3B82F6"                   # UI accent color
  default_prompt: "$skill-name"            # Shortcut to invoke skill ($)

policy:
  allow_implicit_invocation: true          # true = Codex auto-triggers when relevant
                                           # false = only triggers when user types $skill-name

# Declare dependencies if the skill requires MCP servers or external tools
dependencies:
  tools:
    - type: "mcp"
      value: "serverName"
      description: "Tool description"
      transport: "streamable_http"
      url: "https://example.com/mcp"
```

> **When to create this file?**
> - Always create it during conversion to ensure the skill displays properly in Codex UI.
> - Set `allow_implicit_invocation: false` for sensitive skills (deploy, database migration…) to prevent unintended triggers.

---

## 6. Step-by-Step Conversion Process (SOP)

### Step 1: Create directories
```bash
mkdir -p templates/.codex/skills/[skill-name]/references
mkdir -p templates/.codex/skills/[skill-name]/agents
```

### Step 2: Copy and reorganize resources
- Copy `SKILL.md` into the new skill directory.
- Copy the `scripts/` directory as-is (if present).
- **Move supplementary `.md` files** (not SKILL.md) into `references/`.
- Copy `templates/`, `assets/` directories as-is (if present).

### Step 3: Normalize `SKILL.md`
- **Merge** `description` + `when_to_use` into a single `description` ≤ 1024 chars.
- **Remove** the `when_to_use` field from frontmatter.
- **Keep or remove** `allowed-tools` as needed (this field is experimental).
- **Update Content Map**: change file paths from `rest.md` to `references/rest.md`.
- **Replace** `@[skills/xxx]` syntax with plain text skill names.

### Step 4: Create `agents/openai.yaml`
- Create the file with `display_name`, `short_description`, `brand_color`, `default_prompt`.
- Set `allow_implicit_invocation` appropriately.

### Step 5: Validate

Final checklist before completing conversion:

- [ ] `name` in frontmatter exactly matches directory name
- [ ] `description` ≤ 1024 chars, fully merged from `description` + `when_to_use`
- [ ] No `when_to_use` field remains in frontmatter
- [ ] Supplementary `.md` files moved into `references/`
- [ ] Content Map in SKILL.md points to correct `references/xxx.md` paths
- [ ] No `@[skills/xxx]` syntax remains — replaced with plain text
- [ ] `agents/openai.yaml` file created
- [ ] SKILL.md body estimated < 5000 tokens

---

## 7. Complete Conversion Example

### Before (Antigravity)
```
templates/.agent/skills/api-patterns/
├── SKILL.md              ← frontmatter has when_to_use, allowed-tools
├── rest.md               ← supplementary file at same level
├── graphql.md
├── auth.md
├── response.md
├── versioning.md
├── rate-limiting.md
├── api-style.md
├── documentation.md
├── security-testing.md
├── trpc.md
└── scripts/
    └── api_validator.py
```

### After (Codex)
```
templates/.codex/skills/api-patterns/
├── SKILL.md              ← frontmatter: only name + description (merged)
├── agents/
│   └── openai.yaml       ← NEW: UI & policy config for Codex
├── references/            ← supplementary files grouped here
│   ├── rest.md
│   ├── graphql.md
│   ├── auth.md
│   ├── response.md
│   ├── versioning.md
│   ├── rate-limiting.md
│   ├── api-style.md
│   ├── documentation.md
│   ├── security-testing.md
│   └── trpc.md
└── scripts/               ← kept as-is
    └── api_validator.py
```
