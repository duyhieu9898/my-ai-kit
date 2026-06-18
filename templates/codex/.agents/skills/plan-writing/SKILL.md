---
name: plan-writing
description: >-
  Create bounded implementation plans for known features, bug fixes, and
  multi-file refactors. Produce small file-aware tasks with explicit
  verification criteria. Use after scope and architecture are sufficiently
  understood. NOT for trivial edits, executing an existing plan, new-product
  roadmaps, or cross-workstream initiatives that belong in project-planner.
---

# Plan Writing

> Distilled from production-proven planning frameworks. Breaks down complex tracks into atomic, verifiable actions.

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| _No supplementary files_ | Main plan writing procedures are in this file | Use this file by default |

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| Orchestrating large-scale multi-agent planner loops | [`project-planner`](../project-planner/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When tasked with writing action plans, decomposing new features, planning refactors, or documenting bug fixes, strictly follow this step-by-step procedure:

### Step 1: Query Intent & Preferences
1. Query the user for technology preferences, MVP constraints, or legacy compatibility layers.
2. Isolate the target boundaries (what files are affected, what dependencies are needed).

### Step 2: Establish Verification Boundaries
1. Design explicit, actionable verification methods for the overall objective.
2. Outline specific success criteria (e.g. CLI calls returning specific codes, network request responses, local server interactions).

### Step 3: Decompose into Atomic Tasks
1. Break down the work into 5-10 small, focused, verifiable tasks taking 2-5 minutes each.
2. For each task, write a clear, one-line action and a dedicated `Verify: [How to check]` parameter.

### Step 4: Write Action Plan to Project Root
1. Generate the structured task plan following the minimal plan structure format.
2. Save the plan file directly to the PROJECT ROOT directory as `{task-slug}.md` (never inside `.claude/`, `docs/`, or temporary paths).

### Step 5: Mark Progress & Checklist Verification
1. Execute tasks step-by-step, updating task checkmarks `[x]` as they complete.
2. Confirm overall compliance against the **Quality Audit Checklist** before concluding.

---

## Overview
This skill provides a framework for breaking down work into clear, actionable tasks with verification criteria.

## Task Breakdown Principles

### 1. Small, Focused Tasks
- Each task should take 2-5 minutes
- One clear outcome per task
- Independently verifiable

### 2. Clear Verification
- How do you know it's done?
- What can you check/test?
- What's the expected output?

### 3. Logical Ordering
- Dependencies identified
- Parallel work where possible
- Critical path highlighted
- **Phase X: Verification is always LAST**

### 4. Dynamic Naming in Project Root
- Plan files are saved as `{task-slug}.md` in the PROJECT ROOT
- Name derived from task (e.g., "add auth" → `auth-feature.md`)
- **NEVER** inside `.claude/`, `docs/`, or temp folders

## Planning Principles (NOT Templates!)

> 🔴 **NO fixed templates. Each plan is UNIQUE to the task.**

### Principle 1: Keep It SHORT

| ❌ Wrong | ✅ Right |
|----------|----------|
| 50 tasks with sub-sub-tasks | 5-10 clear tasks max |
| Every micro-step listed | Only actionable items |
| Verbose descriptions | One-line per task |

> **Rule:** If plan is longer than 1 page, it's too long. Simplify.

---

### Principle 2: Be SPECIFIC, Not Generic

| ❌ Wrong | ✅ Right |
|----------|----------|
| "Set up project" | "Run `npx create-next-app`" |
| "Add authentication" | "Install next-auth, create `/api/auth/[...nextauth].ts`" |
| "Style the UI" | "Add Tailwind classes to `Header.tsx`" |

> **Rule:** Each task should have a clear, verifiable outcome.

---

### Principle 3: Dynamic Content Based on Project Type

**For NEW PROJECT:**
- What tech stack? (decide first)
- What's the MVP? (minimal features)
- What's the file structure?

**For FEATURE ADDITION:**
- Which files are affected?
- What dependencies needed?
- How to verify it works?

**For BUG FIX:**
- What's the root cause?
- What file/line to change?
- How to test the fix?

---

### Principle 4: Scripts Are Project-Specific

> 🔴 **DO NOT copy-paste script commands. Choose based on project type.**

| Project Type | Relevant Scripts |
|--------------|------------------|
| Frontend/React | `ux_audit.py`, `accessibility_checker.py` |
| Backend/API | `api_validator.py`, `security_scan.py` |
| Mobile | `mobile_audit.py` |
| Database | `schema_validator.py` |
| Full-stack | Mix of above based on what you touched |

**Wrong:** Adding all scripts to every plan
**Right:** Only scripts relevant to THIS task

---

### Principle 5: Verification is Simple

| ❌ Wrong | ✅ Right |
|----------|----------|
| "Verify the component works correctly" | "Run `npm run dev`, click button, see toast" |
| "Test the API" | "curl localhost:3000/api/users returns 200" |
| "Check styles" | "Open browser, verify dark mode toggle works" |

---

## Plan Structure (Flexible, Not Fixed!)

```
# [Task Name]

## Goal
One sentence: What are we building/fixing?

## Tasks
- [ ] Task 1: [Specific action] → Verify: [How to check]
- [ ] Task 2: [Specific action] → Verify: [How to check]
- [ ] Task 3: [Specific action] → Verify: [How to check]

## Done When
- [ ] [Main success criteria]
```

> **That's it.** No phases, no sub-sections unless truly needed.
> Keep it minimal. Add complexity only when required.

## Notes
[Any important considerations]

---

## ❌ Anti-Patterns

- Writing generic template plans that do not name the actual files, commands, or checks.
- Creating plans for trivial one-step edits where direct execution is clearer.
- Saving plan files inside `.claude/`, `docs/`, or temporary paths instead of the project root.
- Listing broad phases without concrete `Verify:` criteria for each task.

---

## ✅ Quality Audit Checklist

Before concluding a plan writing, task decomposition, or feature design task, verify compliance with the following:

- [ ] **Small Focused Tasks**: Decomposed the target into 5-10 atomic tasks taking 2-5 minutes each.
- [ ] **Clear Verification Defined**: Every task includes an explicit, actionable, and testable `Verify: [How to check]` condition.
- [ ] **Saved in Project Root**: The generated action plan is stored precisely as `{task-slug}.md` in the project root.
- [ ] **No Template Bloat**: Kept it minimal, readable, and highly specific to the project context (avoiding generic copy-paste structures).
- [ ] **Dynamic Naming Applied**: Slugs reflect the main feature action in a clean kebab-case format.

---
