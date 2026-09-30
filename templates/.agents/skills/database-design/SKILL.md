---
name: database-design
description: >-
  Designs schemas, indexes, and safe migrations for PostgreSQL, Supabase, and
  MongoDB. Use when adding or changing tables, collections, columns,
  constraints, indexes, row-level security policies, or migrations, or when a
  query is slow. Not for application request handling (use
  backend-specialist).
---

# Database Design

Schema mistakes outlive the code that made them. Two situations cause most of
the pain: a migration that locks a busy table, and a missing index that only
shows up at production data volume. Plan for both before writing the change.

## Defaults

- **Tools:** use the project's database, ORM or query builder, and migration
  tool. Do not add a second one.
- **Applied migrations:** never edit one. Write a new migration that moves
  forward.
- **Business rules as constraints:** `NOT NULL`, `UNIQUE`, `CHECK`, and foreign
  keys, in addition to validation in code.

## PostgreSQL

- **Column types:**
  - Keys: `bigint generated always as identity`, or `uuid` (v7 when the
    project generates it, for index locality).
  - Time: `timestamptz`, not `timestamp`.
  - Strings: `text` plus a `CHECK` on length, not `varchar(n)`.
- **Foreign keys are not indexed automatically.** Add an index on every
  foreign key column that is filtered or joined on, or deletes on the parent
  table scan the child.
- **Composite index order:** equality columns first, then range or sort
  columns. Add a partial index (`WHERE deleted_at IS NULL`) when queries
  always carry that filter.
- **Checking a query:** use `EXPLAIN (ANALYZE, BUFFERS)` on realistic data. A
  plan on an empty development table proves nothing.

### Safe migrations on live tables

Use an expand, migrate, contract sequence. Each step is its own deploy.

1. **Add** the new column as nullable, with no volatile default.
2. **Backfill** in batches, not one `UPDATE` over the whole table.
3. **Enforce NOT NULL without a long lock:**
   1. `ADD CONSTRAINT … CHECK (col IS NOT NULL) NOT VALID`
   2. `VALIDATE CONSTRAINT`
   3. `SET NOT NULL` (Postgres 12+ skips the scan when a valid check exists)
4. **Switch** the application to the new column, then drop the old one in a
   later release.

Also:

- **Indexes on busy tables:** `CREATE INDEX CONCURRENTLY`. It cannot run
  inside a transaction, so check whether the migration tool wraps each file
  in one.
- **Timeouts:** set `lock_timeout` (for example, `'5s'`) at the top of
  migrations that take locks, so a blocked migration fails instead of queuing
  every other query behind it.
- **Renames and type changes:** follow the same expand and contract steps.
  Never rename in place while the old code still runs.

## Supabase

- **Row-level security:** enable RLS on every table in an exposed schema, and
  write a policy for each operation the client performs.
  - In policies, write `(select auth.uid())` rather than `auth.uid()`, so
    Postgres evaluates it once per query instead of once per row.
  - Index the columns that policies filter on.
- **Migrations:** create them with `supabase migration new <name>`, or
  generate them from local changes with `supabase db diff`. Regenerate types
  after a schema change with `supabase gen types typescript`.
- **Service role key:** the `service_role` key bypasses RLS, so it is for
  server code only.

## MongoDB

- **Embed or reference** by access pattern:
  - Embed data that is read together and bounded in size.
  - Reference data that grows without limit, such as comments or events.
  - Documents are capped at 16 MB, and very large arrays degrade updates.
- **Schema:** enforce it with a `$jsonSchema` validator on the collection, or
  with the project's Mongoose schemas.
- **Compound indexes** follow the ESR rule: Equality fields, then Sort, then
  Range. Check queries with `explain("executionStats")` and compare
  `totalDocsExamined` with `nReturned`.
- **Transactions** need a replica set; local development often needs one
  started explicitly.

## Check

For a Prisma schema, run the validator; do not read its source:

`python3 .agents/skills/database-design/scripts/schema_validator.py <project>`

It lists naming problems, relations without an index, and similar
suggestions. It always exits 0, so read the `issues` in its JSON output. It
only understands Prisma schemas.

## Done when

The migration runs forward on a copy of realistic data without long locks,
queries on the changed tables use the intended indexes, constraints encode
the business rules, and, on Supabase, RLS policies cover each client
operation.
