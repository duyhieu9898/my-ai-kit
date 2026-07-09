---
name: architecture
description: >-
  Use when making major architectural decisions, evaluating technical trade-offs,
  writing Architecture Decision Records (ADRs), or analyzing system designs.
  Architectural decision-making framework covering requirements analysis, constraints identification, trade-offs, and patterns.
  NOT for direct code implementation.
allowed-tools:
  - Read
  - Glob
  - Grep
---

# Architecture Decision Framework

> "Requirements drive architecture. Trade-offs inform decisions. ADRs capture rationale."

## 🎯 Selective Reading Rule

**Read ONLY files relevant to the request!** Check the content map, find what you need.

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| [references/context-discovery.md](references/context-discovery.md) | Questions to ask, project classification | Starting architecture design |
| [references/trade-off-analysis.md](references/trade-off-analysis.md) | ADR templates, trade-off framework | Documenting decisions |
| [references/pattern-selection.md](references/pattern-selection.md) | Decision trees, anti-patterns | Choosing patterns |
| [references/examples.md](references/examples.md) | MVP, SaaS, Enterprise examples | Reference implementations |
| [references/patterns-reference.md](references/patterns-reference.md) | Quick lookup for patterns | Pattern comparison |

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| Database schema design | [`database-design`](../database-design/SKILL.md) |
| API design patterns | [`api-patterns`](../api-patterns/SKILL.md) |
| Deployment architecture | [`devops-engineer`](../devops-engineer/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When tasked with designing, reviewing, or documenting system architecture, follow this sequential procedure:

### Step 1: Discover & Map Context
1. Engage in proactive discovery by answering the question hierarchy in [references/context-discovery.md](references/context-discovery.md).
2. Establish system scale (user numbers, transaction volume), team size/skills, timeline limits, business complexity, and constraints.
3. Classify the system category (MVP vs. SaaS vs. Enterprise) using the Project Classification Matrix.

### Step 2: Compare & Select Architectural Patterns
1. Cross-reference requirements against the Pattern selection tree in [references/pattern-selection.md](references/pattern-selection.md).
2. Benchmark alternative structures (Monolithic vs. Modular vs. Microservices) using tables in [references/patterns-reference.md](references/patterns-reference.md).
3. Align choices with domain-specific architecture examples in [references/examples.md](references/examples.md).

### Step 3: Conduct Structured Trade-off Analysis
1. For every core structural decision, compare alternative designs using the Pros/Cons Decision Framework from [references/trade-off-analysis.md](references/trade-off-analysis.md).
2. Explicitly document the complexity levels, limitations accepted, and mitigation steps.

### Step 4: Write Architecture Decision Records (ADRs)
1. Draft detailed records using the ADR Markdown Template in [references/trade-off-analysis.md](references/trade-off-analysis.md).
2. Save records under the standardized workspace path: `docs/architecture/adr-[xxx]-[decision].md`.
3. Set the ADR state appropriately (`Proposed`, `Accepted`, `Deprecated`, `Superseded`).

---

## Core Principle

**"Simplicity is the ultimate sophistication."**

- Start simple
- Add complexity ONLY when proven necessary
- You can always add patterns later
- Removing complexity is MUCH harder than adding it

---

## ❌ Anti-Patterns

**DON'T:**
- Introduce microservices early for low-scale or small-team MVPs.
- Adopt a complex pattern without executing a trade-off comparison.
- Let design patterns leak internal domain concepts across package layers.
- Proceed without documenting architectural compromises in ADRs.

---

## ✅ Quality Audit Checklist

Before finalizing system architecture designs or recommending patterns, verify the following:

- [ ] **Context Verified**: The discovery questionnaire in `references/context-discovery.md` has been analyzed, establishing scale and constraints.
- [ ] **Simplicity Baseline**: Evaluated whether a simpler architecture could satisfy current and mid-term requirements.
- [ ] **Compromise Documentation**: Acceptable trade-offs, negative consequences, and mitigation schemes are fully cataloged.
- [ ] **ADR Compliant**: Architectural Decision Records are drafted using templates in `references/trade-off-analysis.md` and saved to `docs/architecture/`.
- [ ] **Skill Match**: The selected patterns and code designs align with team expertise to prevent adoption overhead.
