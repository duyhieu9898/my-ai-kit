---
name: api-patterns
description: >-
  Chooses the API style (REST, GraphQL, tRPC, server actions) and sets
  contract conventions for errors, pagination, and versioning. Use when
  designing an API or endpoint shape, reviewing a contract or OpenAPI file, or
  planning a breaking change. Not for handler code (use backend-specialist).
---

# API Patterns

This skill owns two decisions: which API style a surface uses, and the
contract conventions every endpoint follows. Implementation belongs to
`backend-specialist`; data shape and indexes to `database-design`.

## Choose the style

Follow what the project already exposes. For a new surface:

- **Next.js app, only its own UI calls it:** server actions for mutations,
  server components or route handlers for reads. Treat every server action
  as a public POST endpoint: validate input and check authorization inside
  it.
- **TypeScript client and server in one repo, no outside consumers:** tRPC
  (v11). Not for mobile apps in another language or third parties.
- **Public, third-party, mobile, or webhook consumers:** REST with an
  OpenAPI document.
- **Many clients needing different shapes of a deep graph:** GraphQL, only
  if the team will run depth and cost limits and persisted queries.
- **Supabase:** the auto-generated PostgREST API plus RLS is already an API.
  Add a custom endpoint only for logic RLS cannot express.

Read [references/api-style.md](references/api-style.md) only when the choice
is contested and needs a written comparison. Read
[references/graphql.md](references/graphql.md) or
[references/trpc.md](references/trpc.md) when that style is chosen.

## REST contract defaults

Use these unless the project already has a convention.

- **Paths:** plural nouns, kebab-case, at most two nested levels
  (`/projects/{id}/tasks`). Actions that are not CRUD become a sub-resource
  (`POST /invoices/{id}/void`), not a verb path (`/voidInvoice`).
- **JSON:** `camelCase` fields, ids as strings, timestamps as ISO 8601 UTC
  (`2026-09-30T10:00:00Z`), money as integer minor units plus a currency
  code. Return the resource directly; no `{ success, data }` envelope unless
  the project uses one.
- **Status codes:** `201` with a `Location` header on create; `204` with no
  body on delete; `400` malformed; `401` unauthenticated; `403`
  authenticated but not allowed; `404` also for records the caller may not
  see (do not leak existence); `409` state conflict; `422` validation;
  `429` rate limited. Full table:
  [references/rest.md](references/rest.md).
- **Errors:** RFC 9457 Problem Details (`application/problem+json`), which
  replaced RFC 7807:

  ```json
  {
    "type": "https://example.com/errors/validation",
    "title": "Validation failed",
    "status": 422,
    "code": "validation_failed",
    "errors": [{ "field": "email", "message": "must be a valid email" }],
    "requestId": "req_123"
  }
  ```

  Clients branch on the stable `code`, never on `title` text. No stack
  traces, SQL, or internal hostnames.
- **Pagination:** cursor-based by default: `?limit=50&cursor=<opaque>`,
  response `{ "items": [...], "nextCursor": "..." | null }`. Cap `limit`
  (for example 100). The cursor encodes the sort key plus a unique
  tiebreaker (`created_at, id`), so the query uses an index and no row is
  skipped when rows are inserted. Use offset (`page`, `pageSize`) only for
  small admin tables that need page jumps. Omit totals unless required; a
  `count(*)` on each page is often the slow query.
- **Filtering and sorting:** `?status=open&sort=-createdAt`. Allow-list the
  sortable and filterable fields.
- **Partial updates:** `PATCH` with JSON Merge Patch semantics (RFC 7396):
  absent means unchanged, `null` means clear.
- **Idempotency:** accept an `Idempotency-Key` header on POSTs that create
  payments, orders, or messages, and return the stored response on a retry.
- **Concurrency:** return an `ETag` and honour `If-Match` (`412` on mismatch)
  where lost updates matter.
- **Response shape** alternatives (envelope, HAL, JSON:API):
  [references/response.md](references/response.md), only when the project
  already uses one.

## Versioning and breaking changes

- **Additive changes** (new optional field, new endpoint, new enum value
  that clients were told to tolerate) need no version.
- **Breaking changes:** removing or renaming a field, tightening
  validation, changing a type or a default, changing error codes.
  - Public REST: add `/v2` for the changed resources and keep `/v1` running
    with a `Deprecation` header (RFC 9745) and a `Sunset` date (RFC 8594).
  - Internal or tRPC and server actions: change the client and server in the
    same deploy, but remember that open browser tabs still run the old
    client until reload.
  - GraphQL: add the new field and mark the old one `@deprecated`; do not
    version the endpoint.
- Header or query-string versioning only when the project already does it:
  [references/versioning.md](references/versioning.md).

## Auth and abuse controls

- Browser clients: HTTP-only, `Secure`, `SameSite=Lax` session cookies, not
  tokens in `localStorage`. Machine clients: API keys or OAuth client
  credentials, hashed at rest, with scopes. Details:
  [references/auth.md](references/auth.md) when choosing a scheme.
- Authorize per object, not per route: the most common API flaw is
  returning another tenant's record by id (OWASP API1, BOLA).
- Rate-limit login, signup, password reset, and any endpoint that costs
  money or sends messages; return `429` with `Retry-After`. Read
  [references/rate-limiting.md](references/rate-limiting.md) when choosing an
  algorithm or headers.
- For an API security review, read
  [references/security-testing.md](references/security-testing.md), and use
  `security-auditor` for a full audit.

## Documentation

For a public or contract-first REST API, keep an OpenAPI 3.1 document next
to the code, preferably generated from the same Zod schemas that validate
requests. Read [references/documentation.md](references/documentation.md)
when writing it.

## Check

`python3 .agents/skills/api-patterns/scripts/api_validator.py [project_path]`

Run it; do not read the source. It takes one directory (default `.`) and
finds files by name or folder:

- **Sources:** `api.ts|js|py`, `*.api.ts|js`, `*_api.py`, `route.ts|js`, and
  any `.ts`, `.js`, `.py` under a folder named `api/`, `routes/`,
  `controllers/`, or `endpoints/`. A `server.js` or `app.ts` elsewhere is not
  scanned. `node_modules`, `dist`, `build`, `.next`, `test/`, and `tests/` are
  skipped.
- **OpenAPI:** `openapi.*`, `*.openapi.*`, and `swagger.*` in JSON or YAML.
  JSON is checked for version, `info.title`, `info.version`, and a
  `responses` block on each operation; YAML only for the root `openapi`,
  `info`, and `paths` keys.

Findings marked `[X]` fail the run (exit 1); `[!]` are advisory. Source-file
checks are keyword heuristics (does the file mention validation, auth, rate
limiting) and never fail the run. Exit 2 means no matching files were found.

## Done when

The chosen style fits the consumers, every endpoint in the change follows the
error, pagination, and status conventions above (or the project's own), any
breaking change has a migration path, per-object authorization is specified,
and the OpenAPI document, if the project has one, matches the code.
