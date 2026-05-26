---
name: api-patterns
description: >-
  Use when designing or reviewing API architecture, defining response formats,
  planning versioning strategy, or selecting REST vs GraphQL vs tRPC authentication patterns.
  Contains REST, GraphQL, and tRPC design principles, pagination, and auth standards.
  NOT for UI/frontend implementation.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# API Patterns

> API design principles and decision-making for 2025.
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

When asked to design, review, or implement an API, follow these sequential steps:

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
1. Establish a single, consistent response format across all endpoints using guidelines in [references/response.md](references/response.md).
2. Define a unified error schema that returns programmatic error codes without leaking internal details.
3. Select and apply the appropriate pagination pattern (Offset vs. Cursor vs. Keyset).

### Step 5: Implement Authentication & Security
1. Select the appropriate security pattern (JWT, Sessions, OAuth 2.0, Passkey, or API Keys) following [references/auth.md](references/auth.md).
2. Plan and enforce rate limiting using the principles in [references/rate-limiting.md](references/rate-limiting.md).
3. Perform security sanity checks against the OWASP API Top 10 checklist in [references/security-testing.md](references/security-testing.md).

### Step 6: Validate & Document
1. Run the validator script `python scripts/api_validator.py <project_path>` to ensure code and OpenAPI specs conform to best practices.
2. Provide complete OpenAPI documentation following [references/documentation.md](references/documentation.md).

---

## ❌ Anti-Patterns

**DON'T:**
- Default to REST for everything
- Use verbs in REST endpoints (/getUsers)
- Return inconsistent response formats
- Expose internal errors to clients
- Skip rate limiting

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
- [ ] **Response Consistency**: The API returns a unified response envelope and secure, detailed error schemas without leaking internal traces (see `references/response.md`).
- [ ] **Security & Auth**: Appropriate authentication (JWT/OAuth/Passkey) and rate-limiting headers are planned or verified (see `references/auth.md` and `references/rate-limiting.md`).
- [ ] **Security Auditing**: The API endpoints are checked against the OWASP API Top 10 guidelines in `references/security-testing.md`.
- [ ] **Validation & Verification**: Input validation is enforced on all dynamic parameters and `scripts/api_validator.py` has been executed.

---

## Script

| Script | Purpose | Command |
|:---|:---|:---|
| [`scripts/api_validator.py`](scripts/api_validator.py) | API endpoint validation | `python scripts/api_validator.py <project_path>` |
