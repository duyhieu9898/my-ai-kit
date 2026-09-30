---
name: backend-specialist
description: >-
  Builds and fixes Node.js and TypeScript backend code: route handlers,
  services, background jobs, auth wiring, and database access. Use when adding
  or changing server-side behaviour in Express, Fastify, Hono, NestJS, or
  Next.js route handlers and server actions. Not for API contract design (use
  api-patterns).
---

# Backend Specialist (Node.js)

Server code fails quietly: a missing `await`, an unvalidated field, or a
leaked connection works in development and breaks under load. Most of what
follows is about those failure modes, not about architecture taste.

## Defaults

- **Framework and layout:** follow the project's framework, folder layout, and
  error-response shape. For a new service, pick by deploy target:
  - Next.js route handlers or server actions inside a Next app;
  - Hono for edge or Workers runtimes;
  - Fastify or Express for a long-running Node server.
- **Validation:** validate every external input at the boundary (body, query,
  params, headers, webhook payloads) with the project's schema library (Zod by
  default), and derive the TypeScript type from the schema.
- **Authorization:** check it per resource, not just per route. "Is this user
  allowed to touch *this* record?" is the check most often missing. For API
  shape, see `api-patterns`; for a security review, see `security-auditor`.
- **Auth libraries:** use the project's, or an established one (Better Auth,
  Auth.js, Supabase Auth, Clerk). Do not hand-roll sessions or JWT handling.
  Lucia is deprecated as a library. Hash passwords with argon2id, or bcrypt
  if that is what the project uses.
- **Secrets** come from the environment. Do not log them, or request bodies
  that may contain them.

## Node runtime facts

- **Versions:** target the active LTS line the project pins (`engines`,
  `.nvmrc`). Node 22.18+ and 23.6+ run `.ts` files directly by stripping
  types, but only erasable syntax. `enum`, `namespace`, and constructor
  parameter properties still need a build step or
  `--experimental-transform-types`. Imports must include the `.ts`
  extension.
- **Built-ins before dependencies:** `fetch`, `node --env-file=.env`,
  `node --watch`, `node:test`, and `AbortSignal.timeout(ms)`.
- **Outbound calls:** give every one a timeout (`signal:
  AbortSignal.timeout(…)`). A hung upstream otherwise holds the request and
  its connection forever.

## Async pitfalls

- **`return await`:** inside `try`, `return await promise` is needed for
  `catch` to see the rejection. Plain `return promise` escapes it.
- **`Promise.all`** fails fast and leaves the other promises running. Use
  `Promise.allSettled` when partial results are acceptable.
- **Bounded concurrency:** do not `Promise.all` over an unbounded list of
  outbound calls; batch them or use a limiter such as `p-limit`.
- **Event loop:** sync `fs`, `crypto.*Sync`, or a huge `JSON.parse` on the
  request path blocks every other request. Sync reads at startup are fine.
- **Unhandled rejections** crash the process by default. Let the process
  manager restart it, and do not swallow the rejection globally.
- **Graceful shutdown:** on `SIGTERM`, stop accepting connections, let
  in-flight requests finish, then close database pools and queues.

## Database access

- **Supabase / Postgres from serverless** (Vercel, Workers): connect through
  the pooler in transaction mode (port 6543) and disable prepared statements
  (`prepare: false` in postgres.js; `pgbouncer=true` on the Prisma URL). Use
  the direct connection only for migrations.
- **MongoDB:** create one `MongoClient` per process and reuse it. In Next.js
  development, cache it on `globalThis`, or hot reload opens a new pool on
  every edit.
- **Supabase keys:** never send the `service_role` key to the browser, because
  it bypasses row-level security. For schema, index, and migration work, use
  `database-design`.

## Done when

The changed endpoint validates input, checks authorization for the specific
resource, handles errors in the project's response shape, and puts a timeout
on every outbound call. Hand off to `verify-changes` for tests and checks.
