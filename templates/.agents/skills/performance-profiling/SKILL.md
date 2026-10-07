---
name: performance-profiling
description: >-
  Measures web performance with Lighthouse, traces, and bundle analysis, then
  fixes the cause with 46 prioritized Next.js and React rules and Next.js 16
  Cache Components guidance. Use when a page loads or responds slowly, Core
  Web Vitals regress, the bundle grows, requests waterfall, or re-renders lag,
  or when writing use cache or cacheTag.
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
2. **Find the cause** with the tree below. Confirm it in a trace or a bundle
   report before changing code.
3. **Fix one cause.** For Next.js and React, read the matching rule file
   below.
4. **Re-measure** with the same command and conditions, and report both runs.
   Lab numbers vary between runs, so treat differences under about 10% as
   noise.

Skip the baseline only for a known code-level pattern, such as a sequential
`await` on independent requests or a `use cache` change; still run the build.

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

## Next.js and React fixes

Before changing code, check `package.json` for the Next.js and React
versions and `next.config.*` for `cacheComponents: true` and React Compiler
(`reactCompiler` or `babel-plugin-react-compiler`). With the compiler on, skip
manual `useMemo`, `useCallback`, and `memo` rules unless a profile shows it
bailed out. Keep the project's data library; the SWR examples translate
directly to TanStack Query.

Each file holds rules with an incorrect and a correct example. Read only the
one that matches the cause, in this priority order:

1. **Waterfalls:** [references/1-async-eliminating-waterfalls.md](references/1-async-eliminating-waterfalls.md)
   for sequential `await`s, slow API routes, or missing Suspense boundaries.
2. **Bundle size:** [references/2-bundle-bundle-size-optimization.md](references/2-bundle-bundle-size-optimization.md)
   for a large First Load JS, barrel imports, heavy editors, charts, or
   third-party scripts.
3. **Server:** [references/3-server-server-side-performance.md](references/3-server-server-side-performance.md)
   for Server Actions, RSC props serialization, `React.cache()`, LRU caching,
   or `after()`.
4. **Client data:** [references/4-client-client-side-data-fetching.md](references/4-client-client-side-data-fetching.md)
   for duplicate client requests, global event listeners, or `localStorage`.
5. **Re-renders:** [references/5-rerender-re-render-optimization.md](references/5-rerender-re-render-optimization.md)
   when typing or scrolling lags, or the Profiler shows repeated renders.
6. **Rendering:** [references/6-rendering-rendering-performance.md](references/6-rendering-rendering-performance.md)
   for hydration mismatches, long lists, SVG animation, or show/hide state.
7. **Advanced patterns:** [references/8-advanced-advanced-patterns.md](references/8-advanced-advanced-patterns.md)
   for init-once code and stable handler refs.

For caching on Next.js 16 with `cacheComponents`, read
[references/9-cache-components.md](references/9-cache-components.md) before
writing `use cache`, `cacheLife`, `cacheTag`, `updateTag`, or `revalidateTag`.

## Pitfalls

- A dev server hides or exaggerates problems, and throttling changes results.
  Profile a production build with the same device and network profile.
- A higher Lighthouse score does not guarantee better field metrics. Report
  the metric that regressed, not only the score.
- **`revalidateTag` changed in Next.js 16.** The one-argument form is
  deprecated. Use `updateTag(tag)` in Server Actions for read-your-own-writes,
  or `revalidateTag(tag, 'max')` in Route Handlers and webhooks.
- **Cache Components break old segment config.** With `cacheComponents: true`,
  `export const revalidate`, `dynamic`, and `fetchCache` are build errors, and
  uncached data outside `<Suspense>` fails the build.
- **Request APIs inside `use cache`** (`cookies()`, `headers()`,
  `searchParams`) throw at request time and may pass `next build`. Read them
  outside and pass the value as an argument.
- **Barrel imports:** `lucide-react`, `@mui/material`, `date-fns`, `lodash-es`,
  and similar packages are already in Next's default `optimizePackageImports`
  list. Do not rewrite their imports by hand; do handle internal workspace
  packages.
- **Server Actions are public endpoints.** Authenticate and authorize inside
  every action (Rule 3.1), even if the calling page is protected.
- **Version-gated APIs:** `after()` needs Next.js 15.1+; `<Activity>` and
  `useEffectEvent` need React 19.2+.
- **Dependent awaits are not waterfalls.** Parallelize only independent work.
- **Layout thrashing:** in a loop, read all layout values (`offsetHeight`,
  `getBoundingClientRect()`) before writing styles; interleaving forces a
  reflow per iteration.
- **`sort()` mutates props and state.** Use `toSorted()` (or copy first)
  inside render and `useMemo`.

## Done when

The targeted metric improved between two comparable runs (or, for a
code-level fix, the change matches a rule in the relevant reference), the
change is the one that caused it, no client bundle weight was added without a
dynamic import, and the build and type checks pass.
