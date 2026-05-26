---
name: nextjs-react-expert
description: >-
  Use when building React components, optimizing Next.js routing/fetching, diagnosing UI lag, or configuring Next.js 16+ caching/PPR.
  Next.js and React performance optimization rules covering waterfalls, bundle size, and memoization.
  NOT for basic HTML templates.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Next.js & React Performance Expert

> **From Vercel Engineering** - 57 optimization rules prioritized by impact
> **Philosophy:** Eliminate waterfalls first, optimize bundles second, then micro-optimize.

---

## 📑 Content Map

| File | Impact | Rules | When to Read |
|------|--------|-------|--------------|
| [references/1-async-eliminating-waterfalls.md](references/1-async-eliminating-waterfalls.md) | 🔴 **CRITICAL** | 5 rules | Slow page loads, sequential API calls, data fetching waterfalls |
| [references/2-bundle-bundle-size-optimization.md](references/2-bundle-bundle-size-optimization.md) | 🔴 **CRITICAL** | 5 rules | Large bundle size, slow Time to Interactive, First Load issues |
| [references/3-server-server-side-performance.md](references/3-server-server-side-performance.md) | 🟠 **HIGH** | 7 rules | Slow SSR, API route optimization, server-side waterfalls |
| [references/4-client-client-side-data-fetching.md](references/4-client-client-side-data-fetching.md) | 🟡 **MEDIUM-HIGH** | 4 rules | Client data management, SWR patterns, deduplication |
| [references/5-rerender-re-render-optimization.md](references/5-rerender-re-render-optimization.md) | 🟡 **MEDIUM** | 12 rules | Excessive re-renders, React performance, memoization |
| [references/6-rendering-rendering-performance.md](references/6-rendering-rendering-performance.md) | 🟡 **MEDIUM** | 9 rules | Rendering bottlenecks, virtualization, image optimization |
| [references/7-js-javascript-performance.md](references/7-js-javascript-performance.md) | ⚪ **LOW-MEDIUM** | 12 rules | Micro-optimizations, caching, loop performance |
| [references/8-advanced-advanced-patterns.md](references/8-advanced-advanced-patterns.md) | 🔵 **VARIABLE** | 3 rules | Advanced React patterns, useLatest, init-once |
| [references/9-cache-components.md](references/9-cache-components.md) | 🔴 **CRITICAL** | 4 sections | **Next.js 16+ Only**: `use cache`, `cacheLife`, PPR, `cacheTag` |

---

## 🔗 Related Skills

| Need | Skill |
|------|-------|
| API design patterns | [`api-patterns`](../api-patterns/SKILL.md) |
| Database optimization | [`database-design`](../database-design/SKILL.md) |
| Testing strategies | [`testing-patterns`](../testing-patterns/SKILL.md) |
| UI/UX design principles | [`frontend-design`](../frontend-design/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When tasked with building React components, diagnosing UI lag, or optimizing caching structures, strictly follow this step-by-step procedure:

### Step 1: Detect Performance Bottleneck
1. Audit page performance using Chrome DevTools or React Profiler profiles.
2. Locate issue category (e.g. dynamic rendering slow-downs, barrel exports, rendering waterfalls, memory leaks).

### Step 2: Query the Decision Tree
1. Query the **Quick Decision Tree** to map the issue to the appropriate optimization category.
2. If slow load or waterfall latency is present, **you must prioritize Critical references** (Waterfalls and Bundle size) before optimizing minor details.

### Step 3: Run Automated Performance Audits
1. Run the performance checking utility (`react_performance_checker.py`) via terminal command:
   `python scripts/react_performance_checker.py <project_path>`
2. Parse output warnings regarding barrel exports, sequential await calls, or client-side fetch patterns.

### Step 4: Refactor and Eliminate Bottlenecks
1. Apply targeted optimization principles (Promise.all Parallel fetches, Suspense streaming boundaries, next/image wrappers).
2. Remove nested un-memoized loops and configure caching strategies if Next.js 16+ is used (`use cache`).

### Step 5: Validate Suite & Audit checklist
1. Verify bundle sizes and run lint/testing actions.
2. Confirm compliance against the **Quality Audit Checklist** before completing.

---

## 🎯 Selective Reading Rule (MANDATORY)

**Read ONLY sections relevant to your task!** Check the content map above and load what you need.

> 🔴 **For performance reviews: Start with CRITICAL sections (1-2), then move to HIGH/MEDIUM.**

## 🚀 Quick Decision Tree

**What's your performance issue?**

```
🐌 Slow page loads / Long Time to Interactive
  → Read Section 1: Eliminating Waterfalls
  → Read Section 2: Bundle Size Optimization

📦 Large bundle size (> 200KB)
  → Read Section 2: Bundle Size Optimization
  → Check: Dynamic imports, barrel imports, tree-shaking

🖥️ Slow Server-Side Rendering
  → Read Section 3: Server-Side Performance
  → Check: Parallel data fetching, streaming

🔄 Too many re-renders / UI lag
  → Read Section 5: Re-render Optimization
  → Check: React.memo, useMemo, useCallback

🎨 Rendering performance issues
  → Read Section 6: Rendering Performance
  → Check: Virtualization, layout thrashing

🌐 Client-side data fetching problems
  → Read Section 4: Client-Side Data Fetching
  → Check: SWR deduplication, localStorage

✨ Need advanced patterns
  → Read Section 8: Advanced Patterns

🚀 **Next.js 16+ Performance (Caching & PPR)**
  → Read Section 9: Cache Components
```

---

## 📊 Impact Priority Guide

**Use this order when doing comprehensive optimization:**

```
1️⃣ CRITICAL (Biggest Gains - Do First):
   ├─ Section 1: Eliminating Waterfalls
   │  └─ Each waterfall adds full network latency (100-500ms+)
   └─ Section 2: Bundle Size Optimization
      └─ Affects Time to Interactive and Largest Contentful Paint

2️⃣ HIGH (Significant Impact - Do Second):
   └─ Section 3: Server-Side Performance
      └─ Eliminates server-side waterfalls, faster response times

3️⃣ MEDIUM (Moderate Gains - Do Third):
   ├─ Section 4: Client-Side Data Fetching
   ├─ Section 5: Re-render Optimization
   └─ Section 6: Rendering Performance

4️⃣ LOW (Polish - Do Last):
   ├─ Section 7: JavaScript Performance
   └─ Section 8: Advanced Patterns

🔥 **MODERN (Next.js 16+):**
   └─ Section 9: Cache Components (Replaces most traditional revalidation)
```

---

## ❌ Anti-Patterns (Common Mistakes)

**DON'T:**

- ❌ Use sequential `await` for independent operations
- ❌ Import entire libraries when you need one function
- ❌ Use barrel exports (`index.ts` re-exports) in app code
- ❌ Skip dynamic imports for large components/libraries
- ❌ Fetch data in useEffect without deduplication
- ❌ Forget to memoize expensive computations
- ❌ Use client components when server components work

**DO:**

- ✅ Fetch data in parallel with `Promise.all()`
- ✅ Use dynamic imports: `const Comp = dynamic(() => import('./Heavy'))`
- ✅ Import directly: `import { specific } from 'library/specific'`
- ✅ Use Suspense boundaries for better UX
- ✅ Leverage React Server Components
- ✅ Measure performance before optimizing
- ✅ Use Next.js built-in optimizations (next/image, next/font)

---

## 📚 Learning Path

**Beginner (Focus on Critical):**
→ Section 1: Eliminating Waterfalls
→ Section 2: Bundle Size Optimization

**Intermediate (Add High Priority):**
→ Section 3: Server-Side Performance
→ Section 5: Re-render Optimization

**Advanced (Focus on Full Optimization):**
→ All sections + Section 8: Advanced Patterns

---

## 🔍 Validation Script

| Script | Purpose | Command |
|--------|---------|---------|
| [scripts/react_performance_checker.py](scripts/react_performance_checker.py) | Automated performance audit | `python scripts/react_performance_checker.py <project_path>` |

---

## ✅ Quality Audit Checklist

Before concluding Next.js or React UI optimization tasks, verify compliance with the following:

- [ ] **Sequential Calls Eliminated**: Independent queries are executed in parallel (`Promise.all()`) to prevent rendering waterfalls.
- [ ] **Bundle Constraint Met**: Main bundle footprint remains strictly <200KB.
- [ ] **Direct Imports Configured**: Zero barrel re-exports (`index.ts`) are used in critical app module paths.
- [ ] **Dynamic Load Bound**: Heavy subcomponents and dynamic libraries load via `dynamic()` or React lazy bounds.
- [ ] **Server Optimization Priority**: React Server Components execute static data fetches by default.
- [ ] **Memoization Active**: Heavy loop operations or complex mappings are memoized via `useMemo` or `useCallback`.
- [ ] **Modern Caching Leveraged**: Caching APIs (`use cache` or Suspense streaming boundaries) are utilized if Next.js 16+ is detected.

---

## 📖 Section Details

### Section 1: Eliminating Waterfalls (CRITICAL)

**Impact:** Each waterfall adds 100-500ms+ latency
**Key Concepts:** Parallel fetching, Promise.all(), Suspense boundaries, preloading

### Section 2: Bundle Size Optimization (CRITICAL)

**Impact:** Directly affects Time to Interactive, Largest Contentful Paint
**Key Concepts:** Dynamic imports, tree-shaking, barrel import avoidance

### Section 3: Server-Side Performance (HIGH)

**Impact:** Faster server responses, better SEO
**Key Concepts:** Parallel server fetching, streaming, API route optimization

### Section 4: Client-Side Data Fetching (MEDIUM-HIGH)

**Impact:** Reduces redundant requests, better UX
**Key Concepts:** SWR deduplication, localStorage caching, event listeners

### Section 5: Re-render Optimization (MEDIUM)

**Impact:** Smoother UI, less wasted computation
**Key Concepts:** React.memo, useMemo, useCallback, component structure

### Section 6: Rendering Performance (MEDIUM)

**Impact:** Better rendering efficiency
**Key Concepts:** Virtualization, image optimization, layout thrashing

### Section 7: JavaScript Performance (LOW-MEDIUM)

**Impact:** Incremental improvements in hot paths
**Key Concepts:** Loop optimization, caching, RegExp hoisting

### Section 8: Advanced Patterns (VARIABLE)

**Impact:** Specific use cases
**Key Concepts:** useLatest hook, init-once patterns, event handler refs

---

## 🎓 Best Practices Summary

**Golden Rules:**

1. **Measure first** - Use React DevTools Profiler, Chrome DevTools
2. **Biggest impact first** - Waterfalls → Bundle → Server → Micro
3. **Don't over-optimize** - Focus on real bottlenecks
4. **Use platform features** - Next.js has optimizations built-in
5. **Think about users** - Real-world conditions matter

**Performance Mindset:**

- Every `await` in sequence = potential waterfall
- Every `import` = potential bundle bloat
- Every re-render = wasted computation (if unnecessary)
- Server components = less JavaScript to ship
- Measure, don't guess

---

**Source:** Vercel Engineering
**Date:** January 2026
**Version:** 1.0.0
**Total Rules:** 57 across 8 categories
