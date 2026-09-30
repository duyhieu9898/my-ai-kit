---
name: nextjs-react-expert
description: >-
  Applies 58 prioritized Next.js and React performance rules and Next.js 16
  Cache Components guidance. Use when fixing request waterfalls, a large
  client bundle, slow server rendering, or excess re-renders, or when writing
  use cache or cacheTag. Not for profiling (use performance-profiling).
---

# Next.js and React Performance

The rules live in `references/`, one file per category, each rule with an
incorrect and a correct example. Read only the file that matches the problem.
Measuring (Lighthouse, traces, bundle analysis) belongs to
`performance-profiling`; this skill is for the fix.

## Before changing anything

1. **Check versions** in `package.json`: Next.js major, React major and minor,
   and whether `next.config.*` sets `cacheComponents: true`. Several rules
   depend on them (see Pitfalls).
2. **Follow the project's data library.** If it uses TanStack Query, SWR, or
   plain Server Components, keep that. The SWR examples in
   `references/4-...` translate directly to `useQuery`.
3. **Check for React Compiler** (`babel-plugin-react-compiler` or
   `reactCompiler` in the Next config). With it on, skip manual `useMemo`,
   `useCallback`, and `memo` rules unless a profile shows the compiler
   bailed out.

## Priority order

Fix in this order, because the earlier categories cost the most:

1. **Waterfalls:** each sequential await adds a full network round trip.
   Read [references/1-async-eliminating-waterfalls.md](references/1-async-eliminating-waterfalls.md)
   for sequential `await`s, slow API routes, or missing Suspense boundaries.
2. **Bundle size:** read
   [references/2-bundle-bundle-size-optimization.md](references/2-bundle-bundle-size-optimization.md)
   for a large First Load JS, barrel imports, heavy editors, charts, or
   third-party scripts.
3. **Server:** read
   [references/3-server-server-side-performance.md](references/3-server-server-side-performance.md)
   for Server Actions, RSC props serialization, `React.cache()`, LRU caching,
   or `after()`.
4. **Client data:** read
   [references/4-client-client-side-data-fetching.md](references/4-client-client-side-data-fetching.md)
   for duplicate client requests, global event listeners, or `localStorage`.
5. **Re-renders:** read
   [references/5-rerender-re-render-optimization.md](references/5-rerender-re-render-optimization.md)
   when typing or scrolling lags, or the React Profiler shows repeated renders.
6. **Rendering:** read
   [references/6-rendering-rendering-performance.md](references/6-rendering-rendering-performance.md)
   for hydration mismatches, long lists, SVG animation, or show/hide state.
7. **JavaScript hot paths:** read
   [references/7-js-javascript-performance.md](references/7-js-javascript-performance.md)
   only when a profile points at a loop, lookup, or layout thrashing.
8. **Advanced patterns:** read
   [references/8-advanced-advanced-patterns.md](references/8-advanced-advanced-patterns.md)
   for init-once code and stable handler refs.

For caching on Next.js 16 with `cacheComponents`, read
[references/9-cache-components.md](references/9-cache-components.md) before
writing `use cache`, `cacheLife`, `cacheTag`, `updateTag`, or `revalidateTag`.

## Pitfalls

- **`revalidateTag` changed in Next.js 16.** The one-argument form is
  deprecated. Use `updateTag(tag)` in Server Actions for read-your-own-writes,
  or `revalidateTag(tag, 'max')` in Route Handlers and webhooks.
- **Cache Components break old segment config.** With `cacheComponents: true`,
  `export const revalidate`, `dynamic`, and `fetchCache` are build errors, and
  uncached data outside `<Suspense>` fails the build.
- **Request APIs inside `use cache`** (`cookies()`, `headers()`,
  `searchParams`) throw at request time, and may pass `next build`. Read them
  outside and pass the value as an argument.
- **Barrel imports in Next.js:** `lucide-react`, `@mui/material`, `date-fns`,
  `lodash-es`, and similar packages are already in Next's default
  `optimizePackageImports` list. Do not rewrite their imports by hand. Do
  handle internal workspace packages.
- **Server Actions are public endpoints.** Authenticate and authorize inside
  every action (Rule 3.1), even if the page that calls it is protected.
- **Version-gated APIs:** `after()` needs Next.js 15.1+; `<Activity>` and
  `useEffectEvent` need React 19.2+.
- **Dependent awaits are not waterfalls.** Parallelize only independent work;
  a small barrel file in app code is usually fine.

## Done when

The fix matches a rule in the relevant reference, independent requests run in
parallel, no new client bundle weight was added without a dynamic import, and
the project's build and type checks pass. For before/after numbers, hand off
to `performance-profiling`; for the wider checks, `verify-changes`.
