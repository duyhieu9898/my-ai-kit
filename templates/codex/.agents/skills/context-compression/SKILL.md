---
name: context-compression
description: >-
  Use when session turns are high (20+ turns), context degradation is observed, switching work phases, or summarizing active decisions.
  Conversation context management in long sessions covering phase summarization and mental model checkpointing.
  NOT for short sessions.
allowed-tools:
  - Read
  - Write
  - Grep
---

# Context Compression — Long Session Management

> Keep sessions productive by compressing completed work while preserving key decisions.

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| No supplementary files | This skill is self-contained | Use the procedures below directly |

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| Orchestrating and partitioning large tasks | [`orchestrator`](../orchestrator/SKILL.md) |
| Planning high-complexity project tracks | [`project-planner`](../project-planner/SKILL.md) |
| Optimizing large-repository token usage | [`code-review-graph`](../code-review-graph/SKILL.md) |
| Persisting key decisions across sessions | [`memory-system`](../memory-system/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When managing context windows, summarizing complex work phases, or constructing session checkpoints, strictly follow this step-by-step procedure:

### Step 1: Monitor Context Saturation Signals
1. Track active session turn counts and check for token degradation (repetitions, forgotten configs).
2. Spot transition points (e.g. from research phase to codebase refactoring).

### Step 2: Determine Appropriate Compression Level
1. Use **Level 1: Micro-Compact** for massive grep, search, or shell command outputs (500+ lines).
2. Use **Level 2: Phase Summary** when wrapping a completed stage of exploration.
3. Use **Level 3: Session Checkpoint** to store deep mental models in long-running conversations (30+ turns).

### Step 3: Extract Core Decisions & Discard Noise
1. Isolate critical components (Decisions made, modified files, line bounds, and research summaries).
2. Discard exploratory loops, raw terminal outputs, verbose stack traces, and full files contents.

### Step 4: Present & Validate Checkpoints
1. Notify the user prior to summarizing context to explain performance advantages.
2. Formulate the summary. Confirm compliance against the **Quality Audit Checklist** before completing.

---

## Overview

Long sessions (30+ turns) cause context degradation — the AI loses track of earlier work, repeats itself, or forgets decisions. Context compression proactively summarizes completed phases so the context window stays focused on active work.

**Token Impact:** Recovers 5,000-15,000 tokens in long sessions by replacing verbose tool outputs with semantic summaries.

---

## When to Compress

| Signal | Action |
|---|---|
| Session has 20+ turns | Consider proactive compression |
| Agent repeats earlier suggestions | Context is saturated — compress now |
| User says "we already discussed this" | Compress immediately |
| Switching to a new phase of work | Compress the completed phase |
| Large tool output (500+ lines) | Micro-compact the output |

---

## Compression Levels

### Level 1: Micro-Compact (Tool Output)

Compress individual tool outputs while retaining semantic content:

```
❌ Before (raw grep output — 200 lines, ~4,000 tokens):
src/auth/jwt.ts:15: import { verify } from 'jsonwebtoken'
src/auth/jwt.ts:23: export function validateToken(token: string) {
src/auth/jwt.ts:24:   try {
src/auth/jwt.ts:25:     const decoded = verify(token, SECRET)
... (195 more lines)

✅ After (micro-compact — 5 lines, ~100 tokens):
Grep results for "jwt": Found 8 files, 42 matches.
Key files: src/auth/jwt.ts (main JWT logic), src/middleware/auth.ts (middleware),
src/api/login.ts (token creation). Token validation at jwt.ts:23-40.
Error handling at jwt.ts:42-55. Secret loaded from env at jwt.ts:8.
```

### Level 2: Phase Summary

Replace a completed work phase with a summary:

```
❌ Before (full research transcript — ~3,000 tokens):
[turn 1] Read package.json...
[turn 2] Read src/index.ts...
[turn 3] Grep for "auth"...
[turn 4] Found 8 files related to auth...
[turn 5] Read src/auth/jwt.ts...
... (10 more turns of exploration)

✅ After (phase summary — ~200 tokens):
## Research Phase Complete
- Project: Next.js 15 app with JWT auth
- Auth files: 8 files in src/auth/, src/middleware/, src/api/
- Token flow: login → create JWT → store in httpOnly cookie → validate in middleware
- Bug location: src/auth/jwt.ts:45 — expiry check uses `<` instead of `<=`
- Decision: Fix the comparison operator, add edge case test
```

### Level 3: Session Checkpoint

Full session summary for long-running work:

```markdown
## Session Checkpoint (Turn 35)

### Completed
- [x] Researched auth system (8 files, JWT flow mapped)
- [x] Fixed token expiry bug in jwt.ts:45
- [x] Added edge case test in jwt.test.ts
- [x] Verified: all 42 tests passing

### In Progress
- [ ] Update API documentation
- [ ] Review related middleware

### Key Decisions
1. Keep httpOnly cookies (not localStorage) for token storage
2. Use `<=` for expiry check to include exact-moment expiry
3. Add 5-minute grace period for clock skew

### Files Modified
- src/auth/jwt.ts (line 45: comparison fix)
- tests/auth/jwt.test.ts (added 3 edge case tests)
```

---

## Best Practices

1. **Compress phases, not facts** — Individual decisions should stay, full transcripts should go.
2. **Preserve "why" over "what"** — Why a decision was made matters more than the exact commands run.
3. **Never auto-compress** — Always tell the user "I'm summarizing the completed research phase to keep context focused".
4. **Keep file references** — Always preserve file paths and line numbers in summaries.
5. **Checkpoint on phase transitions** — Natural compression point when switching from research to implementation.

---

## ❌ Anti-Patterns

- Compress active unresolved work before the current task state is clear.
- Drop decision rationale, file paths, line numbers, or verification results.
- Preserve large raw outputs when a semantic summary is enough.
- Summarize user preferences inaccurately or without distinguishing assumptions from facts.
- Auto-compress without telling the user why the summary is being introduced.

---

## ✅ Quality Audit Checklist

Before concluding a Context Compression summary or session checkpoint, verify compliance with the following:

- [ ] **Saturation Monitored**: Evaluated session turn counts and context saturation levels before compression.
- [ ] **Decisions and "Whys" Saved**: Preserved the rationale for key architectural decisions rather than just raw code modifications.
- [ ] **Full File Contents Discarded**: Excluded large raw tool outputs, package outputs, or stack traces from the summarized text.
- [ ] **Active Code References Intact**: Kept exact file names, modified line numbers, and active branches fully referenced.
- [ ] **Proactive Notification**: Notified the user before introducing summarized work phases to preserve visibility.
