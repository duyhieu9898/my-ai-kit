# 🚀 Antigravity Agent Skill Quality & Structure Specification

This document is the **single source of truth** for defining, creating, reviewing, and auditing **Google Antigravity Agent Skills**. All skills designed for the Antigravity ecosystem must strictly adhere to this standard.

---

## 1. Overview & Core Concepts

### 1.1 What are Agent Skills?
Antigravity Agent Skills are reusable, modular packages of domain knowledge and capabilities that extend what the agent can do. By packaging task-specific instructions, best practices, and companion assets, they allow the agent to execute complex workflows reliably.

Each skill contains:
*   **Procedures:** Step-by-step guidance, conventions, and patterns for specific tasks.
*   **Best Practices:** Guidelines and pitfalls to watch out for.
*   **Optional Code/Assets:** Companion scripts, reference examples, and templates.

### 1.2 Progressive Disclosure Pattern
To manage large context sizes efficiently, Antigravity uses a **Progressive Disclosure** pattern:
1.  **Discovery:** When a new conversation begins, the agent is presented with a lightweight index of all available skills (names and descriptions only).
2.  **Activation:** The agent monitors the conversation context. If a skill's description matches the user's task or if the user explicitly mentions the skill by name, the agent automatically reads the full `SKILL.md` instructions.
3.  **Execution:** The agent follows the loaded instructions step-by-step to complete the task.

---

## 2. Where Skills Live (Scopes)

Antigravity supports two scopes of skills: workspace-specific (team/project scoped) and global (user scoped).

| Scope | Directory Path | Purpose & Best Practices |
| :--- | :--- | :--- |
| **Workspace-specific** | `<workspace-root>/.agents/skills/[skill-folder]/` | Project-specific workflows, team deployment guides, repository-specific testing patterns, etc. |
| **Global (All Workspaces)** | `~/.gemini/antigravity/skills/[skill-folder]/` | Personal utility scripts, general-purpose programming guidelines, or global productivity tools. |

> [!NOTE]
> Antigravity now defaults to scanning `.agents/skills/`, but it maintains full **backward compatibility** with the legacy `.agent/skills/` directory.

---

## 3. Skill Folder Structure

While `SKILL.md` is the only strictly required file, a complete skill is best structured as a self-contained folder to separate instructions, executable scripts, and templates:

```plaintext
my-skill/
├── SKILL.md            # [REQUIRED] Main instructions and frontmatter metadata
├── scripts/            # [OPTIONAL] Helper/automation scripts executable by the agent
│   └── helper.sh
├── examples/           # [OPTIONAL] Reference implementations or "golden" code samples
│   └── standard_code.py
└── resources/          # [OPTIONAL] Markdown templates, static configuration schemas, or assets
    └── PR_TEMPLATE.md
```

The agent is aware of this directory structure and can read supplementary files in `scripts/`, `examples/`, or `resources/` dynamically when following the `SKILL.md` instructions.

---

## 4. `SKILL.md` Frontmatter Specification

Every skill must start with a YAML frontmatter block enclosed in triple-dashes (`---`). The frontmatter controls how the agent discovers and selects the skill.

### 4.1 Frontmatter Fields

| Field | Required? | Constraints / Format | Description |
|:---|:---|:---|:---|
| `name` | Optional | Lowercase, alphanumeric, hyphens for spaces (e.g., `code-review`). | A unique identifier for the skill. **Defaults to the folder name** if omitted. |
| `description` | ✅ Required | 1–1024 characters. Write in the **third person**. | Clear description of what the skill does and when the agent should trigger it. |

### 4.2 Description Trigger Optimization (Keywords & Style)
Because the description is the sole driver for implicit activation, follow these guidelines:
*   **Third-Person Action Verbs:** Start descriptions with active, third-person verbs (e.g., `"Reviews...", "Generates...", "Automates..."`).
*   **Explicit Context Triggers:** State clearly when the skill is relevant. Include terms like *"Use when..."* or *"Use to..."*.
*   **Keyword Optimization:** Include specific libraries, frameworks, or domain terms the agent is likely to find in user prompts (e.g., use words like `"pytest"`, `"React"`, or `"git"` to guarantee accurate matching).

*Example Description:*
```yaml
---
name: python-testing
description: Generates unit tests for Python code using pytest conventions. Use when writing, debugging, or reviewing Python test cases.
---
```

---

## 5. `SKILL.md` Body Content & Templates

The body of the `SKILL.md` file contains the step-by-step guidance. Use clean Markdown structure so the agent can scan and digest the contents instantly.

### 5.1 Standard Template

```markdown
# [Friendly Skill Title]

[A brief, one or two-sentence summary of what the skill helps achieve.]

## When to use this skill

- Use this when [Context 1, e.g., writing new React components].
- Use this when [Context 2, e.g., refactoring state management].
- This is helpful for [Goal, e.g., ensuring consistent tailwind configurations].

## How to use it

[Provide step-by-step procedures, conventions, and rules here. Keep steps clear and actionable.]

1. **Step One:** [Action details...]
2. **Step Two:** [Action details...]

### 🛠️ Decision Trees (For complex workflows)
If [Condition A], then:
* [Action A1]
* [Action A2]

If [Condition B], then:
* [Action B1]
```

---

## 6. Best Practices & Quality Guidelines

To ensure skills are highly effective and performant, apply the following design principles:

### 6.1 Keep Skills Focused (Single Responsibility)
*   Avoid creating monolithic "do-everything" skills (e.g., `web-development`).
*   Instead, break them down into focused, single-purpose skills (e.g., `react-components`, `css-styling`, `jest-testing`).

### 6.2 Executable Scripts as Black Boxes
*   If your skill utilizes helper scripts inside the `scripts/` folder, do not instruct the agent to read or modify the source code of those scripts.
*   Instead, instruct the agent to run them with the `--help` flag first to discover usage options, treating the script as a robust black box.
*   *Example instruction:* `"Run scripts/validate.sh --help to view arguments before executing."`

### 6.3 Clear Input/Output Expectation
*   State exactly what the skill expects as inputs (e.g., a file path, a git diff, a JSON schema) and what the output must be (e.g., a specific pull request comment format, a new test file).

---

## 7. Audit & Refactoring Checklist

Use this checklist to verify an Antigravity Skill's quality before finalizing or during refactoring:

* [ ] **Folder Naming:** Matches the frontmatter `name` (or provides a clean, lowercase hyphenated name if the field is omitted).
* [ ] **Required Frontmatter:** The `description` is present, written in the third person, and contains strong trigger keywords.
* [ ] **Correct Paths:** The skill is placed in either `.agents/skills/` (recommended) or global `~/.gemini/antigravity/skills/`.
* [ ] **Backward Compatibility:** Checked that legacy `.agent/skills/` directories are supported or gracefully migrated.
* [ ] **Well-Defined Boundaries:** Under `When to use this skill`, both positive usage cases and out-of-scope boundaries are defined.
* [ ] **Executable Safety:** All scripts in `scripts/` have executable permissions and are documented to run with `--help` first.
* [ ] **Clean Markdown:** Contains no broken links, and uses clear bolding, headers, and bulleted lists for maximum readability.
