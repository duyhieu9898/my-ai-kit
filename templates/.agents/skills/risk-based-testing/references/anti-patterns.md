# Test Anti-Patterns

Each entry: what it looks like, why it hurts, the fix. Use it as a checklist
when writing tests and when reviewing a suite.

## Contents

1. Tests that cannot fail
2. Tests that miss the likely bug
3. Tests that fail for the wrong reason
4. Mocking mistakes
5. Redundancy and noise
6. React Testing Library mistakes
7. Production code bent for tests

## 1. Tests that cannot fail

**Tautological assertion.** The expected value comes from the code under
test, the same formula, or the code's own constants.

```ts
// Bad: passes whatever the formula is
expect(subtotal(items)).toBe(items.reduce((s, i) => s + i.unitPrice * i.qty, 0));
// Good: a literal worked out by hand
expect(subtotal([{ sku: 'A', unitPrice: 120_000, qty: 2 }])).toBe(240_000);
```

**Testing a copy.** The test file defines its own version of a helper,
usually because the real one is private to a component, and tests that.
Production code never runs. Extract the real function into a module and test
it there.

**Testing the mock.** The only assertion is on a mock you set up, a `*-mock`
test id, or a rule written inside a `vi.mock` factory. It proves the mock
works. Assert the real effect, or delete the test.

**Assertions that may not run.** `expect` inside an `if`, a `catch`, a loop
over a list that may be empty, or a callback the test does not await; an
unawaited `waitFor`. When the branch is skipped, nothing is checked.

```ts
// Bad: passes when nothing throws
try { await pay(order); } catch (e) { expect(e.code).toBe('LIMIT'); }
// Good
await expect(pay(order)).rejects.toMatchObject({ code: 'LIMIT' });
```

Assert the precondition outside the branch (`expect(r.success).toBe(false)`,
`expect(rows).toHaveLength(3)`) and await every async check. Vitest 4 only
warns about an unawaited `resolves` or `rejects`; Vitest 5 fails the test.

## 2. Tests that miss the likely bug

**Loose assertion.** `toBeTruthy()`, `toBeDefined()`, a `typeof` check,
`length > 0`, or a short substring: `toContain('30')` also matches "30D", and
`toContain('2026')` also matches an unformatted ISO date. Each passes for
many wrong values. Assert the exact value the user should see.

**Only a negative assertion.** `not.toHaveValue('999')`, `not.toBe(fallback)`,
or `not.toHaveBeenCalled()` on a spy the code never receives. A negative
passes for every wrong value but one, and for broken wiring. Assert the exact
expected value, and prove a spy is wired with a case where it is called.

**Absence asserted too early or for nothing.** `queryByText('Error')` is null
right after render, before the async flow could show it; inside `waitFor`,
where it passes on the first tick; or for text or a test id that exists in no
source file or dictionary. Wait for the positive outcome first
(`await findByText(...)`), then assert the absence, and check that the string
exists in the code.

**Any error passes.** A bare `toThrow()` or `rejects.toThrow()` also passes
on a `TypeError` from a typo, and a class-only check passes on the wrong
branch of the same error class. A rejection case that misses an unrelated
required field, or breaks two rules, is rejected whatever the rule under
test does.

```ts
// Bad: no visibilityRules, so this fails even with no price rule at all
expect(partnerSchema.safeParse({ ...base, price: -1 }).success).toBe(false);
// Good: valid except for the one rule, and the issue points at that field
const r = partnerSchema.safeParse({ ...validPartner, price: -1 });
expect(r.error?.issues.map((i) => i.path.join('.'))).toEqual(['price']);
```

Assert the error code or message, and start every rejection case from a
fully valid fixture with one field changed.

**Far from the boundary.** A 5–10 day rule tested with 14, a 10,000 cap
tested with 15,000, "strictly increasing" tested with 500 and 1,000. Turning
`>=` into `>` still passes. Test both sides of every boundary: 4 and 5, 10
and 11, 10,000 and 10,001, two equal neighbours.

**Fixture that cannot tell right from wrong.** Equal values for fields the
test distinguishes (`projected = accrued = claimable = 1600`), one item for
an ordering rule, no duplicate for a dedupe rule, no disabled item for a
filter, one mock response that satisfies both the success and the error
expectation. Build the fixture so that the plausible wrong implementation
gives a different answer.

**Timezone not pinned.** Local-time logic (date pickers, "start of day",
schedules) passes trivially when the machine runs in UTC or UTC+7. Set `TZ`
for the test run to a negative offset (e.g. `America/Los_Angeles` in the
test script or config) and use dates near midnight.

**Name promises more than the test asserts.** "Sends exactly once" with no
count, "saves history" in code that has no history, "restores values on
cancel" with no check of the values. Readers trust the name and skip the
case. Assert what the name says, or rename the test to what it checks.

## 3. Tests that fail for the wrong reason

**Change detector.** Asserts a decision, not a behaviour:
`expect(SHIPPING_FEE).toBe(30_000)`, a static list of options, exact call
order, an exact query string or option object, a whole-tree snapshot. It
fails on every intended change and catches no bug. Test what depends on the
decision ("an order of 499,999 pays shipping, 500,000 does not"); compare
query parameters as entries when their order does not matter.

**Implementation details.** Asserts internal state, private helpers, hook
return shapes the UI does not use, CSS classes, or render counts. A refactor
breaks it while a wrongly wired click handler still passes. Test through the
public interface: the function's output, the HTTP response, the screen.

**Verifying through a side channel.** Calls `POST /users`, then reads the
collection directly. Verify through the interface (`GET /users/:id`) unless
the stored shape *is* the contract.

**Shared mutable state.** Module-level `let`, a fixture array that tests
mutate, a store not reset between tests, a global assigned and never
restored (`vi.restoreAllMocks` does not undo `global.fetch = ...`), a
listener removed at the end of the test body. Tests pass alone and fail
together, or the reverse. Build data with factories and undo every global
change in `afterEach`, so a failing test does not leak it.

**Real time and order.** `Date.now()`, real sleeps, "day 10 of the current
month", relying on test order. Use fake timers or `vi.setSystemTime`; never
add retries or sleeps to make a test pass.

## 4. Mocking mistakes

**Mocking your own code.** `vi.mock('./useOrders')`, `vi.mock('@/lib/api')`,
`vi.mock('../cartStore')`. The test passes while the real integration
breaks: schemas, error mapping, and auth headers never run. Mock only at the
system edge: HTTP (MSW), time, randomness, third-party SDKs (wagmi, wallet
adapters), email or payment providers. The project's own database in a
server test is not an edge: use the real one (`mongodb-memory-server`).

**Mocking `fetch` or the API client** instead of the network. Use MSW, so the
real request code, headers, and error mapping run.

**Testing the dev mock.** The outcome depends on rules or data that live in
the app's development MSW handlers: a single-use nonce, sorting, a 409,
shared fixtures. It passes whatever the real backend does and breaks when
someone edits the dev mock. Shared default handlers are fine for setup; when
the test asserts on a response, set that response in the test with
`server.use(...)`, following the documented contract. Check the contract
itself against the OpenAPI spec or the real backend.

**Asserting calls on a stub.** `expect(getUser).toHaveBeenCalledWith(1)` when
`getUser` only feeds data in. Assert the outcome. Check calls only for
outgoing side effects the user cares about and cannot observe otherwise (an
email sent, a payment captured, an analytics event the business relies on).

**Request assertions in MSW.** Spying on the request body inside a handler.
Put the check in the handler (return 400 for a bad payload) and assert how the
UI reacts.

**Partial or invented fixtures.** A mock response with only the fields this
test reads, or an error the real dependency never throws (a fake `AuthError`
where the client throws a `ZodError`). Code that reads another field, or
handles the real error, breaks only in production. Mirror real responses,
ideally captured ones or a shared factory.

## 5. Redundancy and noise

**One test per method instead of per behaviour.** Seven tests for seven
one-line store setters. Test the actions that hold a rule (merging a
duplicate SKU, removing at qty 0) and leave plain assignments to the browser
check.

**Overlapping cases.** Several tests or rows that take the same branch with
different strings. Keep one case per branch or boundary side; put the cases
of one rule in one `it.each` table.

**Testing the library.** "TanStack Query caches", "Zod rejects a missing
required field", "Mongoose enforces `required`", "`Intl` formats VND",
"AbortSignal aborts". Upstream tests these. Test your own contract at the
boundary; if the library surprised you once, one narrow characterisation
test is enough.

**Duplicated levels.** The same rule tested in the pure function, again in
the hook, again in the component, or once per hook that shares a lifecycle
helper. Test the rule where it lives; elsewhere check only that the result
reaches the caller.

**Testing dead code.** The function has no production caller; only its test
keeps it alive. Propose deleting both.

**Snapshot spam.** `toMatchSnapshot()` of whole trees gets approved without
reading. Assert specific text and roles; keep snapshots for small, stable,
serialisable output.

**Coverage chasing.** Tests added to lift a percentage. Cover the branches the
change touched, including the error path, and stop.

## 6. React Testing Library mistakes

- **Query priority:** `getByRole` (with `name`), `getByLabelText`, `getByText`,
  then `getByTestId` as a last resort. Never `container.querySelector`, a CSS
  class, or a position such as `getAllByRole('button')[1]`.
- **Async:** `findBy*` for something that appears later; `queryBy*` only to
  assert absence; `waitFor` with a single assertion inside, no side effects.
- **Events:** `userEvent.setup()` and `await user.click(...)`, not `fireEvent`.
- **`act`:** do not wrap RTL calls in `act`; they already are. An `act`
  warning means an update you did not await.
- **`screen`** instead of destructuring queries from `render`.
- **No RTL installed** (raw `createRoot` and `act`): follow the house style
  and ask before adding the dependency.

## 7. Production code bent for tests

**Test-only methods or branches.** `store.__reset()`, `resetForTesting()`,
`if (process.env.TEST)`, exports added only so a test can reach a private
helper. Keep helpers in test utilities; if a private helper needs its own
tests, it is a module of its own.

**Test ids everywhere.** `data-testid` on elements that already have a role
and accessible name. Add one only when no accessible query exists.
