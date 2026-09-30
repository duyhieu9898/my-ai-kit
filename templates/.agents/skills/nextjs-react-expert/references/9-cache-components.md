# 9. Cache Components: `use cache`, `cacheLife`, `cacheTag`

> **Applies to:** Next.js 16+ with `cacheComponents: true` in `next.config.ts`.
> Check `package.json` and the config first. On Next.js 15 or with the flag
> off, the previous caching model applies (`fetch` options, `unstable_cache`,
> route segment `revalidate`).

Contents: 1. Enabling · 2. `use cache` · 3. `cacheLife` · 4. `cacheTag` and
invalidation · 5. Prerendering and Suspense · 6. Pitfalls

## 1. Enabling

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
}

export default nextConfig
```

- `cacheComponents` replaces `experimental.dynamicIO`, `experimental.useCache`,
  and `experimental.ppr`.
- With the flag on, route segment configs `dynamic`, `revalidate`,
  `fetchCache`, and `dynamicParams` (and `experimental_ppr`) are build errors.
  Replace `export const revalidate = 3600` with `use cache` plus `cacheLife`.

## 2. The `use cache` directive

Put it at the top of an async function, a Server Component, or a whole file.
Cache the narrowest unit that is expensive and shared.

```tsx
// Function-level caching
async function getProduct(id: string) {
  'use cache'
  return db.product.findUnique({ where: { id } })
}

// Component-level caching
export default async function ProductCard({ id }: { id: string }) {
  'use cache'
  const product = await getProduct(id)
  return <div>{product.name}</div>
}
```

Arguments and closed-over values become part of the cache key, so they must
be serializable.

## 3. `cacheLife`

```tsx
import { cacheLife } from 'next/cache'

async function getStockInfo() {
  'use cache'
  cacheLife('minutes')
  return fetchStocks()
}
```

Preset profiles (from the Next.js `cacheLife` docs):

| Profile | `stale` | `revalidate` | `expire` |
|---|---|---|---|
| `default` (used when `cacheLife` is not called) | 5m | 15m | never |
| `seconds` | 30s | 1s | 60s |
| `minutes` | 5m | 1m | 1h |
| `hours` | 5m | 1h | 1d |
| `days` | 5m | 1d | 1w |
| `weeks` | 5m | 1w | 30d |
| `max` | 5m | 30d | 1y |

- `stale`: how long the client uses the value without checking the server.
- `revalidate`: after this, the next request gets the cached value and
  triggers a background refresh.
- `expire`: after this with no request, the next request waits for fresh data.

Custom profiles go in `next.config.ts` under `cacheLife: { blog: { stale,
revalidate, expire } }` (seconds), or inline as
`cacheLife({ stale: 60, revalidate: 300, expire: 3600 })`.

A short-lived cache (`seconds`, `revalidate: 0`, or `expire` under 5 minutes)
is excluded from prerenders and becomes a dynamic hole, so it needs a
`<Suspense>` boundary like any request-time data.

## 4. `cacheTag` and invalidation

```tsx
import { cacheTag } from 'next/cache'

async function getProfile(userId: string) {
  'use cache'
  cacheTag(`profile-${userId}`)
  return db.user.findUnique({ where: { id: userId } })
}
```

Choose the invalidation API by behaviour:

```tsx
'use server'
import { revalidateTag, updateTag } from 'next/cache'

export async function updateProfile(userId: string, data: ProfileInput) {
  await db.user.update({ where: { id: userId }, data })

  // Read-your-own-writes: the next request waits for fresh data.
  // Server Actions only; it throws anywhere else.
  updateTag(`profile-${userId}`)
}

// In a Route Handler or webhook, use stale-while-revalidate instead:
revalidateTag(`profile-${userId}`, 'max')
```

- `revalidateTag(tag, profile)` takes a cache profile as its second argument.
  `'max'` is the recommended value: cached data is served while it refreshes.
  `{ expire: 0 }` serves no stale data.
- Calling `revalidateTag(tag)` with one argument is deprecated in Next.js 16
  and behaves like `{ expire: 0 }`. Migrate it to `updateTag` in Server
  Actions or to `revalidateTag(tag, 'max')` elsewhere.
- `revalidatePath` is unchanged.
- Revalidation is triggered by the next request for the tag, not by the call
  itself.

## 5. Prerendering and Suspense

With `cacheComponents` on, a route is prerendered into a static shell, and
anything uncached or request-time streams in later (this is what was called
Partial Prerendering). Every access to uncached data outside `<Suspense>` is a
build error: `fetch`, database calls, `cookies()`, `headers()`, `params`,
`searchParams`, and `connection()`.

Fix each hit in one of three ways:

- **Stream it:** wrap the component that reads the data in `<Suspense>`.
- **Cache it:** move the data access into a `use cache` function (does not
  apply to `connection()` or request APIs).
- **Block the route:** only when streaming is unacceptable.

```tsx
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function Page() {
  return (
    <main>
      <h1>Static header</h1>
      <Suspense fallback={<Skeleton />}>
        <UserDashboard />
      </Suspense>
    </main>
  )
}
```

## 6. Pitfalls

- **Request APIs inside a cached scope:** `cookies()`, `headers()`, and
  `searchParams` cannot be read inside `use cache`, including in helpers it
  calls (`next-request-in-use-cache`). On a dynamic route this can pass
  `next build` and fail under `next start`. Read the value outside and pass
  it as an argument:

  ```tsx
  async function UserNav() {
    const team = (await cookies()).get('team')?.value
    const topics = await getTopics(team) // team becomes part of the key
    return <Nav topics={topics} />
  }

  async function getTopics(team: string | undefined) {
    'use cache'
    return db.topics.forTeam(team)
  }
  ```

- **Mutations inside a cached scope:** do not call `revalidateTag`,
  `updateTag`, or `revalidatePath` inside `use cache`. Mutate and invalidate
  from a Server Action or Route Handler.
- **Per-user data:** do not cache per-user data under a shared key. Pass the
  user or team id as an argument, or leave it uncached.
