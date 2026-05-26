---
name: web-design-guidelines
description: >-
  Use when reviewing HTML/CSS elements for accessibility, web interface design audits, or HTML structure.
  Audits UI codebases against Web Interface Guidelines. NOT for implementing new UI features from scratch.
allowed-tools:
  - Read
  - Glob
  - Grep
metadata:
  author: vercel
  version: 1.0.0
  argument-hint: <file-or-pattern>
---

# Web Interface Guidelines

Review files for compliance with Web Interface Guidelines.

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| _No supplementary files_ | Main web interface audit procedures are in this file | Use this file by default |

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| Before coding - learn design principles (color, typography, UX psychology) | [`frontend-design`](../frontend-design/SKILL.md) |
| Expert frontend implementations and frameworks | [`frontend-specialist`](../frontend-specialist/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When reviewing UI files for guidelines compliance, accessibility, or visual structure, strictly follow this step-by-step procedure:

### Step 1: Fetch Latest Guidelines
1. Fetch the latest fresh guidelines from the remote source URL prior to starting the audit:
   `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`
2. Parse the fetched rules and formatting guidelines.

### Step 2: Read Specified Target Files
1. Read the user's provided files or search the codebase for matching UI file patterns (glob/grep).
2. If no files are specified, ask the user to clarify which elements or layout components to audit.

### Step 3: Run Layout & Style Audits
1. Audit HTML, CSS, React components, or style sheets against the fetched rules.
2. Review elements for accessibility features, color contrast compliance, responsive layouts, and proper DOM tag structures.

### Step 4: Output Tersely Formatted Findings
1. Output all findings in the strict, terse format requested by the guidelines:
   `file:line - Description of violation / suggestion`
2. Run the **Quality Audit Checklist** to ensure high-fidelity audits.

---

## Guidelines Source

Fetch fresh guidelines before each review:

```
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

Use WebFetch or standard URL reading tools to retrieve the latest rules. The fetched content contains all the rules and output format instructions.

---

## Usage

When a user provides a file or pattern argument:
1. Fetch guidelines from the source URL above
2. Read the specified files
3. Apply all rules from the fetched guidelines
4. Output findings using the format specified in the guidelines

If no files specified, ask the user which files to review.

---

## Design Workflow

```
1. DESIGN   → Read frontend-design principles
2. CODE     → Implement the design
3. AUDIT    → Run web-design-guidelines review ← YOU ARE HERE
4. FIX      → Address findings from audit
```

---

## ❌ Anti-Patterns

| Don't | Do |
|:---|:---|
| Audit from stale remembered rules | Fetch the latest official guidelines first |
| Review only visual styling | Include accessibility, semantics, and responsive behavior |
| Return broad subjective feedback | Report precise `file:line` findings |
| Audit unspecified files silently | Ask for target files or patterns when missing |

---

## ✅ Quality Audit Checklist

Before concluding a Web Design audit task, verify compliance with the following:

- [ ] **Guidelines Fetched**: Successfully fetched the latest Vercel Web Interface Guidelines from the official raw GitHub source.
- [ ] **Comprehensive File Audit**: Reviewed all target HTML, CSS, React, or UI file formats.
- [ ] **Accessibility (a11y) Checked**: Audited target elements for contrast ratios, aria attributes, alt text presence, and semantic headers.
- [ ] **Format Conformed**: Output matches the strict `file:line` layout format with no extra conversation or conversational filler.
