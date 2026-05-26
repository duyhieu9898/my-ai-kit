---
name: documentation-templates
description: >-
  Use when writing project READMEs, documenting API endpoints, structuring developer manuals, commenting code, or configuring llms.txt.
  Standard structures and templates for READMEs, APIs, JSDoc comments, Changelogs, and ADRs.
  NOT for general writing tasks unrelated to software development.
allowed-tools:
  - Read
  - Glob
  - Grep
---

# Documentation Templates

> Templates and structure guidelines for common documentation types.

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| No supplementary files | This skill is self-contained | Use the procedures below directly |

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| Technical copywriting and writing style guides | [`documentation-writer`](../documentation-writer/SKILL.md) |
| Standardizing step-by-step engineering plans | [`plan-writing`](../plan-writing/SKILL.md) |
| Architecture Decision Records | [`architecture`](../architecture/SKILL.md) |
| API documentation accuracy | [`api-patterns`](../api-patterns/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When tasked with generating technical manuals, API specs, or code commentary guides, strictly follow this step-by-step procedure:

### Step 1: Query Document Objectives
1. Define the required document profile (README, API endpoints spec, JSDoc/TSDoc blocks, Changelogs, ADRs, or `llms.txt`).
2. Identify target readers.

### Step 2: Load the Targeted Template
1. Fetch the corresponding template structure from this standard.
2. Maintain standard section hierarchies.

### Step 3: Populate Real Parameters
1. Replace all mock template values with active system properties (e.g. genuine port numbers, environment variables tables, tested quick start scripts).
2. Avoid leaving any empty placeholders.

### Step 4: Enhance with Visual Schemas
1. Inject clean JSON/YAML data blocks representing request payloads.
2. Build Mermaid flow diagrams to explain complex operational loops.

### Step 5: Verify AI crawler readiness & checklist
1. Structure directories to expose clean `llms.txt` entry points.
2. Confirm compliance against the **Quality Audit Checklist** before completing.

---

## 1. README Structure

### Essential Sections (Priority Order)

| Section | Purpose |
|---------|---------|
| **Title + One-liner** | What is this? |
| **Quick Start** | Running in <5 min |
| **Features** | What can I do? |
| **Configuration** | How to customize |
| **API Reference** | Link to detailed docs |
| **Contributing** | How to help |
| **License** | Legal |

### README Template

```markdown
# Project Name

Brief one-line description.

## Quick Start

[Minimum steps to run]

## Features

- Feature 1
- Feature 2

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |

## Documentation

- [API Reference](./docs/api.md)
- [Architecture](./docs/architecture.md)

## License

MIT
```

---

## 2. API Documentation Structure

### Per-Endpoint Template

```markdown
## GET /users/:id

Get a user by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | User ID |

**Response:**
- 200: User object
- 404: User not found

**Example:**
[Request and response example]
```

---

## 3. Code Comment Guidelines

### JSDoc/TSDoc Template

```typescript
/**
 * Brief description of what the function does.
 * 
 * @param paramName - Description of parameter
 * @returns Description of return value
 * @throws ErrorType - When this error occurs
 * 
 * @example
 * const result = functionName(input);
 */
```

### When to Comment

| ✅ Comment | ❌ Don't Comment |
|-----------|-----------------|
| Why (business logic) | What (obvious) |
| Complex algorithms | Every line |
| Non-obvious behavior | Self-explanatory code |
| API contracts | Implementation details |

---

## 4. Changelog Template (Keep a Changelog)

```markdown
# Changelog

## [Unreleased]
### Added
- New feature

## [1.0.0] - 2025-01-01
### Added
- Initial release
### Changed
- Updated dependency
### Fixed
- Bug fix
```

---

## 5. Architecture Decision Record (ADR)

```markdown
# ADR-001: [Title]

## Status
Accepted / Deprecated / Superseded

## Context
Why are we making this decision?

## Decision
What did we decide?

## Consequences
What are the trade-offs?
```

---

## 6. AI-Friendly Documentation (2025)

### llms.txt Template

For AI crawlers and agents:

```markdown
# Project Name
> One-line objective.

## Core Files
- [src/index.ts]: Main entry
- [src/api/]: API routes
- [docs/]: Documentation

## Key Concepts
- Concept 1: Brief explanation
- Concept 2: Brief explanation
```

### MCP-Ready Documentation

For RAG indexing:
- Clear H1-H3 hierarchy
- JSON/YAML examples for data structures
- Mermaid diagrams for flows
- Self-contained sections

---

## ❌ Anti-Patterns

- Leave bracketed placeholders or fake example values in generated docs.
- Document APIs or commands without verifying current names, paths, ports, or schemas.
- Mix README, API reference, ADR, and changelog content without clear section boundaries.
- Add obvious code comments that repeat implementation details instead of explaining intent.
- Create `llms.txt` entries with stale or broken relative links.

---

## ✅ Quality Audit Checklist

Before concluding a documentation writing, README generation, or JSDoc/TSDoc API comments task, verify compliance with the following:

- [ ] **Templates Selected**: Leveraged standard structures (ADR/Changelog/README) aligning with the requested document type.
- [ ] **No Placeholders Left**: Substituted all bracketed placeholders `[...]` with active project details.
- [ ] **Executable Examples Provided**: Confirmed request/response schemas and code examples are syntactically valid and current.
- [ ] **Scannability Rules Applied**: Checked for single H1 per page, clear H2/H3 levels, and markdown formatting wrappers.
- [ ] **AI Crawler Indexable**: Confirmed `llms.txt` references contain correct relative links and brief description summaries.

---

## 7. Structure Principles

| Principle | Why |
|-----------|-----|
| **Scannable** | Headers, lists, tables |
| **Examples first** | Show, don't just tell |
| **Progressive detail** | Simple → Complex |
| **Up to date** | Outdated = misleading |

---

> **Remember:** Templates are starting points. Adapt to your project's needs.
