---
name: database-design
description: >-
  Use when designing database schemas, choosing ORMs, planning migrations, optimizing queries, or working with Prisma, Drizzle, or raw SQL.
  Database design principles covering schema design, indexing strategy, serverless databases, and query optimization.
allowed-tools: Read Write Edit Glob Grep
---

# Database Design


> Strategic guidelines and procedures for the Database Design capability in this repository.

## 📑 Content Map

| File / Resource | Description | When to Read |
|:---|:---|:---|
| `SKILL.md` | Core guidelines, procedures, and best practices | Active throughout task execution |
| `agents/openai.yaml` | Codex UI and implicit invocation policy configuration | During skill indexing or UI setup |

## 🔗 Related Skills

| Skill | Relationship | When to Collaborate |
|:---|:---|:---|
| `frontend-specialist` | Parent Persona | For complete UX/UI and component architectural changes |
| `clean-code` | Quality Foundation | To ensure strict clean code, typing, and safety standards |




## 🎯 Selective Reading Rule

**Read ONLY files relevant to the request!** Check the content map, find what you need.

| File | Description | When to Read |
|------|-------------|--------------|
| `references/database-selection.md` | PostgreSQL vs Neon vs Turso vs SQLite | Choosing database |
| `references/orm-selection.md` | Drizzle vs Prisma vs Kysely | Choosing ORM |
| `references/schema-design.md` | Normalization, PKs, relationships | Designing schema |
| `references/indexing.md` | Index types, composite indexes | Performance tuning |
| `references/optimization.md` | N+1, EXPLAIN ANALYZE | Query optimization |
| `references/migrations.md` | Safe migrations, serverless DBs | Schema changes |

---

## ⚠️ Core Principle

- ASK user for database preferences when unclear
- Choose database/ORM based on CONTEXT
- Don't default to PostgreSQL for everything

---

## Decision Checklist

Before designing schema:

- [ ] Asked user about database preference?
- [ ] Chosen database for THIS context?
- [ ] Considered deployment environment?
- [ ] Planned index strategy?
- [ ] Defined relationship types?

---

## ❌ Anti-Patterns

❌ Default to PostgreSQL for simple apps (SQLite may suffice)
❌ Skip indexing
❌ Use SELECT * in production
❌ Store JSON when structured data is better
❌ Ignore N+1 queries

---

## Script

| Script | Purpose | Command |
|--------|---------|---------|
| `scripts/schema_validator.py` | Database schema validation | `python scripts/schema_validator.py <project_path>` |
