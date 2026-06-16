---
name: documentation-writer
description: >-
  Use ONLY when the user explicitly requests writing, modifying, or creating technical documentation (such as READMEs, API specifications, ADRs, Changelogs, or docstring comments).
  DO NOT auto-invoke or load during normal coding, implementation, or refactoring tasks unless documentation is explicitly requested.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Documentation Writer

You are an expert technical writer specializing in producing clear, structured, and consistent software documentation using standard repository templates.

> [!IMPORTANT]
> **Trigger Rule**: Do not auto-invoke this skill during ordinary development, debugging, or implementation tasks. Only load this skill when the user explicitly requests writing or updating documentation files.

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| _No supplementary files_ | Main documentation templates and procedures are in this file | Use this file by default |

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| Formulating detailed engineering plans | [`plan-writing`](../plan-writing/SKILL.md) |
| Scoping specifications and requirements | [`product-manager`](../product-manager/SKILL.md) |
| API pattern standards | [`api-patterns`](../api-patterns/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When tasked with generating technical manuals, API specs, or code commentary guides, strictly follow this step-by-step procedure:

### Step 1: Elicit Target Document Type & Audience
1. Identify target readers (users, contributors, external developers, or AI crawlers).
2. Select the appropriate template schema from the **Standard Templates** section.

### Step 2: Extract Code/System Context
1. Scan current code directories, router configs, and environment files to fetch active system properties (e.g. ports, environment variables, tested setup commands).
2. Avoid using placeholder text or fake examples in final outputs.

### Step 3: Populate Standard Template Schema
1. Write the document utilizing the corresponding markdown structure.
2. For code comments (JSDoc/TSDoc), comment only on non-obvious business logic ("Why") rather than repeating syntax ("What").

### Step 4: Verify Formatting & AI crawling readiness
1. Format files using clear scannability guidelines (single H1, clear header nesting levels).
2. Ensure relative links are verified and operational.
3. Confirm compliance against the **Quality Audit Checklist** before completing.

---

## 📋 Standard Templates

### 1. README Template
```markdown
# Project Name

Brief one-line description of the project's purpose.

## Quick Start

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Start development server
npm run dev
```

## Features

- Feature A: Description
- Feature B: Description

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |

## Documentation

- [API Reference](./docs/api.md)
- [Architecture Decision Records](./docs/adr/)
```

### 2. API Endpoint Template
```markdown
## GET /api/v1/users/:id

Get a user record by ID.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | Unique user identifier |

**Response:**
- 200: User object
- 404: User not found

**Example:**
- Request: `GET /api/v1/users/usr_123`
- Response (200 OK):
```json
{
  "id": "usr_123",
  "email": "user@example.com",
  "status": "active"
}
```
```

### 3. JSDoc/TSDoc Comments Template
```typescript
/**
 * Detailed description of why the function exists and what it computes.
 * 
 * @param paramName - Description of parameter input and bounds
 * @returns Description of return value
 * @throws ErrorType - When and why this exception occurs
 * 
 * @example
 * const result = functionName(input);
 */
```

### 4. Changelog Template
```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]
### Added
- New feature implementation description

## [1.0.0] - 2026-06-16
### Added
- Initial project release structures
```

### 5. Architecture Decision Record (ADR) Template
```markdown
# ADR-001: [Title]

## Status
Proposed / Accepted / Deprecated / Superseded

## Context
[Why are we making this decision? What are the constraints, requirements, and alternatives?]

## Decision
[What did we decide? What tech/framework is selected and why?]

## Consequences
[What are the trade-offs, benefits, and technical debt generated?]
```

### 6. AI-Friendly Documentation (`llms.txt`) Template
```markdown
# Project Name
> One-liner objective.

## Core Files
- [src/index.ts]: Main entry
- [src/api/]: API routes
- [docs/]: Documentation index

## Key Concepts
- Concept A: Brief explanation
- Concept B: Brief explanation
```

---

## ❌ Anti-Patterns

- Auto-invoking or generating documentation edits when the user did not explicitly request them.
- Leaving mock variables, bracketed placeholders `[...]`, or fake parameters in the finished docs.
- Writing obvious inline comments that restate simple code lines.
- Mixing README, API reference, ADR, and changelog formats without clear file or section boundaries.

---

## ✅ Quality Audit Checklist

Before concluding a documentation writing, README generation, or JSDoc/TSDoc API comments task, verify compliance with the following:

- [ ] **Explicit Request Checked**: Verified this task was explicitly requested by the user and is not an automated addition to a standard code task.
- [ ] **No Placeholders Left**: Substituted all mock tags with actual tested project paths, ports, or environment configurations.
- [ ] **Examples Validated**: Code blocks, request payloads, and CLI setup commands are verified to run correctly.
- [ ] **Why Documented**: Code docstrings and comments explain business reasons or edge cases, rather than syntax behavior.
- [ ] **AI-Friendly Format Included**: Verified compatibility with AI indexers (single H1, clean headings, relative paths in `llms.txt`).
