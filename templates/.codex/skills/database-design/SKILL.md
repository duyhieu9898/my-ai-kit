---
name: database-design
description: >-
  Use when designing database schemas, choosing ORMs, planning migrations, optimizing queries, or working with Prisma, Drizzle, or raw SQL.
  Database design principles covering schema design, indexing strategy, serverless databases, and query optimization.
  NOT for frontend-only data display without schema or query changes.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Database Design

> **Learn to THINK, not copy SQL patterns.**

## 🎯 Selective Reading Rule

**Read ONLY files relevant to the request!** Check the content map, find what you need.

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| [references/database-selection.md](references/database-selection.md) | PostgreSQL vs Neon vs Turso vs SQLite | Choosing database |
| [references/orm-selection.md](references/orm-selection.md) | Drizzle vs Prisma vs Kysely | Choosing ORM |
| [references/schema-design.md](references/schema-design.md) | Normalization, PKs, relationships | Designing schema |
| [references/indexing.md](references/indexing.md) | Index types, composite indexes | Performance tuning |
| [references/optimization.md](references/optimization.md) | N+1, EXPLAIN ANALYZE | Query optimization |
| [references/migrations.md](references/migrations.md) | Safe migrations, serverless DBs | Schema changes |
| [scripts/schema_validator.py](scripts/schema_validator.py) | Database schema validation script | Validating schema changes |

---

## 🔗 Related Skills

| Skill | Relationship | When to Use Together |
|:---|:---|:---|
| [`database-architect`](../database-architect/SKILL.md) | Broader database architecture decisions | When schema work affects platform, scale, or production data |
| [`backend-specialist`](../backend-specialist/SKILL.md) | Application data access and APIs | When schema changes affect backend services or auth |
| [`api-patterns`](../api-patterns/SKILL.md) | API contracts and pagination | When database models shape resource design or response formats |
| [`devops-engineer`](../devops-engineer/SKILL.md) | Production migration safety | When migrations require deployment, backup, or rollback planning |

---

## 🛠️ Instructions / Procedures

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
|:---|:---|:---|
| [scripts/schema_validator.py](scripts/schema_validator.py) | Database schema validation | `python3 scripts/schema_validator.py <project_path>` |

---

## ✅ Quality Audit Checklist

- [ ] Database and ORM choices match the project context and deployment environment.
- [ ] Core entities, relationships, primary keys, and foreign keys are explicit.
- [ ] Query patterns have corresponding index and pagination strategies.
- [ ] Migration plan accounts for rollback and production safety.
- [ ] Schema avoids unnecessary JSON blobs, `SELECT *`, and missing constraints.
- [ ] `scripts/schema_validator.py` was considered or run for schema validation.
