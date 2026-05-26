---
name: mcp-builder
description: >-
  Use when building or modifying custom MCP servers, designing JSON schemas for tools, or configuring Claude Desktop.
  Model Context Protocol (MCP) server building principles covering stdio, tools, and error handling.
  NOT for frontend layouts.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# MCP Builder

> Principles for building MCP servers.

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| _No supplementary files_ | Main MCP builder procedures are in this file | Use this file by default |

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| Node.js coding conventions and package structures | [`nodejs-best-practices`](../nodejs-best-practices/SKILL.md) |
| Transport profiling and latency optimization | [`performance-optimizer`](../performance-optimizer/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When tasked with constructing custom MCP servers, configuring Claude Desktop setups, or defining tool parameters schemas, strictly follow this step-by-step procedure:

### Step 1: Establish Server Architecture
1. Set up standard node/typescript packages using Stdio for local CLIs or SSE for web endpoints.
2. Direct all developer console logging exclusively to `stderr` so as not to pollute stdio transport channels.

### Step 2: Design Tool JSON Schemas
1. Create descriptive, action-oriented tool names (e.g. `get_weather`, `run_query`).
2. Map strict type parameters and descriptions for all schema fields.

### Step 3: Implement Resource URI Patterns
1. Code dynamic/parameterized patterns (e.g. `users://{userId}`) or static documentation collections.
2. Enforce limits on directory scope walks.

### Step 4: Configure Error Handlers
1. Capture validation failures or resource gaps and return structured error JSON response models.
2. Assure stack traces are never exposed in user-facing payloads.

### Step 5: Test and Configure Client & Verify Checklist
1. Write custom Claude Desktop setup profiles and execute unit/integration testing mocks.
2. Confirm compliance against the **Quality Audit Checklist** before completing.

---

## 1. MCP Overview

### What is MCP?

Model Context Protocol - standard for connecting AI systems with external tools and data sources.

### Core Concepts

| Concept | Purpose |
|---------|---------|
| **Tools** | Functions AI can call |
| **Resources** | Data AI can read |
| **Prompts** | Pre-defined prompt templates |

---

## 2. Server Architecture

### Project Structure

```
my-mcp-server/
├── src/
│   └── index.ts      # Main entry
├── package.json
└── tsconfig.json
```

### Transport Types

| Type | Use |
|------|-----|
| **Stdio** | Local, CLI-based |
| **SSE** | Web-based, streaming |
| **WebSocket** | Real-time, bidirectional |

---

## 3. Tool Design Principles

### Good Tool Design

| Principle | Description |
|-----------|-------------|
| Clear name | Action-oriented (get_weather, create_user) |
| Single purpose | One thing well |
| Validated input | Schema with types and descriptions |
| Structured output | Predictable response format |

### Input Schema Design

| Field | Required? |
|-------|-----------|
| Type | Yes - object |
| Properties | Define each param |
| Required | List mandatory params |
| Description | Human-readable |

---

## 4. Resource Patterns

### Resource Types

| Type | Use |
|------|-----|
| Static | Fixed data (config, docs) |
| Dynamic | Generated on request |
| Template | URI with parameters |

### URI Patterns

| Pattern | Example |
|---------|---------|
| Fixed | `docs://readme` |
| Parameterized | `users://{userId}` |
| Collection | `files://project/*` |

---

## 5. Error Handling

### Error Types

| Situation | Response |
|-----------|----------|
| Invalid params | Validation error message |
| Not found | Clear "not found" |
| Server error | Generic error, log details |

### Best Practices

- Return structured errors
- Don't expose internal details
- Log for debugging
- Provide actionable messages

---

## 6. Multimodal Handling

### Supported Types

| Type | Encoding |
|------|----------|
| Text | Plain text |
| Images | Base64 + MIME type |
| Files | Base64 + MIME type |

---

## 7. Security Principles

### Input Validation

- Validate all tool inputs
- Sanitize user-provided data
- Limit resource access

### API Keys

- Use environment variables
- Don't log secrets
- Validate permissions

---

## 8. Configuration

### Claude Desktop Config

| Field | Purpose |
|-------|---------|
| command | Executable to run |
| args | Command arguments |
| env | Environment variables |

---

## 9. Testing

### Test Categories

| Type | Focus |
|------|-------|
| Unit | Tool logic |
| Integration | Full server |
| Contract | Schema validation |

---

## ❌ Anti-Patterns

- Writing MCP server diagnostics to `stdout` when using stdio transport.
- Defining vague tool names or schemas without field descriptions.
- Returning raw stack traces, absolute paths, or secret values in user-facing errors.
- Exposing broad filesystem or network access without explicit scope limits.

---

## ✅ Quality Audit Checklist

Before concluding an MCP server initialization, tool schema design, or configuration integration task, verify compliance with the following:

- [ ] **Tool Names Action-Oriented**: Confirmed tool names describe operations clearly (e.g. `get_weather`, `create_user`).
- [ ] **Input Schemas Complete**: Defined parameter properties with human-readable type parameters and descriptions.
- [ ] **JSON Outputs Structured**: Ensured all tools return consistent JSON formats without raw text blocks.
- [ ] **Stdio Streams Cleaned**: Verified that no server logging outputs leak to `stdout` (redirected to `stderr` exclusively).
- [ ] **Secrets Loaded from Env**: Permitted API key access only via environment configurations (never hardcoded).
- [ ] **Error Details Sanitized**: Sanitized response messages to avoid leaking absolute server directory paths or raw stack traces.

---

> **Remember:** MCP tools should be simple, focused, and well-documented. The AI relies on descriptions to use them correctly.
