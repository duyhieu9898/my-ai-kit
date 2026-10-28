# Testing Workflow Policy

## 1. No Baseline or Exploratory Tests

- When starting a new session or entering a repository with a clean worktree, **DO NOT** run exploratory test suites (`pnpm test`, `vitest`, etc.) merely to "verify that the repository is clean".
- Start working directly on the user's specific request without delay.

## 2. Iterative Feedback & Intermediate Changes

- During interactive development, step-by-step code editing, or when awaiting user feedback: **DO NOT RUN FULL TEST SUITES (`pnpm test`)**.
- Running the complete test suite across the monorepo is expensive and time-consuming (~2 minutes).
- For quick syntax or contract verification during iterations, use fast type checking (`pnpm typecheck`) or run only the single targeted test file directly affected by your edit.

## 3. When to Run Full Test Suites

- **DO NOT** run the full test suite (`pnpm test`) automatically before committing or creating a PR. Before committing, run only fast typecheck/lint (`pnpm typecheck`, `pnpm lint`) or focused tests on changed files (`pnpm test:changed`). Full test suite runs belong in CI.
- Run the full test suite (`pnpm test`) **ONLY** when the user explicitly requests it (e.g., "run all tests", "run full test suite").
