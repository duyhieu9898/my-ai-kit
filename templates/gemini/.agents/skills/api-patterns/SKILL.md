---
name: api-patterns
description: >-
  Use when designing or reviewing REST, GraphQL, or tRPC contracts, response
  formats, pagination, versioning, authentication, or API protection.
  Provides API-style decisions and contract review guidance. NOT for
  frontend-only work or routine endpoint implementation.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# API Patterns

> API design principles and context-aware decision-making.
> **Learn to THINK, not copy fixed patterns.**

## 🎯 Selective Reading Rule

**Read ONLY files relevant to the request!** Check the content map, find what you need.

---

## 📑 Content Map

| File | Description | When to Read |
|------|-------------|--------------|
| `api-style.md` | REST vs GraphQL vs tRPC decision tree | Choosing API type |
| `rest.md` | Resource naming, HTTP methods, status codes | Designing REST API |
| `response.md` | Envelope pattern, error format, pagination | Response structure |
| `graphql.md` | Schema design, when to use, security | Considering GraphQL |
| `trpc.md` | TypeScript monorepo, type safety | TS fullstack projects |
| `versioning.md` | URI/Header/Query versioning | API evolution planning |
| `auth.md` | JWT, OAuth, Passkey, API Keys | Auth pattern selection |
| `rate-limiting.md` | Token bucket, sliding window | API protection |
| `documentation.md` | OpenAPI/Swagger best practices | Documentation |
| `security-testing.md` | OWASP API Top 10, auth/authz testing | Security audits |

---

## 🔗 Related Skills

| Need | Skill |
|------|-------|
| API implementation | `backend-specialist` |
| Data structure | `database-design` |
| Security details | `security-auditor` |

---

## 🛠️ Workflow

Apply only the steps relevant to the requested design or review:

1. Identify consumers, trust boundaries, caching, performance, and real-time needs.
2. Choose an API style with `api-style.md`; do not redesign an established API without a concrete reason.
3. Define interface, error, compatibility, and pagination contracts relevant to the request.
4. Select authentication, rate limiting, and security review only when the trust, abuse, cost, or capacity model requires them.
5. For public or contract-driven HTTP APIs, document the interface with `documentation.md`.
6. When matching source or OpenAPI files exist, run `python3 .agents/skills/api-patterns/scripts/api_validator.py <project_path>` from the project root.

---

## ❌ Anti-Patterns

**DON'T:**
- Default to REST for everything
- Use verbs in REST endpoints (/getUsers)
- Return inconsistent response formats
- Expose internal errors to clients
- Skip abuse controls when the threat or capacity model requires them

**DO:**
- Choose API style based on context
- Ask about client requirements
- Document thoroughly
- Use appropriate status codes

---

## Script

| Script | Purpose | Command |
|--------|---------|---------|
| `scripts/api_validator.py` | API source and OpenAPI sanity checks | `python3 .agents/skills/api-patterns/scripts/api_validator.py <project_path>` |
