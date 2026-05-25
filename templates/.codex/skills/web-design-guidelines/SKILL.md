---
name: web-design-guidelines
description: >-
  Use when reviewing HTML/CSS elements for accessibility, web interface design audits, or HTML structure.
  Audits UI codebases against Web Interface Guidelines.
allowed-tools: Read Glob Grep
metadata:
  author: vercel
  version: 1.0.0
  argument-hint: <file-or-pattern>
---

# Web Interface Guidelines


> Strategic guidelines and procedures for the Web Design Guidelines capability in this repository.

## 📑 Content Map

| File / Resource | Description | When to Read |
|:---|:---|:---|
| `SKILL.md` | Core guidelines, procedures, and best practices | Active throughout task execution |
| `agents/openai.yaml` | Codex UI and implicit invocation policy configuration | During skill indexing or UI setup |

## 🔗 Related Skills

| Skill | Relationship | When to Collaborate |
|:---|:---|:---|
| `frontend-specialist` | Parent Persona | For complete UX/UI and component architectural changes |
| `clean-code` | Quality Foundation | To ensure strict clean code, typing, and safety standards |


Review files for compliance with Web Interface Guidelines.

## How It Works

1. Fetch the latest guidelines from the source URL below
2. Read the specified files (or prompt user for files/pattern)
3. Check against all rules in the fetched guidelines
4. Output findings in the terse `file:line` format

## Guidelines Source

Fetch fresh guidelines before each review:

```
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

Use WebFetch or standard URL reading tools to retrieve the latest rules. The fetched content contains all the rules and output format instructions.

## Usage

When a user provides a file or pattern argument:
1. Fetch guidelines from the source URL above
2. Read the specified files
3. Apply all rules from the fetched guidelines
4. Output findings using the format specified in the guidelines

If no files specified, ask the user which files to review.

---

## Related Skills

| Skill | When to Use |
|-------|-------------|
| `frontend-design` | Before coding - Learn design principles (color, typography, UX psychology) |
| `web-design-guidelines` (this) | After coding - Audit for accessibility, performance, and best practices |

## Design Workflow

```
1. DESIGN   → Read frontend-design principles
2. CODE     → Implement the design
3. AUDIT    → Run web-design-guidelines review ← YOU ARE HERE
4. FIX      → Address findings from audit
```
