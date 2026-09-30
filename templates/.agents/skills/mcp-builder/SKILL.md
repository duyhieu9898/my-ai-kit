---
name: mcp-builder
description: >-
  Builds and fixes Model Context Protocol servers in TypeScript/Node: tools
  with input and output schemas, stdio or Streamable HTTP transport, auth, and
  client registration. Use when writing or changing an MCP server, designing
  its tools, or connecting it to Claude Code or Codex.
---

# MCP Builder (TypeScript / Node)

An MCP server is judged by a model reading its tool list, so tool names,
descriptions, and schemas matter as much as the code. The protocol and SDK
also changed recently; the facts below are as of 2026-09.

## Versions

- **Protocol:** the current revision is `2026-07-28`. It is stateless: no
  `initialize` handshake, no `Mcp-Session-Id` sessions, no standalone GET
  stream or stream resumption. Each request carries the protocol version and
  client capabilities in `_meta`. Revisions up to `2025-11-25` are "legacy".
  Cross-call state must be an explicit handle passed as a tool argument, not
  a session.
- **SDK:** follow the version the project already uses.
  - v2 (new servers): split packages `@modelcontextprotocol/server`,
    `@modelcontextprotocol/client`, `@modelcontextprotocol/core`, plus
    `@modelcontextprotocol/node`, `/express`, `/hono`, `/fastify`. It serves
    both `2026-07-28` and legacy clients.
  - v1: the single `@modelcontextprotocol/sdk` package (imports such as
    `@modelcontextprotocol/sdk/server/mcp.js`). Still published, but it
    predates the stateless revision. v1 and v2 objects must not be mixed.
  - Schema difference: v2 `inputSchema` takes a schema object
    (`z.object({...})`, or any Standard Schema library); v1 takes a raw Zod
    shape (`{ id: z.string() }`), which v2 deprecates.

## Transports

- **stdio** for a local server the client launches (a Backlog or GitHub
  wrapper using the user's own API key).
- **Streamable HTTP** for a remote or shared server, on one endpoint (`/mcp`).
- **HTTP+SSE** (2024-11-05) is deprecated; do not build it for new servers.
  **WebSocket** is not a standard MCP transport.

Minimal stdio server (v2):

```ts
#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';

serveStdio(() => {
  const server = new McpServer({ name: 'backlog', version: '1.0.0' });
  server.registerTool(
    'get_issue',
    {
      title: 'Get issue',
      description: 'Fetch one Backlog issue by key, e.g. OOP-123.',
      inputSchema: z.object({ issueKey: z.string().regex(/^[A-Z_]+-\d+$/) }),
      outputSchema: z.object({ key: z.string(), status: z.string() }),
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ issueKey }) => {
      const issue = await fetchIssue(issueKey);
      const output = { key: issue.key, status: issue.status };
      return {
        content: [{ type: 'text', text: JSON.stringify(output) }],
        structuredContent: output,
      };
    },
  );
  return server;
});
```

For HTTP in v2, build the server in a factory and serve it with
`createMcpHandler(factory)` (from `@modelcontextprotocol/server`), mounted
through `toNodeHandler` (`@modelcontextprotocol/node`) on
`createMcpExpressApp()` (`@modelcontextprotocol/express`). The factory runs
per request, so keep no per-client state in it.

## stdio pitfalls

- **stdout is the protocol.** Log with `console.error` only. One
  `console.log`, a library banner, or a progress bar on stdout corrupts the
  JSON-RPC stream, and the client usually shows only "connection closed".
- **dotenv 17+ logs an "injecting env" line by default**, and some 17.x
  releases write it to stdout. Use `dotenv.config({ quiet: true })`, or
  `node --env-file=.env`.
- **Working directory** is whatever the client chooses. Resolve files from
  `import.meta.dirname` or an env var, never from `process.cwd()`.
- **Register the built file by absolute path** (`node /abs/dist/index.js`).
  `npx tsx src/index.ts` works but is slow to start and can hit client
  startup timeouts.

## Tool design

- **Names:** `snake_case` verbs with the domain (`list_my_issues`,
  `resolve_bug`); 1-128 chars of letters, digits, `_`, `-`, `.`. Fewer, task-shaped tools
  beat one tool per REST endpoint, because every tool costs context in every
  session.
- **Descriptions** say when to call the tool and what it returns, including
  formats ("issue key such as OOP-123"). Describe each schema field; add
  enums, patterns, and bounds instead of prose.
- **Output:** declare `outputSchema` and return `structuredContent`, plus the
  same JSON as a text block for older clients. The SDK validates
  `structuredContent` against `outputSchema`. Keep results small: paginate
  (`cursor`, `limit`) and return ids and summaries, not whole records.
- **Annotations:** `readOnlyHint`, `destructiveHint`, `idempotentHint`,
  `openWorldHint`. Set them honestly; clients use them to decide when to ask
  for confirmation. They are hints only, and a client must not trust them
  from an unknown server, so still gate destructive actions in code (for
  example a `mode: "preview" | "apply"` argument).
- **Errors:**
  - A failure the model can fix (not found, bad date, upstream 4xx) is a
    normal result with `isError: true` and an actionable message ("No issue
    OOP-9; known projects: OOP, WEB"). A thrown error in a handler becomes the
    same thing in the SDK, with less control over the text.
  - Unknown tool or malformed request is a JSON-RPC protocol error, which the
    SDK produces.
  - Never put stack traces, tokens, or absolute server paths in the text.
- **Resources and prompts** only when a client will use them. Most clients,
  and most models, act on tools; a resource nobody reads is dead code.

## Security

- **Secrets** come from env vars set in the client config. Do not log them
  or echo them in results.
- **Remote servers** are OAuth resource servers: verify the bearer token on
  every request (v2: `requireBearerAuth` with an `OAuthTokenVerifier`), check
  its audience is this server, and publish RFC 9728 protected-resource
  metadata (`mcpAuthMetadataRouter`). Do not pass the client's token through
  to an upstream API; use the server's own credentials.
- **Local HTTP servers** bind to `127.0.0.1` and validate `Host` and `Origin`
  (DNS rebinding). `createMcpExpressApp()` does this for localhost hosts; with
  plain `node:http`, use `localhostHostValidation()` and
  `localhostOriginValidation()`.
- **File or shell tools** confine paths to an allow-listed root and never
  pass model input to a shell.

## Test

- Interactive UI: `npx @modelcontextprotocol/inspector node dist/index.js`
- Scriptable, for CI or quick checks:

  ```bash
  npx @modelcontextprotocol/inspector --cli node dist/index.js --method tools/list
  npx @modelcontextprotocol/inspector --cli node dist/index.js \
    --method tools/call --tool-name get_issue --tool-arg issueKey=OOP-1
  npx @modelcontextprotocol/inspector --cli https://host/mcp --transport http --method tools/list
  ```

- Put the server command before any flag in `--cli` mode; flags placed
  first make the Inspector drop the target. Pass env with
  `-e KEY=value -- node dist/index.js`.
- Unit-test handlers as plain functions; use `testing-patterns` for that.

## Register with clients

- **Claude Code:**
  - stdio: `claude mcp add backlog -s user -e BACKLOG_API_KEY=... -- node /abs/dist/index.js`
  - HTTP: `claude mcp add --transport http backlog https://host/mcp`
    (add `-H "Authorization: Bearer ..."` for a static token)
  - Scope: `-s local` (default, this project, private), `-s user` (all
    projects), `-s project` (writes a shared `.mcp.json`; keep secrets out).
    Check with `claude mcp list` or `/mcp` in a session.
- **Codex:** `codex mcp add backlog --env BACKLOG_API_KEY=... -- node /abs/dist/index.js`,
  or `codex mcp add backlog --url https://host/mcp --bearer-token-env-var BACKLOG_TOKEN`.
  Both write `~/.codex/config.toml`:

  ```toml
  [mcp_servers.backlog]
  command = "node"
  args = ["/abs/dist/index.js"]
  env = { BACKLOG_API_KEY = "..." }
  ```

- **Claude Desktop:** an entry under `mcpServers` in
  `claude_desktop_config.json` with `command`, `args`, and `env`.
- **Antigravity:** add it through its MCP settings; the file format was not
  verified for this skill.

Restart the client, or reconnect the server, after changing a tool list;
most clients cache it.

## Done when

The server starts under the Inspector with no stdout noise, `tools/list`
shows names, descriptions, schemas, and annotations as intended, each tool
returns `structuredContent` matching its `outputSchema` and an `isError`
result for a bad input, secrets come only from env, and the server works in
the user's real client (Claude Code or Codex).
