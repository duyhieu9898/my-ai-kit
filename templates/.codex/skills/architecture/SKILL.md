---
name: architecture
description: >-
  Architectural decision-making framework — requirements analysis, constraints identification,
  trade-off evaluations, pattern selection trees, and ADR documentation.
  Use when making major architectural decisions, evaluating technical trade-offs,
  writing Architecture Decision Records (ADRs), or analyzing system designs.
  NOT for direct code implementation.
allowed-tools: Read Glob Grep
---

# Architecture Decision Framework

> "Requirements drive architecture. Trade-offs inform decisions. ADRs capture rationale."

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
