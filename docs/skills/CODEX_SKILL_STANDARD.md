# 📘 Codex Skill Quality & Integration Specification

> Primary references: [agentskills.io](https://agentskills.io) & [agentskills.io/specification](https://agentskills.io/specification)

This document is the **single source of truth** for defining, reviewing, integrating, and auditing **OpenAI Codex Skills** (`.agents/skills/`). All skills in this repository must strictly adhere to this quality standard.

---

## 1. Overview & Core Concepts

### 1.1 What are Agent Skills?
Agent skills extend Codex with task-specific capabilities by packaging instructions, resources, and optional executable scripts. This allows Codex to follow complex workflows reliably.
* **Progressive Disclosure:** Codex manages context efficiently. It initially loads only the skill's name, description, and file path. The full `SKILL.md` instructions are parsed *only* when Codex decides to use that specific skill.
* **Prompt Budgeting:** To avoid crowding out the prompt context, the initial list of available skills in the context window is capped at roughly **2%** (or **8,000 characters** if the context window limit is unknown). If many skills are installed, Codex will prioritize shorter descriptions first, and may omit some skills if they exceed the budget.

### 1.2 How Codex Invokes Skills
Codex can activate skills in two ways:
1. **Explicit Invocation:** The user mentions the skill directly in the prompt. In the Codex CLI or IDE extension, you can type `/skills` or use the `$` symbol prefix (e.g., `$skill-name`).
2. **Implicit Invocation:** Codex automatically selects and loads a skill when the user's task matches the skill's frontmatter `description`.

---

## 2. Directory Structure

Every skill must be packaged as an independent directory named after the skill. The folder structure supports progressive disclosure by separating high-level procedures from heavy documentation and scripts.

```plaintext
my-skill/                        # Directory name matches frontmatter `name`
├── SKILL.md                     # [REQUIRED] Main instructions + frontmatter metadata
├── agents/                      # [OPTIONAL] Integration-specific settings
│   └── openai.yaml              # Codex UI, execution policies & MCP dependencies
├── scripts/                     # [OPTIONAL] Executable files (Python/Bash/Node)
│   └── validator.py
├── references/                  # [OPTIONAL] In-depth documentation (Progressive Disclosure)
│   ├── api-style.md
│   └── rest.md
└── assets/                      # [OPTIONAL] Static assets (templates, icons, schemas)
```

---

## 3. Skill Lifecycle & CLI Operations

Codex provides built-in tools to author, discover, install, and manage skills locally.

### 3.1 Creating a Skill
You can generate a skill interactively using the built-in CLI assistant:
```bash
$skill-creator
```
The creator will ask:
* What the skill does (for the description).
* When it should trigger.
* Whether it should be instruction-only (default) or include executable scripts.

Alternatively, you can manually create a skill folder with a compliant `SKILL.md` file containing valid frontmatter. Codex automatically detects local skill changes. If an update does not appear, restart Codex.

### 3.2 Installing Curated Skills
To install pre-built or community-curated skills into your workspace, use `$skill-installer`:
```bash
# Example: Installing the Linear integration skill
$skill-installer linear
```
You can also prompt the installer to download skills directly from external Git repositories.

### 3.3 Enabling and Disabling Skills
You can temporarily disable any skill without deleting its source folder by using the `[[skills.config]]` entry in `~/.codex/config.toml`:
```toml
[[skills.config]]
path = "/path/to/skill/SKILL.md"
enabled = false
```
*Note: Restart Codex after saving changes to `~/.codex/config.toml`.*

---

## 4. Skill Scopes & Discovery Locations

Codex scans multiple directories to discover skills. In repositories, it scans `.agents/skills` starting from your current working directory (CWD) up to the repository root. If two skills share the exact same `name`, both will be presented as options in skill selectors (they do not merge).

| Skill Scope | Discovery Directory | Suggested Use Cases |
| :--- | :--- | :--- |
| **`REPO` (Local CWD)** | `$CWD/.agents/skills` | Skills checked into a specific sub-folder, microservice, or module. Only active when launched in that folder. |
| **`REPO` (Parent)** | `$CWD/../.agents/skills` | Skills shared across nested workspaces inside a Git repository. |
| **`REPO` (Top-level)**| `$REPO_ROOT/.agents/skills` | Topmost repository root folder. Available to all sub-folders and team members working in the repository. |
| **`USER`** | `$HOME/.agents/skills` | Personal skills curated by the user, applying globally to any repository they open. |
| **`ADMIN`** | `/etc/codex/skills` | Default system/admin skills shared across containers or multi-user workstations. Great for platform SDKs. |
| **`SYSTEM`** | Bundled with Codex | Built-in utility skills (e.g., `skill-creator`, `plan`) available to all users by default. |

*Note: Codex supports symlinked skill folders and will follow the symlink target when scanning these locations.*

---

## 5. `SKILL.md` Frontmatter Specification

The frontmatter controls how Codex discovers and triggers the skill.

### 5.1 Frontmatter Fields

| Field | Required? | Constraints | Description |
|:---|:---|:---|:---|
| `name` | ✅ Required | 1–64 characters, lowercase `[a-z0-9-]`, no consecutive hyphens, cannot start/end with a hyphen. Must exactly match the directory name. | Unique identifier for the skill. |
| `description` | ✅ Required | 1–1024 characters. **Must not be empty.** | Primary text used by Codex to dynamically trigger the skill. |
| `compatibility` | Optional | ≤ 500 characters. | Describes package or environment dependencies. |
| `allowed-tools` | Optional | List of tools the skill is permitted to run. | Experimental tool constraint field. |
| `metadata` | Optional | Arbitrary key-value map. | For tracking `author`, `version`, or `created_at`. |

### 5.2 Trigger Optimization (The Front-Loading Rules)
Because Codex trims and truncates skill lists in high-density environments to save prompt tokens, you must optimize the frontmatter `description` for implicit triggers:

* **Imperative Triggers First:** Front-load the description with active phrases stating **exactly when to trigger the skill** (e.g., `"Use when [context]..."` or `"Use for [task]..."`).
* **The 100-Character Rule:** Place the most critical keywords, triggers, and primary use cases in the **first 100 characters** so trigger detection works even if the description is truncated.
* **Avoid Declarative Introductions:** Do not start with generic intros like *"This skill represents..."* or *"A collection of guidelines for..."*.
* **Specify Boundaries:** Clearly outline negative bounds (e.g., `"NOT for Windows environments."` or `"NOT for making small, single-file edits."`) to avoid false positive triggers.

### 5.3 Frontmatter Template
```yaml
---
name: my-skill-name
description: >-
  Use when [primary contexts, tasks, or goals]. Contains [short list of main features].
  NOT for [negative bounds or out-of-scope scenarios].
---
```

---

## 6. `SKILL.md` Body Content & Formatting

Keep the total file footprint concise (recommended size **under 5000 tokens** / ~3000-4000 words).

### 6.1 Content Principles
* **Favor Procedures over Declarations:** Write instructions as step-by-step processes or decision trees, not static information.
* **Provide Defaults, not Menus:** Do not present a long list of choices. Give one solid default action and mention alternatives only when necessary.
* **Progressive Disclosure:** Do not inline massive guides. Place large reference articles in `references/` and link to them using the **Content Map**.

### 6.2 Content Map Format
Place a Content Map table at the top of the body listing supplementary files so the agent only reads them when relevant:
```markdown
## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| `references/rest.md` | REST conventions and status codes | When designing REST endpoints |
| `references/graphql.md` | Schema design & query security | When designing GraphQL services |
```

### 6.3 Body Template
```markdown
# [Friendly Skill Title]

> [Short, single-sentence summary of utility.]

## 📑 Content Map
[Table of references, scripts, or assets with relative markdown links]

## 🔗 Related Skills
[Table linking related skills for cross-collaboration]

## 🛠️ Instructions / Procedures
[Step-by-step workflow procedures]

## ❌ Anti-Patterns
[List of actions or patterns to avoid]

## ✅ Quality Audit Checklist
[A self-verification checklist for the agent before completing tasks]
```

---

## 7. Metadata Sidecar Config (`agents/openai.yaml`)

This file configures Codex UI presentation, invocation policies, and declares external tool dependencies (e.g., Model Context Protocol / MCP integrations).

```yaml
interface:
  display_name: "Skill Display Name"      # Title shown in Codex UI
  short_description: "Concise info"       # Short description ≤ 80 chars
  icon_small: "./assets/icon-small.svg"   # Icon for lists (SVG format preferred)
  icon_large: "./assets/icon-large.png"   # Icon for detailed UI views
  brand_color: "#3B82F6"                  # Theme accent color
  default_prompt: "$skill-name"            # Command shorthand to invoke explicitly

policy:
  allow_implicit_invocation: true          # true = auto-triggers based on frontmatter description
                                           # false = only runs when user types $skill-name or mentions explicitly

dependencies:
  tools:
    - type: "mcp"
      value: "openaiDeveloperDocs"
      description: "OpenAI Docs MCP server"
      transport: "streamable_http"
      url: "https://developers.openai.com/mcp"
```

---

## 8. Audit & Refactoring Checklist

Use this checklist during code reviews, audits, or refactoring tasks to verify a skill's compliance:

* [ ] **Directory Name:** Matches the frontmatter `name` field exactly.
* [ ] **Description Triggers:** Frontmatter `description` places `Use when...`/`Use for...` triggers inside the first 100 characters.
* [ ] **Legacy Fields:** No `when_to_use` field exists in the frontmatter.
* [ ] **Linked Files Location:** All supplementary files reside inside the `references/` folder.
* [ ] **Content Map Links:** Paths in Content Map point correctly to `references/some-file.md` using relative Markdown links.
* [ ] **Cross-References:** No obsolete `@[skills/xxx]` syntax remains. Link relatively or write in plain text.
* [ ] **OpenAI Sidecar:** The `agents/openai.yaml` sidecar is present, well-formatted, and matches the directory `name` and metadata.
* [ ] **Token Footprint:** Body content size is under 5000 tokens (~3000-4000 words).
