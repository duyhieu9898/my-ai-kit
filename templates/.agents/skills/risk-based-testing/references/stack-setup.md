# Stack Setup and Pitfalls

Vitest, React Testing Library, MSW, TanStack Query, Zustand, and Express with
Mongoose. Check the installed versions in `package.json` first: several
defaults changed in recent majors.

## Vitest

- **Projects:** the client runs in `jsdom`, the server in `node`. Split them
  with `test.projects` (called `workspace` before Vitest 3.2). Never run
  Mongoose under jsdom.
- **`vi.mock` is hoisted** above imports. Variables used inside its factory
  must come from `vi.hoisted()`. Since Vitest 5, `vi.mock` and `vi.hoisted`
  throw if they are not at the top level of the file.
- **Mocks do not reach calls inside the same module.** If `a()` calls `b()` in
  the same file, mocking `b` does not change what `a` calls.
- **Mock reset:** Vitest 5 turns `clearMocks` on by default, so call history
  recorded in `beforeAll` or at module level is gone before each test.
  `restoreMocks` restores only `vi.spyOn` spies (since Vitest 4).
  `vi.stubGlobal` and `vi.setSystemTime` need manual cleanup unless
  `unstubGlobals` is set.
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
- Fail on unmocked requests: `onUnhandledRequest: 'error'` in MSW 2,
  `onUnhandledFrame: 'error'` in MSW 3.
- Imports: MSW 2 uses `import { http, HttpResponse } from 'msw'`; MSW 3 moved
  them to `msw/http`. `setupServer` stays in `msw/node`.
- **Relative URLs** (`fetch('/api/orders')`) resolve against `location.href`.
  Under jsdom set a URL in the config
  (`environmentOptions.jsdom.url: 'http://localhost:3000'`) and write handlers
  with relative paths. Do not switch to stubbing `fetch` to work around it.

## TanStack Query

- A fresh `QueryClient` per test, inside the render wrapper, with
  `defaultOptions: { queries: { retry: false } }`. A shared client leaks cache
  between tests; the default 3 retries turn error tests into timeouts.
- A `retry` set on the query itself overrides the default.
- Assert through the UI with `findBy*`. With `renderHook`, use
  `await waitFor(() => expect(result.current.isSuccess).toBe(true))`.

## Zustand

- Use the real store; do not mock it.
- Reset between tests. The official approach mocks `zustand` so each store
  records its initial state and resets it in `afterEach`; in Vitest, call
  `vi.mock('zustand')` in the setup file with a `__mocks__/zustand.ts` (see
  the Zustand testing guide). A simpler option for a few stores:
  `useCartStore.setState(useCartStore.getInitialState(), true)` in
  `afterEach`.

## Express, Mongoose, supertest

- Export `app` from a module that does not call `listen()`; tests use
  `request(app)`.
- One `mongodb-memory-server` for the run, started in Vitest `globalSetup`.
  Pass the URI with `provide`/`inject`, and stop the server in the returned
  teardown. One server per file races under parallel workers.
- Transactions need `MongoMemoryReplSet`.
- Clear collections in `afterEach` (`deleteMany({})` per model), not by
  dropping the database between files that run in parallel.
- Test a route by status and response body, plus a follow-up `GET` when the
  write is the behaviour. Include the 401/403 and validation (400) cases for
  routes that have them.

## Running

- One file: `npx vitest run <file>`; one test: add `-t "<name>"`.
- Watch mode is the default for `vitest` without `run`; agents should always
  pass `run`.
