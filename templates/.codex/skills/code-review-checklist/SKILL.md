---
name: code-review-checklist
description: >-
  Use when reviewing code for quality, analyzing PRs/diffs, or establishing team style guides.
  Comprehensive code review guidelines covering correctness, security, performance, code quality, testing, and documentation.
  NOT for direct code editing or building test pipelines.
allowed-tools:
  - Read
  - Glob
  - Grep
---

# Code Review Checklist

> Structured review guidance for correctness, security, performance, maintainability, tests, and documentation.

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| No supplementary files | This skill is self-contained | Use the procedures below directly |

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| Automated token-efficient AST codebase indexing | [`code-review-graph`](../code-review-graph/SKILL.md) |
| Standard clean code formatting practices | [`clean-code`](../clean-code/SKILL.md) |
| Security-focused review | [`security-auditor`](../security-auditor/SKILL.md) |
| Lint, type, test, and build validation | [`lint-and-validate`](../lint-and-validate/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When tasked with reviewing code for quality, parsing dynamic diff files, or drafting team styling guides, strictly follow this step-by-step procedure:

### Step 1: Scan Target Differences
1. Read the PR diff, commit logs, or specific codebase target files using your search/read tools.
2. Formulate a summary of changed logic.

### Step 2: Audit Core Metrics (Correctness, Security, Performance)
1. Run target correctness, security, and performance checks (Quick Review Checklist).
2. Validate inputs, sanitize query parameters (anti-SQL injection), and analyze dynamic performance impacts (N+1 query checks).

### Step 3: Run AI/LLM Logic Audits
1. Audit AI model integration prompts for prompt injection vulnerabilities and schema strictness (Prompt Engineering Review).
2. Verify that raw AI outputs are fully sanitized before being written into critical file or rendering sinks.

### Step 4: Generate Structured Feedback Comments
1. Draft code comments detailing blocking issues, improvements, and style suggestions.
2. Label blocking issues with 🔴, helpful suggestions with 🟡, minor stylistic nits with 🟢, and speculative questions with ❓.
3. Confirm final compliance using the **Quality Audit Checklist** before completing.

---

## Quick Review Checklist

### Correctness
- [ ] Code does what it's supposed to do
- [ ] Edge cases handled
- [ ] Error handling in place
- [ ] No obvious bugs

### Security
- [ ] Input validated and sanitized
- [ ] No SQL/NoSQL injection vulnerabilities
- [ ] No XSS or CSRF vulnerabilities
- [ ] No hardcoded secrets or sensitive credentials
- [ ] **AI-Specific:** Protection against Prompt Injection (if applicable)
- [ ] **AI-Specific:** Outputs are sanitized before being used in critical sinks

### Performance
- [ ] No N+1 queries
- [ ] No unnecessary loops
- [ ] Appropriate caching
- [ ] Bundle size impact considered

### Code Quality
- [ ] Clear naming
- [ ] DRY - no duplicate code
- [ ] SOLID principles followed
- [ ] Appropriate abstraction level

### Testing
- [ ] Unit tests for new code
- [ ] Edge cases tested
- [ ] Tests readable and maintainable

### Documentation
- [ ] Complex logic commented
- [ ] Public APIs documented
- [ ] README updated if needed

## AI & LLM Review Patterns (2025)

### Logic & Hallucinations
- [ ] **Chain of Thought:** Does the logic follow a verifiable path?
- [ ] **Edge Cases:** Did the AI account for empty states, timeouts, and partial failures?
- [ ] **External State:** Is the code making safe assumptions about file systems or networks?

### Prompt Engineering Review
```markdown
// ❌ Vague prompt in code
const response = await ai.generate(userInput);

// ✅ Structured & Safe prompt
const response = await ai.generate({
  system: "You are a specialized parser...",
  input: sanitize(userInput),
  schema: ResponseSchema
});
```

## ❌ Anti-Patterns

```typescript
// ❌ Magic numbers
if (status === 3) { ... }

// ✅ Named constants
if (status === Status.ACTIVE) { ... }

// ❌ Deep nesting
if (a) { if (b) { if (c) { ... } } }

// ✅ Early returns
if (!a) return;
if (!b) return;
if (!c) return;
// do work

// ❌ Long functions (100+ lines)
// ✅ Small, focused functions

// ❌ any type
const data: any = ...

// ✅ Proper types
const data: UserData = ...
```

## Review Comments Guide

```
// Blocking issues use 🔴
🔴 BLOCKING: SQL injection vulnerability here

// Important suggestions use 🟡
🟡 SUGGESTION: Consider using useMemo for performance

// Minor nits use 🟢
🟢 NIT: Prefer const over let for immutable variable

// Questions use ❓
❓ QUESTION: What happens if user is null here?
```

---

## ✅ Quality Audit Checklist

Before concluding a Code Review task, verify compliance with the following:

- [ ] **Sanitized Inputs**: All user inputs in the review targets are fully validated and sanitized against SQL/NoSQL/XSS vulnerabilities.
- [ ] **AI Sinks Sanitized**: AI model prompts use strict structured inputs and sanitize model output text before using it in critical DOM/eval sinks.
- [ ] **No Magic Constants**: Named constants or enum definitions replace raw numbers and magic strings.
- [ ] **Early Returns Applied**: Nested condition branches are refactored using early return guards.
- [ ] **Blocking labeled**: Feedback comments clearly label blocking issues with 🔴, suggestions with 🟡, nits with 🟢, and questions with ❓.
