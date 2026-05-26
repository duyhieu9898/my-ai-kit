---
name: nodejs-best-practices
description: >-
  Use when building Node.js backends, selecting frameworks, implementing async patterns, or validating APIs.
  Node.js development principles (Express, Fastify, NestJS, Hono), security, and architecture.
  NOT for frontend-only UI components or non-JavaScript backend stacks.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Node.js Best Practices

> Principles and decision-making for Node.js development in 2025.
> **Learn to THINK, not memorize code patterns.**

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| _No supplementary files_ | Main Node.js backend procedures are in this file | Use this file by default |

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| Designing clean API endpoints | [`api-patterns`](../api-patterns/SKILL.md) |
| Optimizing Next.js and React UIs | [`nextjs-react-expert`](../nextjs-react-expert/SKILL.md) |
| Writing high-performance unit/integration tests | [`test-engineer`](../test-engineer/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When tasked with building Node.js backends, configuring API routing services, or implementing async validation pipelines, strictly follow this step-by-step procedure:

### Step 1: Select Backend Framework
1. Query deployment target environments (serverless edge runtimes vs server/container environments).
2. Choose matching frameworks based on context decision trees (Hono, Fastify, NestJS, Express).

### Step 2: Define Runtime Modules & Configurations
1. Configure execution runtime engines (Node, Bun, Deno).
2. Prefer modern standard ESM module formats (`import/export`) and TypeScript-first stripping options (`--experimental-strip-types`).

### Step 3: Establish Layered Code Architecture
1. Layout repository paths dividing Controller, Service, and Repository layers.
2. Verify that Controllers manage solely HTTP payloads/boundaries, Services execute framework-agnostic business rules, and Repositories run DB adapters.

### Step 4: Implement Centralized Error & Boundary Schema Validations
1. Create unified Custom error formats and catch exceptions using global controller/route middlewares.
2. Bind validation schemas (Zod, Valibot) at network boundaries (body parser boundaries, env loader boundaries).

### Step 5: Setup Tests & Confirm Compliance
1. Implement test configurations utilizing built-in test runners (`node --test`) or specialized Vitest suites.
2. Validate the codebase structure using the **Quality Audit Checklist** before completing.

---

## 1. Framework Selection (2025)

### Decision Tree

```
What are you building?
│
├── Edge/Serverless (Cloudflare, Vercel)
│   └── Hono (zero-dependency, ultra-fast cold starts)
│
├── High Performance API
│   └── Fastify (2-3x faster than Express)
│
├── Enterprise/Team familiarity
│   └── NestJS (structured, DI, decorators)
│
├── Legacy/Stable/Maximum ecosystem
│   └── Express (mature, most middleware)
│
└── Full-stack with frontend
    └── Next.js API Routes or tRPC
```

### Comparison Principles

| Factor | Hono | Fastify | Express |
|--------|------|---------|---------|
| **Best for** | Edge, serverless | Performance | Legacy, learning |
| **Cold start** | Fastest | Fast | Moderate |
| **Ecosystem** | Growing | Good | Largest |
| **TypeScript** | Native | Excellent | Good |
| **Learning curve** | Low | Medium | Low |

### Selection Questions to Ask:
1. What's the deployment target?
2. Is cold start time critical?
3. Does team have existing experience?
4. Is there legacy code to maintain?

---

## 2. Runtime Considerations (2025)

### Native TypeScript

```
Node.js 22+: --experimental-strip-types
├── Run .ts files directly
├── No build step needed for simple projects
└── Consider for: scripts, simple APIs
```

### Module System Decision

```
ESM (import/export)
├── Modern standard
├── Better tree-shaking
├── Async module loading
└── Use for: new projects

CommonJS (require)
├── Legacy compatibility
├── More npm packages support
└── Use for: existing codebases, some edge cases
```

### Runtime Selection

| Runtime | Best For |
|---------|----------|
| **Node.js** | General purpose, largest ecosystem |
| **Bun** | Performance, built-in bundler |
| **Deno** | Security-first, built-in TypeScript |

---

## 3. Architecture Principles

### Layered Structure Concept

```
Request Flow:
│
├── Controller/Route Layer
│   ├── Handles HTTP specifics
│   ├── Input validation at boundary
│   └── Calls service layer
│
├── Service Layer
│   ├── Business logic
│   ├── Framework-agnostic
│   └── Calls repository layer
│
└── Repository Layer
    ├── Data access only
    ├── Database queries
    └── ORM interactions
```

### Why This Matters:
- **Testability**: Mock layers independently
- **Flexibility**: Swap database without touching business logic
- **Clarity**: Each layer has single responsibility

### When to Simplify:
- Small scripts → Single file OK
- Prototypes → Less structure acceptable
- Always ask: "Will this grow?"

---

## 4. Error Handling Principles

### Centralized Error Handling

```
Pattern:
├── Create custom error classes
├── Throw from any layer
├── Catch at top level (middleware)
└── Format consistent response
```

### Error Response Philosophy

```
Client gets:
├── Appropriate HTTP status
├── Error code for programmatic handling
├── User-friendly message
└── NO internal details (security!)

Logs get:
├── Full stack trace
├── Request context
├── User ID (if applicable)
└── Timestamp
```

### Status Code Selection

| Situation | Status | When |
|-----------|--------|------|
| Bad input | 400 | Client sent invalid data |
| No auth | 401 | Missing or invalid credentials |
| No permission | 403 | Valid auth, but not allowed |
| Not found | 404 | Resource doesn't exist |
| Conflict | 409 | Duplicate or state conflict |
| Validation | 422 | Schema valid but business rules fail |
| Server error | 500 | Our fault, log everything |

---

## 5. Async Patterns Principles

### When to Use Each

| Pattern | Use When |
|---------|----------|
| `async/await` | Sequential async operations |
| `Promise.all` | Parallel independent operations |
| `Promise.allSettled` | Parallel where some can fail |
| `Promise.race` | Timeout or first response wins |

### Event Loop Awareness

```
I/O-bound (async helps):
├── Database queries
├── HTTP requests
├── File system
└── Network operations

CPU-bound (async doesn't help):
├── Crypto operations
├── Image processing
├── Complex calculations
└── → Use worker threads or offload
```

### Avoiding Event Loop Blocking

- Never use sync methods in production (fs.readFileSync, etc.)
- Offload CPU-intensive work
- Use streaming for large data

---

## 6. Validation Principles

### Validate at Boundaries

```
Where to validate:
├── API entry point (request body/params)
├── Before database operations
├── External data (API responses, file uploads)
└── Environment variables (startup)
```

### Validation Library Selection

| Library | Best For |
|---------|----------|
| **Zod** | TypeScript first, inference |
| **Valibot** | Smaller bundle (tree-shakeable) |
| **ArkType** | Performance critical |
| **Yup** | Existing React Form usage |

### Validation Philosophy

- Fail fast: Validate early
- Be specific: Clear error messages
- Don't trust: Even "internal" data

---

## 7. Security Principles

### Security Checklist (Not Code)

- [ ] **Input validation**: All inputs validated
- [ ] **Parameterized queries**: No string concatenation for SQL
- [ ] **Password hashing**: bcrypt or argon2
- [ ] **JWT verification**: Always verify signature and expiry
- [ ] **Rate limiting**: Protect from abuse
- [ ] **Security headers**: Helmet.js or equivalent
- [ ] **HTTPS**: Everywhere in production
- [ ] **CORS**: Properly configured
- [ ] **Secrets**: Environment variables only
- [ ] **Dependencies**: Regularly audited

### Security Mindset

```
Trust nothing:
├── Query params → validate
├── Request body → validate
├── Headers → verify
├── Cookies → validate
├── File uploads → scan
└── External APIs → validate response
```

---

## 8. Testing Principles

### Test Strategy Selection

| Type | Purpose | Tools |
|------|---------|-------|
| **Unit** | Business logic | node:test, Vitest |
| **Integration** | API endpoints | Supertest |
| **E2E** | Full flows | Playwright |

### What to Test (Priorities)

1. **Critical paths**: Auth, payments, core business
2. **Edge cases**: Empty inputs, boundaries
3. **Error handling**: What happens when things fail?
4. **Not worth testing**: Framework code, trivial getters

### Built-in Test Runner (Node.js 22+)

```
node --test src/**/*.test.ts
├── No external dependency
├── Good coverage reporting
└── Watch mode available
```

---

## ❌ Anti-Patterns

- Use Express for new edge projects (use Hono)
- Use sync methods in production code
- Put business logic in controllers
- Skip input validation
- Hardcode secrets
- Trust external data without validation
- Block event loop with CPU work

---

## ✅ Quality Audit Checklist

Before concluding a Node.js backend setup or API validation task, verify compliance with the following:

- [ ] **Framework Context Checked**: Verified deployment runtime matches (Hono for Edge, Fastify/NestJS for server/containerized).
- [ ] **ESM Modules Preferred**: Module configurations use standard modern import/export syntax.
- [ ] **Layered Separation Complete**: Business logic lies solely within the Service layer, separate from Controllers and Repository adapters.
- [ ] **Centralized Error Catch Active**: Centralized middleware intercepts errors without spilling internal stack traces to clients.
- [ ] **Boundary Validation Bound**: Validation rules (Zod/Valibot) block invalid requests at controller boundaries.
- [ ] **Secure Operations Configured**: Parameterized DB queries, Helmet.js headers, Argon2 hashing, and environment secrets are active.

---

> **Remember**: Node.js best practices are about decision-making, not memorizing patterns. Every project deserves fresh consideration based on its requirements.
