---
name: documentation-writer
description: >-
  Writes and updates project documentation such as READMEs, API reference
  pages, changelogs, llms.txt files, and doc comments, using facts taken from
  the code. Use when the user explicitly asks to write or change
  documentation. Not for architecture decision records (use architecture).
disable-model-invocation: true
---

# Documentation Writer

This skill runs only when documentation is explicitly requested. Do not start
it, or add documentation edits, during ordinary coding, debugging, or
refactoring. It is explicit-only in Claude Code and Codex; on tools that
still auto-load it, this rule is the gate.

## Defaults

- **Follow the project first:** its existing doc layout, heading style,
  tone, and language. The templates below apply only when there is nothing
  to follow.
- **Facts come from the code,** not from memory or the old docs: commands
  from `package.json` scripts or the `Makefile`, environment variables from
  `.env.example` or the config loader, ports and routes from the code. Never
  copy a real secret value from a `.env` file into documentation.
- **No placeholders in the finished document.** If a fact cannot be found,
  ask or mark it clearly as a TODO for the user; do not invent a plausible
  value.
- **Run what you document** when it is safe (install, build, test, a CLI
  `--help`). Say which commands were not run.
- **ADRs** belong to the `architecture` skill, which owns their template and
  location.

## README

Order by what a new reader needs first. Keep reference material in `docs/`
and link to it.

~~~markdown
# <Project name>

<One sentence: what it does and for whom.>

## Quick start

```bash
<install command from the project>
<run command from the project>
```

## Configuration

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `PORT` | no | `3000` | HTTP port |

## Development

How to run tests, lint, and build, using the project's own scripts.

## Documentation

- API reference: `docs/api.md`
- Architecture decisions: `docs/decisions/`
~~~

## API reference

One section per endpoint or exported function. Document the error cases, not
only the success path, and use a real request and response taken from a test
or a run.

~~~markdown
## GET /api/v1/users/:id

Returns one user. Requires a session.

| Parameter | In | Type | Required | Notes |
|---|---|---|---|---|
| `id` | path | string | yes | User id, e.g. `usr_123` |

Responses: `200` user object; `401` no session; `404` unknown id.

```json
{ "id": "usr_123", "email": "user@example.com", "status": "active" }
```
~~~

If the project has an OpenAPI or GraphQL schema, update the schema and
generate from it instead of hand-writing a parallel copy.

## Changelog

Follow the project's existing changelog. If there is none, use the Keep a
Changelog layout: an `Unreleased` section at the top, then one section per
release as `## [x.y.z] - YYYY-MM-DD`, using the actual release date, with
`Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, and `Security` groups
as needed. Write entries for users of the project, not as a commit log, and
call out breaking changes first.

## Doc comments (JSDoc, TSDoc, docstrings)

- Document exported or non-obvious code: why it exists, constraints on the
  inputs, what it throws, and side effects.
- Do not restate what the signature or the types already say.
- Keep `@example` blocks runnable; a broken example is worse than none.

## llms.txt

Follow the llms.txt format: an H1 with the project name, a one-paragraph
blockquote summary, then H2 sections of Markdown links with a short note.
Links are usually absolute URLs to the published docs or raw Markdown files;
put secondary material under `## Optional`, which consumers may skip.

~~~markdown
# <Project name>

> <What the project is, in one or two sentences.>

## Docs

- [Quick start](https://<site>/docs/quick-start.md): install and first run
- [API reference](https://<site>/docs/api.md): every endpoint with errors

## Optional

- [Architecture decisions](https://<site>/docs/decisions/): why the system is shaped this way
~~~

## Pitfalls

- Nesting a fenced code block inside another with the same fence: use `~~~`
  or a longer backtick fence for the outer block, as above.
- Relative links that break when the file moves; check each link resolves.
- Duplicating the same instructions in several files; link to one source.

## Done when

The requested documents are written in the project's style, every command,
path, variable, and link in them was checked against the code, and nothing
unverified is presented as fact.
