---
name: lint-and-validate
description: >-
  Runs the kit's lint runner (lint script or ESLint, tsc, Ruff, mypy) and a
  type-annotation heuristic, and explains their output. Use when a lint or
  type check is wanted and the project has no command of its own. Not for
  choosing which checks to run (use verify-changes).
---

# Lint and Validate

Two bundled scripts wrap the usual static checks. Which checks a change
needs, and when, is decided by `verify-changes`; this skill only says what
each script runs and how to read it. If the project has its own lint or
typecheck command (`package.json` scripts, `Makefile`, CI workflow), prefer
that.

## Lint runner

`python3 .agents/skills/lint-and-validate/scripts/lint_runner.py [project_path]`

Run it; do not read the source. It takes one positional path (default `.`)
and has no `--help`: any argument, including `--help`, is taken as the path.

It looks only at the given directory, not at workspace packages below it:

| Found at the root | Runs |
|---|---|
| `package.json` with a `lint` script | `npm run lint` |
| otherwise `eslint` in dependencies | `npx eslint .` |
| `typescript` in dependencies, or `tsconfig.json` | `npx tsc --noEmit` |
| `pyproject.toml` or `requirements.txt` | `ruff check .` |
| `pyproject.toml` or `mypy.ini` | `mypy .` |

- Each command has a 120 s timeout. Output is cut to 2,000 chars of stdout
  and 500 of stderr, so rerun a failing command directly to see everything.
- Exit 1 if any command fails, including "Command not found" for a missing
  `ruff` or `mypy`. Exit 0 when all pass, and also when nothing was detected
  (`"message": "No linters configured"`), which is not evidence that the code
  is clean.
- **Network and installs:** `npx` runs the local binary when dependencies are
  installed. If they are not, `npx` may download the package, and `npx tsc`
  then fetches the unrelated `tsc` package instead of TypeScript. Install
  dependencies first, or run the project's own script.
- It never passes `--fix`. Apply autofixes only when the user wants them,
  and review the diff, because they can touch files outside the change.
- In a monorepo, run it per package path, or use the workspace command
  (`pnpm -r lint`, `turbo run lint`).

## Type annotation heuristic

`python3 .agents/skills/lint-and-validate/scripts/type_coverage.py [project_path]`

Run it; do not read the source. Same argument handling as the lint runner.

- Scans up to 200 `.ts`/`.tsx` files (not `.d.ts`; skips `node_modules`,
  `.next`, `dist`, `build`, `.git`, `.agents`) and up to 200 `.py` files.
- Counts `: any` / `: Any` annotations and functions without explicit
  types, by regex. PascalCase functions in `.tsx` count as covered, since
  React components rely on the inferred JSX return type.
- Exit 1 (`[X]`) for more than 5 `: any` in TypeScript, or Python hint
  coverage below 40% or more than 3 `Any`. `[!]` lines are advisory.
- It is not a type checker. TypeScript inference makes low "coverage"
  normal; `tsc --noEmit` passing is what matters. Use it to spot new `any`
  in a review, not as a gate.

## Reading failures

- Fix errors in the files the change touched first. Pre-existing errors
  elsewhere are reported, not silently fixed, unless the user asks.
- Do not silence a rule with `eslint-disable`, `@ts-ignore`, or `# type:
  ignore` to get a pass; if a suppression is justified, scope it to one line
  and say why (`@ts-expect-error` over `@ts-ignore`).
- `tsc` errors in generated files (`.next/types`, Supabase or Prisma
  generated types) usually mean the generator needs to run again, not a code
  change.

## Done when

The commands that `verify-changes` or the user selected have run, their
result (pass, fail with the relevant errors, or not detected) is reported
with the command used, and no new lint or type errors remain in the changed
files.
