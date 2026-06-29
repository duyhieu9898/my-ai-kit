---
name: python-patterns
description: >-
  Use when writing Python code, selecting frameworks, implementing type hints, or structuring Python projects.
  Python development principles (FastAPI, Django, Flask), async vs sync, and Pydantic validation.
  NOT for non-Python backend stacks or frontend-only implementation work.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Python Patterns

> Python development principles and decision-making for 2025.
> **Learn to THINK, not memorize patterns.**

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| _No supplementary files_ | Main Python development procedures are in this file | Use this file by default |

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| Node.js backend development paradigms | [`nodejs-best-practices`](../nodejs-best-practices/SKILL.md) |
| CPU profiling and asynchronous performance tuning | [`performance-optimizer`](../performance-optimizer/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When tasked with designing Python backend services, building API routes, or debugging concurrency conflicts, strictly follow this step-by-step procedure:

### Step 1: Select the Framework
1. Match project goals with appropriate frameworks (FastAPI for APIs/AI models serving, Django for batteries-included full-stack admins, Flask for simple scripts).
2. Ask about user preferences when ambiguous.

### Step 2: Define Concurrency Models
1. Decide sync vs async based on I/O bounds vs CPU workloads.
2. Select appropriate non-blocking dependencies (httpx for HTTP requests, asyncpg for Postgres).

### Step 3: Implement Schema Typing Hints
1. Define type parameters for arguments and returns across public APIs.
2. Build structured Pydantic v2 schemas for runtime data validation.

### Step 4: Map Folder Directories
1. Set up clean separation of concerns: routes/controllers -> business services -> DB models.
2. Structure small scripts into standard modules.

### Step 5: Establish Exception Handlers & Verify Checklist
1. Build domain exception models to map custom HTTP errors cleanly without exposing internals.
2. Run pytest suites and verify against the **Quality Audit Checklist** before completing.

---

## ⚠️ How to Use This Skill

This skill teaches **decision-making principles**, not fixed code to copy.

- ASK user for framework preference when unclear
- Choose async vs sync based on CONTEXT
- Don't default to same framework every time

---

## 1. Framework Selection (2025)

### Decision Tree

```
What are you building?
│
├── API-first / Microservices
│   └── FastAPI (async, modern, fast)
│
├── Full-stack web / CMS / Admin
│   └── Django (batteries-included)
│
├── Simple / Script / Learning
│   └── Flask (minimal, flexible)
│
├── AI/ML API serving
│   └── FastAPI (Pydantic, async, uvicorn)
│
└── Background workers
    └── Celery + any framework
```

### Comparison Principles

| Factor | FastAPI | Django | Flask |
|--------|---------|--------|-------|
| **Best for** | APIs, microservices | Full-stack, CMS | Simple, learning |
| **Async** | Native | Django 5.0+ | Via extensions |
| **Admin** | Manual | Built-in | Via extensions |
| **ORM** | Choose your own | Django ORM | Choose your own |
| **Learning curve** | Low | Medium | Low |

### Selection Questions to Ask:
1. Is this API-only or full-stack?
2. Need admin interface?
3. Team familiar with async?
4. Existing infrastructure?

---

## 2. Async vs Sync Decision

### When to Use Async

```
async def is better when:
├── I/O-bound operations (database, HTTP, file)
├── Many concurrent connections
├── Real-time features
├── Microservices communication
└── FastAPI/Starlette/Django ASGI

def (sync) is better when:
├── CPU-bound operations
├── Simple scripts
├── Legacy codebase
├── Team unfamiliar with async
└── Blocking libraries (no async version)
```

### The Golden Rule

```
I/O-bound → async (waiting for external)
CPU-bound → sync + multiprocessing (computing)

Don't:
├── Mix sync and async carelessly
├── Use sync libraries in async code
└── Force async for CPU work
```

### Async Library Selection

| Need | Async Library |
|------|---------------|
| HTTP client | httpx |
| PostgreSQL | asyncpg |
| Redis | aioredis / redis-py async |
| File I/O | aiofiles |
| Database ORM | SQLAlchemy 2.0 async, Tortoise |

---

## 3. Type Hints Strategy

### When to Type

```
Always type:
├── Function parameters
├── Return types
├── Class attributes
├── Public APIs

Can skip:
├── Local variables (let inference work)
├── One-off scripts
├── Tests (usually)
```

### Common Type Patterns

```python
# These are patterns, understand them:

# Optional → might be None
from typing import Optional
def find_user(id: int) -> Optional[User]: ...

# Union → one of multiple types
def process(data: str | dict) -> None: ...

# Generic collections
def get_items() -> list[Item]: ...
def get_mapping() -> dict[str, int]: ...

# Callable
from typing import Callable
def apply(fn: Callable[[int], str]) -> str: ...
```

### Pydantic for Validation

```
When to use Pydantic:
├── API request/response models
├── Configuration/settings
├── Data validation
├── Serialization

Benefits:
├── Runtime validation
├── Auto-generated JSON schema
├── Works with FastAPI natively
└── Clear error messages
```

---

## 4. Project Structure Principles

### Structure Selection

```
Small project / Script:
├── main.py
├── utils.py
└── requirements.txt

Medium API:
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── schemas/
├── tests/
└── pyproject.toml

Large application:
├── src/
│   └── myapp/
│       ├── core/
│       ├── api/
│       ├── services/
│       ├── models/
│       └── ...
├── tests/
└── pyproject.toml
```

### FastAPI Structure Principles

```
Organize by feature or layer:

By layer:
├── routes/ (API endpoints)
├── services/ (business logic)
├── models/ (database models)
├── schemas/ (Pydantic models)
└── dependencies/ (shared deps)

By feature:
├── users/
│   ├── routes.py
│   ├── service.py
│   └── schemas.py
└── products/
    └── ...
```

---

## 5. Django Principles (2025)

### Django Async (Django 5.0+)

```
Django supports async:
├── Async views
├── Async middleware
├── Async ORM (limited)
└── ASGI deployment

When to use async in Django:
├── External API calls
├── WebSocket (Channels)
├── High-concurrency views
└── Background task triggering
```

### Django Best Practices

```
Model design:
├── Fat models, thin views
├── Use managers for common queries
├── Abstract base classes for shared fields

Views:
├── Class-based for complex CRUD
├── Function-based for simple endpoints
├── Use viewsets with DRF

Queries:
├── select_related() for FKs
├── prefetch_related() for M2M
├── Avoid N+1 queries
└── Use .only() for specific fields
```

---

## 6. FastAPI Principles

### async def vs def in FastAPI

```
Use async def when:
├── Using async database drivers
├── Making async HTTP calls
├── I/O-bound operations
└── Want to handle concurrency

Use def when:
├── Blocking operations
├── Sync database drivers
├── CPU-bound work
└── FastAPI runs in threadpool automatically
```

### Dependency Injection

```
Use dependencies for:
├── Database sessions
├── Current user / Auth
├── Configuration
├── Shared resources

Benefits:
├── Testability (mock dependencies)
├── Clean separation
├── Automatic cleanup (yield)
```

### Pydantic v2 Integration

```python
# FastAPI + Pydantic are tightly integrated:

# Request validation
@app.post("/users")
async def create(user: UserCreate) -> UserResponse:
    # user is already validated
    ...

# Response serialization
# Return type becomes response schema
```

---

## 7. Background Tasks

### Selection Guide

| Solution | Best For |
|----------|----------|
| **BackgroundTasks** | Simple, in-process tasks |
| **Celery** | Distributed, complex workflows |
| **ARQ** | Async, Redis-based |
| **RQ** | Simple Redis queue |
| **Dramatiq** | Actor-based, simpler than Celery |

### When to Use Each

```
FastAPI BackgroundTasks:
├── Quick operations
├── No persistence needed
├── Fire-and-forget
└── Same process

Celery/ARQ:
├── Long-running tasks
├── Need retry logic
├── Distributed workers
├── Persistent queue
└── Complex workflows
```

---

## 8. Error Handling Principles

### Exception Strategy

```
In FastAPI:
├── Create custom exception classes
├── Register exception handlers
├── Return consistent error format
└── Log without exposing internals

Pattern:
├── Raise domain exceptions in services
├── Catch and transform in handlers
└── Client gets clean error response
```

### Error Response Philosophy

```
Include:
├── Error code (programmatic)
├── Message (human readable)
├── Details (field-level when applicable)
└── NOT stack traces (security)
```

---

## 9. Testing Principles

### Testing Strategy

| Type | Purpose | Tools |
|------|---------|-------|
| **Unit** | Business logic | pytest |
| **Integration** | API endpoints | pytest + httpx/TestClient |
| **E2E** | Full workflows | pytest + DB |

### Async Testing

```python
# Use pytest-asyncio for async tests

import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_endpoint():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/users")
        assert response.status_code == 200
```

### Fixtures Strategy

```
Common fixtures:
├── db_session → Database connection
├── client → Test client
├── authenticated_user → User with token
└── sample_data → Test data setup
```

---

## ✅ Quality Audit Checklist

Before concluding a Python codebase design, database migration, or test suite execution task, verify compliance with the following:

- [ ] **Framework Validated**: Asked the user or analyzed context to confirm the best-fit framework (FastAPI, Django, Flask).
- [ ] **Concurrency Mapped**: Decided async/sync correctly, ensuring no blocking calls execute inside async event loops.
- [ ] **Type Hints Configured**: Documented comprehensive typing parameters for function arguments and return types.
- [ ] **Data Validation Complete**: Integrated Pydantic models for incoming payload schemas and runtime configurations.
- [ ] **Concerns Separated**: Confirmed business logic resides inside services layers instead of views or route entrypoints.
- [ ] **Tests Asynchronous**: Executed pytest-asyncio workflows verifying concurrent I/O API responses.

---

## ❌ Anti-Patterns

- Default to Django for simple APIs (FastAPI may be better)
- Use sync libraries in async code
- Skip type hints for public APIs
- Put business logic in routes/views
- Ignore N+1 queries
- Mix async and sync carelessly

---

> **Remember**: Python patterns are about decision-making for YOUR specific context. Don't copy code—think about what serves your application best.
