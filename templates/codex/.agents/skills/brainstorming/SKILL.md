---
name: brainstorming
description: >-
  Use when exploring greenfield projects/features, clarifying ambiguous user requests,
  defining must-have vs nice-to-have options, or handling exceptions.
  Socratic questioning protocol and developer-user communication guidelines covering trade-offs, status reporting, and completion summaries.
  NOT for standard task automation or standalone code modifications.
allowed-tools:
  - Read
  - Glob
  - Grep
---

# Brainstorming & Communication Protocol

> **MANDATORY:** Use for complex/vague requests, new features, updates.

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| [references/dynamic-questioning.md](references/dynamic-questioning.md) | In-depth domain-specific Socratic questioning libraries and algorithms | Designing dynamic questions and mapping trade-offs |

---

## 🔗 Related Skills

| Skill | Relationship | When to Use Together |
|:---|:---|:---|
| [`behavioral-modes`](../behavioral-modes/SKILL.md) | Operating mode selection | When switching between brainstorm, implement, debug, review, teach, and ship modes |
| [`architecture`](../architecture/SKILL.md) | Technical trade-off analysis | When brainstorming impacts system architecture or ADR decisions |
| [`project-planner`](../project-planner/SKILL.md) | Task breakdown and planning | When clarified ideas need an executable implementation plan |
| [`memory-system`](../memory-system/SKILL.md) | Decision persistence | When brainstorming decisions should be saved for future sessions |

---

## 🛠️ Instructions / Procedures

## 🛑 Socratic Gate (Enforcement)

### When to Trigger

| Pattern | Action |
|---------|--------|
| "Build/Create/Make [thing]" without details | 🛑 ASK 3 questions |
| Complex feature or architecture | 🛑 Clarify before implementing |
| Update/change request | 🛑 Confirm scope |
| Vague requirements | 🛑 Ask purpose, users, constraints |

### 🧠 Memory Check (Before Questioning)

> Before asking questions, check if past context exists:

```
0. CHECK MEMORY — Does .agents/memory/MEMORY.md exist?
   → YES: Read index. Apply relevant past decisions silently.
          Skip questions already answered in memory.
   → NO: Proceed with standard Socratic Gate.
```

### 🚫 MANDATORY: 3 Questions Before Implementation

1. **STOP** - Do NOT start coding
2. **CHECK** - Read `.agents/memory/` for past context on this topic
3. **ASK** - Minimum 3 questions (skip any already answered via memory):
   - 🎯 Purpose: What problem are you solving?
   - 👥 Users: Who will use this?
   - 📦 Scope: Must-have vs nice-to-have?
4. **WAIT** - Get response before proceeding
5. **SAVE** - After brainstorming, save key decisions: `/remember [decision]`

---

## 🧠 Dynamic Question Generation

**⛔ NEVER use static templates.** Read `references/dynamic-questioning.md` for principles.

### Core Principles

| Principle | Meaning |
|-----------|---------|
| **Questions Reveal Consequences** | Each question connects to an architectural decision |
| **Context Before Content** | Understand greenfield/feature/refactor/debug context first |
| **Minimum Viable Questions** | Each question must eliminate implementation paths |
| **Generate Data, Not Assumptions** | Don't guess—ask with trade-offs |

### Question Generation Process

```
1. Parse request → Extract domain, features, scale indicators
2. Identify decision points → Blocking vs. deferable
3. Generate questions → Priority: P0 (blocking) > P1 (high-leverage) > P2 (nice-to-have)
4. Format with trade-offs → What, Why, Options, Default
```

### Question Format (MANDATORY)

```markdown
### [PRIORITY] **[DECISION POINT]**

**Question:** [Clear question]

**Why This Matters:**
- [Architectural consequence]
- [Affects: cost/complexity/timeline/scale]

**Options:**
| Option | Pros | Cons | Best For |
|--------|------|------|----------|
| A | [+] | [-] | [Use case] |

**If Not Specified:** [Default + rationale]
```

**For detailed domain-specific question banks and algorithms**, see: `references/dynamic-questioning.md`

---

## Progress Reporting (Principle-Based)

**PRINCIPLE:** Transparency builds trust. Status must be visible and actionable.

### Status Board Format

| Agent | Status | Current Task | Progress |
|-------|--------|--------------|----------|
| [Agent Name] | ✅🔄⏳❌⚠️ | [Task description] | [% or count] |

### Status Icons

| Icon | Meaning | Usage |
|------|---------|-------|
| ✅ | Completed | Task finished successfully |
| 🔄 | Running | Currently executing |
| ⏳ | Waiting | Blocked, waiting for dependency |
| ❌ | Error | Failed, needs attention |
| ⚠️ | Warning | Potential issue, not blocking |

---

## Error Handling (Principle-Based)

**PRINCIPLE:** Errors are opportunities for clear communication.

### Error Response Pattern

```
1. Acknowledge the error
2. Explain what happened (user-friendly)
3. Offer specific solutions with trade-offs
4. Ask user to choose or provide alternative
```

### Error Categories

| Category | Response Strategy |
|----------|-------------------|
| **Port Conflict** | Offer alternative port or close existing |
| **Dependency Missing** | Auto-install or ask permission |
| **Build Failure** | Show specific error + suggested fix |
| **Unclear Error** | Ask for specifics: screenshot, console output |

---

## Completion Message (Principle-Based)

**PRINCIPLE:** Celebrate success, guide next steps.

### Completion Structure

```
1. Success confirmation (celebrate briefly)
2. Summary of what was done (concrete)
3. How to verify/test (actionable)
4. Next steps suggestion (proactive)
```

---

## Communication Principles

| Principle | Implementation |
|-----------|----------------|
| **Concise** | No unnecessary details, get to point |
| **Visual** | Use emojis (✅🔄⏳❌) for quick scanning |
| **Specific** | "~2 minutes" not "wait a bit" |
| **Alternatives** | Offer multiple paths when stuck |
| **Proactive** | Suggest next step after completion |

---

## ❌ Anti-Patterns

| Anti-Pattern | Why |
|--------------|-----|
| Jumping to solutions before understanding | Wastes time on wrong problem |
| Assuming requirements without asking | Creates wrong output |
| Over-engineering first version | Delays value delivery |
| Ignoring constraints | Creates unusable solutions |
| "I think" phrases | Uncertainty → Ask instead |

---

## ✅ Quality Audit Checklist

- [ ] The request is actually ambiguous, greenfield, strategic, or exception-heavy enough to require brainstorming.
- [ ] Existing memory/context was checked before asking duplicate questions.
- [ ] Questions are dynamic and tied to concrete trade-offs, not copied from a static template.
- [ ] Blocking decisions are separated from nice-to-have preferences.
- [ ] Defaults are stated with rationale when the user does not specify an option.
- [ ] Final decisions and scope are summarized before implementation or handoff.
