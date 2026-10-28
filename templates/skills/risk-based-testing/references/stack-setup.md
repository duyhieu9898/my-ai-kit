# Stack Setup and Pitfalls

Check the installed versions in `package.json` first: Vitest 5 and MSW 3
changed several defaults.

## Contents

1. Vitest
2. React Testing Library
3. MSW
4. TanStack Query
5. Forms and schemas (Zod, React Hook Form)
6. i18n (react-i18next)
7. Web3 (wagmi, viem, Solana)
8. Client stores (Zustand, Redux, Jotai)
9. Express, Mongoose, supertest
10. Running

## Vitest

- **Projects:** the client runs in `jsdom`, the server in `node`. Split them
  with `test.projects` (called `workspace` before Vitest 3.2). Since Vitest 5,
  inline projects inherit the root `test` options, so keep
  environment-specific `setupFiles` inside each project. Never run Mongoose
  under jsdom.
- **`vi.mock` is hoisted** above imports. Variables used inside its factory
  must come from `vi.hoisted()`. Since Vitest 5, `vi.mock` and `vi.hoisted`
  throw when they are not at the top level of the file.
- **Mocks do not reach calls inside the same module.** If `a()` calls `b()` in
  the same file, mocking `b` does not change what `a` calls.
- **Mock reset:** Vitest 5 turns `clearMocks` on by default, so call history
  recorded in `beforeAll` or at module level is gone before each test.
  Since Vitest 4, `restoreMocks` restores only `vi.spyOn` spies. Replace
  globals only with `vi.stubGlobal` and undo it with `vi.unstubAllGlobals()`
  (or `unstubGlobals: true`); undo `vi.setSystemTime` with
  `vi.useRealTimers()`.
- **Fake timers:** restore them in `afterEach`. With user-event, use
  `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })` and advance
  with `vi.advanceTimersByTimeAsync`, or awaited actions hang. Never use fake
  timers in Mongoose tests.

## React Testing Library

- Setup file: `import '@testing-library/jest-dom/vitest'`. Automatic cleanup
  needs a global `afterEach`; with `globals: false`, call `cleanup()` in the
  setup file.
- `renderHook` comes from `@testing-library/react`. Prefer testing a hook
  through the component that uses it, unless the hook is shared logic.

## MSW

- Lifecycle in the setup file: `beforeAll(() => server.listen(...))`,
  `afterEach(() => server.resetHandlers())`, `afterAll(() => server.close())`.
  Override per test with `server.use(...)`.
- Fail on unmocked requests: `onUnhandledRequest: 'error'` in MSW 2; MSW 3
  renamed it to `onUnhandledFrame: 'error'`. A `fetch failed` whose cause
  mentions the "error" strategy means no handler matched: check the method
  and path.
- Imports: MSW 2 exports `http`, `HttpResponse`, and `delay` from `msw`. MSW 3
  moved `http` and `HttpResponse` to `msw/http`, and `delay` to
  `msw/utils/delay`. `setupServer` stays in `msw/node`.
- **Relative URLs** (`fetch('/api/orders')`) work under jsdom, whose
  `location` is `http://localhost:3000`, and match relative handler paths. In
  the `node` environment they throw `Failed to parse URL`, so give the client
  an absolute base URL there. Do not stub `fetch` to work around either case.

## TanStack Query

- A fresh `QueryClient` per test, inside the render wrapper, with
  `defaultOptions: { queries: { retry: false } }`. A shared client leaks cache
  between tests; the default 3 retries turn error tests into timeouts.
- A `retry` set on the query itself overrides the default.
- Assert through the UI with `findBy*`. With `renderHook`, use
  `await waitFor(() => expect(result.current.isSuccess).toBe(true))`.

## Forms and schemas (Zod, React Hook Form)

- Test validation rules on the schema itself, not through the form. Start each
  rejection case from a valid fixture, break one field, and assert the issue
  `path` (see "Any error passes" in the anti-patterns).
- Test the form only for wiring: the error appears on the right field at the
  right time (the RHF `mode` decides blur vs submit), the submit payload
  reaches the API (MSW), and submit is disabled while pending. Do not repeat
  every schema rule through the UI.
- Drive inputs with `userEvent` and wait with `findBy*` after blur or submit;
  RHF validates asynchronously.

## i18n (react-i18next)

- Render with the project's real i18n setup in one fixed language. Mock `t`
  only if the project already does.
- When the point is which message appears, take the expected text from the
  locale file with a literal key (`en.errors.conflict`), not by building the
  key the way the code does. A copy edit then breaks nothing, and a wrong key
  still fails.
- Check for keys missing from a locale once for the whole app, not in every
  component test.

## Web3 (wagmi, viem, Solana)

- Mock at the wallet and RPC edge: wagmi's `useAccount` or its `mock`
  connector, a fake Solana `Connection` or wallet adapter. Keep the project's
  own selection, lifecycle, and verification hooks real; mocking them hides
  the wiring that decides which account signs.
- Amounts: use `bigint` literals, and cover decimals (6 vs 18), zero,
  negative, non-numeric input, the maximum (`maxUint256`, u64), and a token
  missing from the registry (it must fail, not fall back to 18 decimals).
  Assert the error code, never a bare `toThrow()`.
- Polling, resend, and confirmation intervals run on fake timers; a test that
  sleeps through a real 2 s interval is slow and still racy.
- For every write path, cover double submit, an account switch mid-flow, and
  the transaction check that runs before the user signs.
- Never sign or send against a real network in unit tests.

## Client stores (Zustand, Redux, Jotai)

- Use the real store; do not mock it.
- Reset it between tests, e.g. for Zustand
  `useStore.setState(useStore.getInitialState(), true)` in `afterEach`.
- Test only actions that hold a rule; plain setters are not worth a test.

## Express, Mongoose, supertest

- Export `app` from a module that does not call `listen()`; tests use
  `request(app)`.
- Start one `mongodb-memory-server` in Vitest `globalSetup`, pass its URI with
  `provide`/`inject`, and stop it in the returned teardown. Give each worker
  its own database (`test-${process.env.VITEST_POOL_ID}`): files that share
  one database in parallel delete each other's data.
- Transactions need `MongoMemoryReplSet`.
- Clear collections in `afterEach` (`deleteMany({})` per model).
- Test a route by status and response body, plus a follow-up `GET` when the
  write is the behaviour. Include the 401/403 and validation (400) cases for
  routes that have them.

## Running

- One file: `npx vitest run <file>`; one test: add `-t "<name>"`.
- Watch mode is the default for `vitest` without `run`; agents should always
  pass `run`.
