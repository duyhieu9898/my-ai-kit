---
name: performance-profiling
description: >-
  Measures and fixes web performance problems with Lighthouse, traces, and
  bundle analysis. Use when a page loads or responds slowly, Core Web Vitals
  regress, or the JavaScript bundle grows. Not for an error or crash without
  slowness (use debugger).
---

# Performance Profiling

Measure first, change one thing, measure again. An optimisation without a
before-and-after number is a guess, and memoisation or caching added on a
guess usually costs more than it saves.

## Targets

These are the "good" thresholds at the 75th percentile of real users:

| Metric | Good | Lab proxy |
|---|---|---|
| LCP | ≤ 2.5 s | LCP |
| INP | ≤ 200 ms | TBT (≤ 200 ms) |
| CLS | ≤ 0.1 | CLS |

INP needs real interactions, so a Lighthouse navigation run cannot measure
it. Use TBT in the lab. Confirm INP with field data (CrUX, the site's RUM), or
with a Performance-panel trace of the slow interaction.

## Procedure

1. **Baseline.** Run the audit against a production build, not the dev
   server, and record the numbers:

   ```bash
   python3 .agents/skills/performance-profiling/scripts/lighthouse_audit.py <url>
   ```

   - It prints category scores, LCP, TBT, CLS, FCP, Speed Index, and the top
     five opportunities by estimated savings.
   - It fetches Lighthouse with `npx -y`, so it needs Node and network access.
   - Run it; do not read the source.
2. **Find the cause** with the tree below. Confirm the cause in a trace or a
   bundle report before changing code.
3. **Fix one cause.** For Next.js and React fixes, read
   `nextjs-react-expert` and its references.
4. **Re-measure** with the same command and conditions, and report both runs.
   Lab numbers vary between runs, so treat differences under about 10% as
   noise.

## What is slow?

```text
Initial load
├── LCP high ─ slow server response (TTFB)? → cache or stream the response
│            ─ LCP image late?             → preload or set priority, size it, no lazy-load above the fold
│            ─ render-blocking CSS or fonts? → inline critical CSS, font-display: swap
├── Large bundle → analyze it, split routes and heavy components, replace large dependencies
Interaction
├── TBT or INP high → long tasks: break up work, move it off the main thread, defer third-party scripts
├── Slow re-renders → React Profiler first; memoise only what the profile shows
Visual stability
└── CLS high → reserve space: width/height on media, fixed slots for ads and embeds, no layout-shifting font swaps
Memory
└── Heap grows across navigation → heap snapshots; clean up listeners, timers, and subscriptions
```

## Bundle analysis

- **Next.js 16.1 and later with Turbopack:** `npx next analyze`.
- **Next.js with webpack:** `@next/bundle-analyzer`, then `ANALYZE=true npm run build`.
- **Vite:** `rollup-plugin-visualizer`.

Look for duplicated libraries, a whole icon or UI library imported through a
barrel file, and server-only code in client bundles.

## Pitfalls

- A dev server hides or exaggerates problems. Always profile a production
  build.
- Throttling changes the results; keep the same device and network profile
  across runs.
- A higher Lighthouse score does not guarantee better field metrics. Report
  the metric that regressed, not only the score.

## Done when

The targeted metric improved between two comparable runs, the change is the
one that caused it, and nothing else regressed. Hand off to `verify-changes`
for the wider checks.
