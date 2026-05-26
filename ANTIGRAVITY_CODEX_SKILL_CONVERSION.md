# 🔄 Antigravity ⬌ Codex Agent Skill Conversion Specification

This document serves as the **single source of truth** for converting agent skills between **Google Antigravity Agent Skills** and **OpenAI Codex Skills**. Use this guide to ensure perfect compatibility, optimized performance, and zero context pollution during migration in either direction.

---

## 1. High-Level Comparison & Concept Mapping

Both standards rely on **Progressive Disclosure** (loading only metadata initially, and fetching the full `SKILL.md` body dynamically when relevant). However, they differ in directory layouts, frontmatter fields, search/activation policies, and supplementary file handling.

### 1.1 Core Similarities & Overlaps
*   **Heart of the Skill:** Both standards require a `SKILL.md` file containing instructions in Markdown and a YAML frontmatter block at the top.
*   **Dual Invocation Modes:** Both support **Implicit Invocation** (automatically triggered by description semantic matching) and **Explicit Invocation** (called by name).
*   **Folder Structure:** Both support executable files under a `scripts/` subfolder and auxiliary templates/assets.
*   **Progressive Disclosure:** Large reference materials are kept separate from the main `SKILL.md` to prevent unnecessary token consumption.

### 1.2 Key Differences

| Feature | Google Antigravity | OpenAI Codex |
| :--- | :--- | :--- |
| **Workspace Dir** | `.agents/skills/` | `.agents/skills/` (scanned recursively from CWD to root) |
| **Global Dir** | `~/.gemini/antigravity/skills/` | `$HOME/.agents/skills/` |
| **Frontmatter `name`**| **Optional** (defaults to folder name if omitted) | **Required** (must match folder name exactly) |
| **Frontmatter `description`**| Written in the **third person**, no strict length limits, focuses on key search terms. | **Unified & Truncation-Optimized** (≤ 1024 chars), strict **100-character front-loading rule**. |
| **Trigger Fields** | `description` only. (No other fields are officially supported). | `description` only. (No other fields are supported). |
| **UI Sidecar** | No sidecar file. All configuration lives in `SKILL.md` frontmatter. | **Required sidecar** `agents/openai.yaml` for UI styling, policy, and MCP tools dependencies. |
| **Documentation** | Supplementary docs placed under `resources/` or `examples/`. | Supplementary docs placed under `references/` and mapped using a formal **Content Map** table. |
| **Cross-Links** | Custom symbol syntax `@[skills/some-skill]`. | Standard relative markdown links or plain-text references. |

---

## 2. Comparison Matrix & Conversion Rules

Use this table to map components during conversion:

| Property / Component | Antigravity Standard | Codex Standard | Conversion Action Required |
| :--- | :--- | :--- | :--- |
| **Skill Name (`name`)** | Optional. Hyphenated, lowercase. | Required. Must match directory exactly. | **Ensure name is explicitly declared and matches folder name exactly.** |
| **Description** | Third-person, search-optimized. | Under 1024 chars, first 100 chars hold critical triggers. | **Front-load triggers (`Use when...`) to first 100 chars.** |
| **Legacy/Custom `when_to_use`**| ❌ **Invalid/Unofficial** (Often misused in legacy templates). | ❌ Unsupported. | **Merge content into `description` (Codex) or move to Markdown body (Antigravity), then delete the field.** |
| **UI Configuration** | ❌ None. | Lives in `agents/openai.yaml` | **Create `agents/openai.yaml` when moving to Codex; delete or ignore when moving to Antigravity.** |
| **Tool/MCP Dependencies**| ❌ None. | Lives in `agents/openai.yaml` under `dependencies.tools`. | **Declare MCP transport and URLs in sidecar for Codex.** |
| **Cross-Skill References**| `@[skills/my-skill]` | Standard Markdown links (e.g. `[My Skill](../my-skill/SKILL.md)`) | **Translate custom `@` syntax to relative links or plain text.** |
| **File Structure Layout** | `scripts/`, `examples/`, `resources/` | `scripts/`, `references/`, `assets/` | **Restructure directories.** Move `resources/` docs to `references/` for Codex. |
| **Content Navigation** | Informal Markdown headers. | Formal **Content Map** table at the top of the body. | **Add `## 📑 Content Map` table for Codex. Convert to headers for Antigravity.** |

---

## 3. SOP A: Converting Antigravity ➜ OpenAI Codex

Follow these steps exactly when migrating a skill from Antigravity to Codex:

### Step 1: Restructure the Directories
Create the Codex directory structure. Move any flat reference markdown files and templates into their correct progressive disclosure folders:
```bash
# 1. Create target Codex folders
mkdir -p agents
mkdir -p references
mkdir -p assets

# 2. Reorganize files
# Move any legacy templates or resource documents to `references/`
mv resources/*.md references/ 2>/dev/null || true
mv *.md references/ 2>/dev/null || true
# Ensure only SKILL.md remains in the root
mv references/SKILL.md ./ 2>/dev/null || true
```

### Step 2: Refactor Frontmatter & Optimize Triggers
Open `SKILL.md` and edit the YAML frontmatter:
1.  Ensure the `name` field is present and matches the folder name exactly (lowercase, hyphens for spaces).
2.  **Clean Legacy Fields:** If the legacy/unofficial `when_to_use` frontmatter field is present in the old skill, combine its value with the `description`.
3.  Rewrite the description so the most important activation statement (e.g., `"Use when [task/context]..."`) fits in the **first 100 characters** (The 100-Character Rule).
4.  Remove the unofficial `when_to_use` field from the frontmatter completely.
5.  Delete any other non-standard YAML frontmatter keys.

*Example Frontmatter Refactor:*
```yaml
---
name: deploy-assistant
description: >-
  Use when deploying services to production, staging, or handling rollbacks.
  Provides step-by-step deployment checklists, shell validation scripts, and container rollback commands.
---
```

### Step 3: Add `agents/openai.yaml` Sidecar Configuration
Create a new file `agents/openai.yaml` with the metadata, display name, and policy constraints:
```yaml
interface:
  display_name: "Deployment Assistant"
  short_description: "Handles staging and production deployment checklists"
  brand_color: "#10B981"
  default_prompt: "$deploy-assistant"

policy:
  allow_implicit_invocation: true
```

### Step 4: Normalize Links & Content Map
1.  Scan the body of `SKILL.md` for any legacy `@[skills/some-skill]` links and replace them with standard relative Markdown paths (e.g., `[Some Skill](../some-skill/SKILL.md)`).
2.  Add a **Content Map** markdown table immediately below the title header. Link all files moved to `references/` relatively:
    ```markdown
    ## 📑 Content Map

    | File | Description | When to Read |
    |:---|:---|:---|
    | `references/rollback-guide.md` | Troubleshooting and rollback SOPs | When a deployment fails |
    ```

---

## 4. SOP B: Converting Codex ➜ Google Antigravity

Follow these steps when migrating a skill from Codex to Antigravity:

### Step 1: Adjust Directory Layout
Ensure the skill is placed in either `<workspace>/.agents/skills/` or `~/.gemini/antigravity/skills/`. Reorganize the folder structure:
```bash
# 1. Ensure resources/ and examples/ exist if needed
mkdir -p resources
mkdir -p examples

# 2. Move files from references/ to resources/
mv references/* resources/ 2>/dev/null || true
rmdir references 2>/dev/null || true

# 3. Safe cleanup: openai.yaml is not used by Antigravity
rm -rf agents/ 2>/dev/null || true
```

### Step 2: Refactor Frontmatter
Open `SKILL.md` and adjust the frontmatter:
1.  **Name:** You can keep the `name` as-is. (Antigravity will default to the folder name if it is removed, but keeping it is recommended for clarity).
2.  **Description:** Ensure it is written in the **third person** and incorporates relevant keywords so the Gemini-based Antigravity agent can scan it effectively.
3.  **When to use:** Place all specific trigger statements directly inside the Markdown body under the standard header `## When to use this skill`. Do not put them in the YAML frontmatter since Antigravity does not officially support custom fields like `when_to_use` in YAML.

*Example Frontmatter & Body Refactor:*
```yaml
---
name: deploy-assistant
description: Assists developers with deployment workflows and container rollbacks.
---

# Deploy Assistant Skill

## When to use this skill

* Use when deploying services to production, staging, or handling rollbacks.
```

### Step 3: Restructure Body Content
Format the body of `SKILL.md` to match the standard Antigravity structure. Ensure it includes clear `## When to use this skill` and `## How to use it` markdown headers.
1.  Move trigger statements from the Content Map or description into a bulleted list under `## When to use this skill`.
2.  Rewrite references to point to `resources/` instead of `references/`.
3.  Convert the Content Map table into straightforward instruction guides or standard relative links.

---

## 5. Conversion Validation Checklist (For the AI Agent)

When asked to convert a skill, run this quick audit before declaring success:

*   [ ] **Correct Path Check:** Is the converted skill placed in the correct target folder structure?
*   [ ] **Frontmatter Compliance:**
    *   *Codex target:* `name` matches folder, `description` <= 1024 chars, no `when_to_use` field, triggers in first 100 characters.
    *   *Antigravity target:* Description written in third-person, includes robust search keywords.
*   [ ] **Link Integrity:** Checked that all legacy `@` links or relative markdown links are resolved and valid.
*   [ ] **Sidecar Status:**
    *   *Codex target:* `agents/openai.yaml` exists, is valid YAML, and matches the skill metadata.
    *   *Antigravity target:* Cleaned up or ignored `agents/openai.yaml`.
*   [ ] **Progressive Disclosure:** Auxiliary documents correctly grouped under `references/` (Codex) or `resources/` (Antigravity).
