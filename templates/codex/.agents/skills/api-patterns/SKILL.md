---
name: api-patterns
description: >-
  Use when designing or reviewing REST, GraphQL, or tRPC contracts, response
  formats, pagination, versioning, authentication, or API protection.
  Provides API-style decisions and contract review guidance. NOT for
  frontend-only work or routine endpoint implementation.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# API Patterns

> API design principles and context-aware decision-making.
> **Learn to THINK, not copy fixed patterns.**

## 🎯 Selective Reading Rule

**Read ONLY files relevant to the request!** Check the content map, find what you need.

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| [references/api-style.md](references/api-style.md) | REST vs GraphQL vs tRPC decision tree | Choosing API type |
| [references/rest.md](references/rest.md) | Resource naming, HTTP methods, status codes | Designing REST API |
| [references/response.md](references/response.md) | Envelope pattern, error format, pagination | Response structure |
| [references/graphql.md](references/graphql.md) | Schema design, when to use, security | Considering GraphQL |
| [references/trpc.md](references/trpc.md) | TypeScript monorepo, type safety | TS fullstack projects |
| [references/versioning.md](references/versioning.md) | URI/Header/Query versioning | API evolution planning |
| [references/auth.md](references/auth.md) | JWT, OAuth, Passkey, API Keys | Auth pattern selection |
| [references/rate-limiting.md](references/rate-limiting.md) | Token bucket, sliding window | API protection |
| [references/documentation.md](references/documentation.md) | OpenAPI/Swagger best practices | Documentation |
| [references/security-testing.md](references/security-testing.md) | OWASP API Top 10, auth/authz testing | Security audits |

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| API implementation | [`backend-specialist`](../backend-specialist/SKILL.md) |
| Data structure | [`database-design`](../database-design/SKILL.md) |
| Security details | [`security-auditor`](../security-auditor/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When asked to design or review an API, apply only the steps relevant to the
requested scope. Use `backend-specialist` for routine implementation.

### Step 1: Identify API Consumers & Requirements
1. Determine who the primary consumers of the API will be (e.g., public developers, internal services, a single-page TypeScript frontend).
2. Clarify performance, caching, and real-time needs.

### Step 2: Choose the API Style
Use the decision tree in [references/api-style.md](references/api-style.md) to select the appropriate API architecture:
* Choose **REST** for public APIs or cross-platform applications.
* Choose **GraphQL** for highly complex, relational, or mobile-first applications.
* Choose **tRPC** for full-stack TypeScript monorepos.

### Step 3: Define Interface Contracts
* **For REST**: Follow the resource-naming and method conventions in [references/rest.md](references/rest.md).
* **For GraphQL**: Design a clean schema graph focusing on nullability and connections as per [references/graphql.md](references/graphql.md).
* **For tRPC**: Declare input/output schemas directly in TypeScript routers using a validation library (Zod) following [references/trpc.md](references/trpc.md).

### Step 4: Standardize Responses & Pagination
1. Establish a consistent response format appropriate to the API style using guidelines in [references/response.md](references/response.md).
2. Define a unified error schema that returns programmatic error codes without leaking internal details.
3. Select a pagination pattern only for collection operations that need it.

### Step 5: Implement Authentication & Security
1. If the API crosses a trust boundary, select an authentication pattern following [references/auth.md](references/auth.md).
2. If abuse, cost, or capacity risks apply, plan rate limiting using [references/rate-limiting.md](references/rate-limiting.md).
3. For security reviews or exposed APIs, use the checks in [references/security-testing.md](references/security-testing.md).

### Step 6: Validate & Document
1. When API source or OpenAPI files exist, run `python3 .agents/skills/api-patterns/scripts/api_validator.py <project_path>` from the project root.
2. For public or contract-driven HTTP APIs, document the interface following [references/documentation.md](references/documentation.md).

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

## ✅ Quality Audit Checklist

Before finalizing any API design or implementation task, verify the following:

- [ ] **API Style Alignment**: Selected REST, GraphQL, or tRPC based on the decision tree in `references/api-style.md`.
- [ ] **REST Conventions (if applicable)**: Resource paths use plural nouns, lowercase with hyphens, and proper HTTP verbs/status codes as defined in `references/rest.md`.
- [ ] **Response Consistency**: Success and error representations fit the chosen API style and do not leak internal details (see `references/response.md`).
- [ ] **Security & Auth**: Authentication and abuse controls are planned when the API's trust, cost, or capacity boundaries require them.
- [ ] **Security Auditing**: Exposed or security-sensitive APIs are checked against `references/security-testing.md`.
- [ ] **Validation & Verification**: Dynamic inputs are validated, and the bundled validator has been run when matching source or OpenAPI files exist.

---

## Script

| Script | Purpose | Command |
|:---|:---|:---|
| [`scripts/api_validator.py`](scripts/api_validator.py) | API source and OpenAPI sanity checks | `python3 .agents/skills/api-patterns/scripts/api_validator.py <project_path>` |
