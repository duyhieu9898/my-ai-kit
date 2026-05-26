---
name: performance-profiling
description: >-
  Use when diagnosing page speed issues, executing bundle analysis, or optimizing Core Web Vitals.
  Performance profiling targets covering Lighthouse audits, memory leaks, and quick-wins.
  NOT for speculative optimization without measurable performance symptoms.
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# Performance Profiling

> Measure, analyze, optimize - in that order.

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| [scripts/lighthouse_audit.py](scripts/lighthouse_audit.py) | Lighthouse performance audit runner | Running automated Core Web Vitals checks |

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| Core Web Vitals optimization techniques | [`performance-optimizer`](../performance-optimizer/SKILL.md) |
| Next.js bundle and PPR caching setups | [`nextjs-react-expert`](../nextjs-react-expert/SKILL.md) |
| Structuring high-speed frontend designs | [`frontend-design`](../frontend-design/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When tasked with diagnosing page speed sluggishness, performing bundle analyses, or profiling memory heaps, strictly follow this step-by-step procedure:

### Step 1: Establish Baseline & Run Audits
1. Run the automated performance audit script (`scripts/lighthouse_audit.py`) on a baseline target URL:
   `python scripts/lighthouse_audit.py https://example.com`
2. Record initial Core Web Vitals targets (LCP, INP, CLS) to track metrics baseline.

### Step 2: Trace Sluggishness Bottlenecks
1. Select appropriate tool setups based on isolated symptoms (Page load -> Lighthouse, Bundle size -> Bundle Analyzer, Runtime -> DevTools Performance/Memory).
2. Trace the sluggishness origin (large dependencies, blocking tasks, or detached DOM trees).

### Step 3: Run Bundle or Runtime Profiling Analysis
1. Analyze bundle chunks for duplication, lack of splits, or low coverage.
2. Locate UI blockages (>50ms long tasks) or growing heap retention metrics.

### Step 4: Apply Quick Win Priorities
1. Apply rapid improvements based on priority impact (Enable compression, Lazy load images, split bundle routes).
2. Clean up unmount bounds to prevent growth leaks.

### Step 5: Re-Profile & Validate
1. Re-run Lighthouse audits or bundle size checks to verify compliance.
2. Confirm compliance against the **Quality Audit Checklist** before completing.

---

## 🔧 Runtime Scripts

**Execute these for automated profiling:**

| Script | Purpose | Usage |
|--------|---------|-------|
| [scripts/lighthouse_audit.py](scripts/lighthouse_audit.py) | Lighthouse performance audit | `python scripts/lighthouse_audit.py https://example.com` |

---

## 1. Core Web Vitals

### Targets

| Metric | Good | Poor | Measures |
|--------|------|------|----------|
| **LCP** | < 2.5s | > 4.0s | Loading |
| **INP** | < 200ms | > 500ms | Interactivity |
| **CLS** | < 0.1 | > 0.25 | Stability |

### When to Measure

| Stage | Tool |
|-------|------|
| Development | Local Lighthouse |
| CI/CD | Lighthouse CI |
| Production | RUM (Real User Monitoring) |

---

## 2. Profiling Workflow

### The 4-Step Process

```
1. BASELINE → Measure current state
2. IDENTIFY → Find the bottleneck
3. FIX → Make targeted change
4. VALIDATE → Confirm improvement
```

### Profiling Tool Selection

| Problem | Tool |
|---------|------|
| Page load | Lighthouse |
| Bundle size | Bundle analyzer |
| Runtime | DevTools Performance |
| Memory | DevTools Memory |
| Network | DevTools Network |

---

## 3. Bundle Analysis

### What to Look For

| Issue | Indicator |
|-------|-----------|
| Large dependencies | Top of bundle |
| Duplicate code | Multiple chunks |
| Unused code | Low coverage |
| Missing splits | Single large chunk |

### Optimization Actions

| Finding | Action |
|---------|--------|
| Big library | Import specific modules |
| Duplicate deps | Dedupe, update versions |
| Route in main | Code split |
| Unused exports | Tree shake |

---

## 4. Runtime Profiling

### Performance Tab Analysis

| Pattern | Meaning |
|---------|---------|
| Long tasks (>50ms) | UI blocking |
| Many small tasks | Possible batching opportunity |
| Layout/paint | Rendering bottleneck |
| Script | JavaScript execution |

### Memory Tab Analysis

| Pattern | Meaning |
|---------|---------|
| Growing heap | Possible leak |
| Large retained | Check references |
| Detached DOM | Not cleaned up |

---

## 5. Common Bottlenecks

### By Symptom

| Symptom | Likely Cause |
|---------|--------------|
| Slow initial load | Large JS, render blocking |
| Slow interactions | Heavy event handlers |
| Jank during scroll | Layout thrashing |
| Growing memory | Leaks, retained refs |

---

## 6. Quick Win Priorities

| Priority | Action | Impact |
|----------|--------|--------|
| 1 | Enable compression | High |
| 2 | Lazy load images | High |
| 3 | Code split routes | High |
| 4 | Cache static assets | Medium |
| 5 | Optimize images | Medium |

---

## ❌ Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|-------|
| Guess at problems | Profile first |
| Micro-optimize | Fix biggest issue |
| Optimize early | Optimize when needed |
| Ignore real users | Use RUM data |

---

## ✅ Quality Audit Checklist

Before concluding a page speed diagnosis, bundle analysis, or web vitals profiling task, verify compliance with the following:

- [ ] **Lighthouse Baseline Established**: Run automated audits on the target URL using `scripts/lighthouse_audit.py`.
- [ ] **Bottleneck Identified**: Plotted loading vs interaction sluggishness using standard profiling metrics.
- [ ] **Bundle composition audited**: Checked duplicate module footprints and low chunk coverage indexes.
- [ ] **Long Tasks Tracked**: Isolated event loop blockages >50ms to establish UI responsiveness boundaries.
- [ ] **Unmount Garbage Verified**: Assured active event listeners, timers, and closures are garbage collected post-unmount.
- [ ] **Quick Wins Priority Configured**: Inlined critical resources, configured dynamic loading paths, and compressed files.

---

> **Remember:** The fastest code is code that doesn't run. Remove before optimizing.
