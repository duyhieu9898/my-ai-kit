---
name: architecture
description: >-
  Use when making major architectural decisions, evaluating technical trade-offs,
  writing Architecture Decision Records (ADRs), or analyzing system designs.
  Architectural decision-making framework covering requirements analysis, constraints identification, trade-offs, and patterns.
  NOT for direct code implementation.
allowed-tools: Read Glob Grep
---

# Architecture Decision Framework


> Strategic guidelines and procedures for the Architecture capability in this repository.

## 📑 Content Map

| File / Resource | Description | When to Read |
|:---|:---|:---|
| `SKILL.md` | Core guidelines, procedures, and best practices | Active throughout task execution |
| `agents/openai.yaml` | Codex UI and implicit invocation policy configuration | During skill indexing or UI setup |

## 🔗 Related Skills

| Skill | Relationship | When to Collaborate |
|:---|:---|:---|
| `clean-code` | Quality Foundation | To ensure strict clean code, typing, and safety standards |
| `simplify-code` | Refactor Companion | When dealing with redundant loops, nested conditions, or long blocks |




## 🎯 Selective Reading Rule

**Read ONLY files relevant to the request!** Check the content map, find what you need.

| File | Description | When to Read |
|------|-------------|--------------|
| `references/context-discovery.md` | Questions to ask, project classification | Starting architecture design |
| `references/trade-off-analysis.md` | ADR templates, trade-off framework | Documenting decisions |
| `references/pattern-selection.md` | Decision trees, anti-patterns | Choosing patterns |
| `references/examples.md` | MVP, SaaS, Enterprise examples | Reference implementations |
| `references/patterns-reference.md` | Quick lookup for patterns | Pattern comparison |

---

## 🔗 Related Skills

| Skill | Use For |
|-------|---------|
| `database-design` | Database schema design |
| `api-patterns` | API design patterns |
| `deployment-procedures` | Deployment architecture |

---

## Core Principle

**"Simplicity is the ultimate sophistication."**

- Start simple
- Add complexity ONLY when proven necessary
- You can always add patterns later
- Removing complexity is MUCH harder than adding it

---

## Validation Checklist

Before finalizing architecture:

- [ ] Requirements clearly understood
- [ ] Constraints identified
- [ ] Each decision has trade-off analysis
- [ ] Simpler alternatives considered
- [ ] ADRs written for significant decisions
- [ ] Team expertise matches chosen patterns
