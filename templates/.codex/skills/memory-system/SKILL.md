---
name: memory-system
description: >-
  Use when the user triggers 'remember', 'save for later', or 'don't forget', or when starting a session to recall preferences.
  Persistent cross-session memory management using MEMORY.md index and topic files.
  NOT for short-term variables.
allowed-tools:
  - Read
  - Write
  - Grep
  - Glob
---

# Memory System — Persistent Cross-Session Memory

> Enables agents to remember across sessions. Never re-discover what was already learned.

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| _No supplementary files_ | Main memory procedures are in this file | Use this file by default |

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| Compressing context tokens efficiently | [`context-compression`](../context-compression/SKILL.md) |
| Storing local backend configuration notes | [`nodejs-best-practices`](../nodejs-best-practices/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When tasked with saving user preferences, recalling project standards, or handling memory queries, strictly follow this step-by-step procedure:

### Step 1: Session Start Protocol
1. Check if `.agents/memory/MEMORY.md` index exists.
2. If present, load relevant pointers silently without recitations.

### Step 2: Categorize Memory Taxonomies
1. Classify information into user preferences, feedback history, project standards, or reference indexes.
2. Confirm absolutely no secrets, credentials, high-entropy tokens, or raw code are present.

### Step 3: Manage Topic Files
1. Check if a relevant topic markdown file already exists.
2. Append to the existing file or write a new one with correct metadata frontmatter.

### Step 4: Index the Pointer File
1. Keep the MEMORY.md file under 200 total lines.
2. Append a 150-character summary pointing to the topic path.

### Step 5: Perform Search/Pruning & Verify Checklist
1. Search via Grep across templates when requested by the user, and propose pruning when the index threshold is crossed.
2. Confirm compliance against the **Quality Audit Checklist** before completing.

---

## Overview

The Memory System provides **persistent, searchable memory** that survives across sessions. Instead of re-explaining preferences, conventions, and past decisions every time, agents read a structured MEMORY.md index and topic files.

**Token Impact:** +1,000 tokens to load index, but saves 3,000-10,000 tokens by eliminating re-discovery.

---

## Architecture

```
.agents/memory/
├── MEMORY.md              ← Lightweight index (max 200 lines)
├── user-preferences.md    ← Topic file: user role, style, tools
├── project-conventions.md ← Topic file: coding standards, patterns
├── tech-decisions.md      ← Topic file: past architectural decisions
├── feedback-history.md    ← Topic file: what user liked/disliked
└── [topic-name].md        ← Additional topic files as needed
```

---

## MEMORY.md Index Format

The index is a **lightweight pointer file** — short entries that reference topic files for details.

**Rules:**
- Maximum **200 lines** total
- Each entry: **~150 characters max**
- Format: `- [type] summary → topic-file.md`
- Types: `[user]` `[feedback]` `[project]` `[reference]`

**Example:**
```markdown
# Memory Index

## User
- [user] Prefers dark mode, uses Windows 11, PowerShell → user-preferences.md
- [user] Senior DevOps engineer, 8 years experience → user-preferences.md
- [user] Primary language: English, sometimes Turkish → user-preferences.md

## Project
- [project] Always use bun instead of npm → project-conventions.md
- [project] Tailwind v4 preferred, no v3 → tech-decisions.md
- [project] No purple/violet colors in UI → project-conventions.md

## Feedback
- [feedback] User likes concise responses, no filler → feedback-history.md
- [feedback] User dislikes verbose explanations → feedback-history.md
- [feedback] User prefers tables over bullet lists → feedback-history.md

## Reference
- [reference] Squid proxy runs on port 3128 → infrastructure-notes.md
- [reference] Git workflow: feature branches → main → project-conventions.md
```

---

## Topic File Format

Each topic file has **frontmatter** and **structured content**:

```markdown
---
type: user | feedback | project | reference
created: 2026-04-01
updated: 2026-04-01
---

# User Preferences

## Development Environment
- OS: Windows 11
- Shell: PowerShell
- Editor: Cursor / Windsurf
- Package Manager: bun (NOT npm)

## Communication Style
- Prefers concise responses
- Likes tables for comparisons
- Dislikes verbose explanations
```

---

## Memory Taxonomy

| Type | What to Store | Example |
|------|--------------|---------|
| **user** | Role, preferences, tools, communication style | "Senior DevOps, prefers dark mode" |
| **feedback** | What user liked/disliked about agent output | "User said 'too verbose', prefers tables" |
| **project** | Coding standards, tech choices, conventions | "Use bun not npm, Tailwind v4" |
| **reference** | Non-sensitive infrastructure notes, public URLs, configs | "Prod API hostname and port" |

---

## ❌ Anti-Patterns

| Don't Save | Why |
|---|---|
| Secrets, credentials, tokens, passwords, private keys, or API keys | Memory is persistent and may be shared across sessions |
| Information derivable from code | Read `package.json` instead of memorizing deps |
| Temporary debug context | Clutters memory, not useful later |
| Exact code snippets | Code changes — memory becomes stale |
| File paths that may move | Use glob patterns or descriptions instead |
| Entire conversation transcripts | Memory is for distilled insights only |

---

## Operations

### Save (Trigger: user says "remember", "save", "don't forget")

1. Identify the information type (user/feedback/project/reference)
2. Check if relevant topic file exists
3. If yes → append to existing topic file
4. If no → create new topic file with frontmatter
5. Update MEMORY.md index with one-line pointer
6. Confirm to user: "Saved to memory: [summary]"

### Recall (Trigger: session start, or "what do you remember about X")

1. Read `.agents/memory/MEMORY.md` index
2. Scan for relevant entries matching the current task
3. If match found → read the referenced topic file
4. Apply recalled context silently (don't recite memories unless asked)

### Search (Trigger: "do I have any notes about X")

1. Grep across `.agents/memory/*.md` for the search term
2. Return matching entries with file references
3. Offer to read full topic file if user wants details

### Prune (Trigger: index exceeds 200 lines)

1. Warn: "Memory index is getting large (X lines). Review recommended."
2. Suggest merging related entries
3. Suggest archiving old entries to `memory/archive/`
4. Never auto-delete — always ask user first

---

## Session Start Protocol

At the start of every session:

```
1. Check: Does `.agents/memory/MEMORY.md` exist?
   → YES: Read index. Apply relevant context silently.
   → NO: Continue without memory. Create on first "remember" trigger.

2. Apply memory WITHOUT reciting it.
   ❌ WRONG: "I remember you prefer dark mode and use bun..."
   ✅ RIGHT: (silently apply preferences, use bun in commands)

3. Exception: If user asks "what do you remember?" → recite relevant memories.
```

---

## ✅ Quality Audit Checklist

Before concluding a memory storage update, session recall operation, or memory index cleanup task, verify compliance with the following:

- [ ] **No Secrets Saved**: Audited target content to ensure absolutely no API tokens, credentials, private keys, or passwords exist.
- [ ] **Index Compact (<200 Lines)**: Verified that `.agents/memory/MEMORY.md` remains within the 200-line strict limit.
- [ ] **Code Duplications Avoided**: Confirmed stored information does not duplicate dependency rules or code structures derivable directly from files.
- [ ] **Topic Pointer Matches**: Verified every pointer in the main index correctly maps to a valid `.md` file inside the `memory/` subdirectory.
- [ ] **Silent Application Enforced**: Applied the recalled preferences directly without announcing them to the user (no recitation unless asked).

---

## Memory vs. Plan vs. Task

| Artifact | Purpose | Lifespan | Location |
|----------|---------|----------|----------|
| **Memory** | Cross-session knowledge | Permanent until pruned | `.agents/memory/` |
| **Plan** | Task breakdown for current project | Until project complete | Project root |
| **Task** | Progress tracker for current session | Until session ends | Artifact directory |

> Memory = what you KNOW. Plan = what you'll DO. Task = what you're DOING NOW.
