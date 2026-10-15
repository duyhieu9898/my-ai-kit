# Test Anti-Patterns

Each entry: what it looks like, why it hurts, the fix. Use it as a checklist
when writing tests and when reviewing a suite.

## Contents

1. Tests that cannot fail
2. Tests that fail for the wrong reason
3. Mocking mistakes
4. Redundancy and noise
5. React Testing Library mistakes
6. Production code bent for tests

## 1. Tests that cannot fail

**Tautological assertion.** The expected value is computed with the code under
test or the same formula.

```ts
// Bad: passes whatever the formula is
expect(subtotal(items)).toBe(items.reduce((s, i) => s + i.unitPrice * i.qty, 0));
// Good: a literal worked out by hand
expect(subtotal([{ sku: 'A', unitPrice: 120_000, qty: 2 }])).toBe(240_000);
```

**Existence-only assertion.** Render, then `toBeInTheDocument()` or
`toBeTruthy()` with nothing about the outcome. It fails only on a crash or a
renamed label. Assert the value the user should see.

**Testing the mock.** The only assertion is on a mock you set up, or on a
`*-mock` test id. It proves the mock exists. Assert the real effect, or delete
the test.

**Never seen failing.** A test written after the code and passing on the
first run may be testing nothing. Break the code once and watch it fail.

**Unawaited async assertion.** `expect(promise).rejects.toThrow()` without
`await` passes before the promise settles. Vitest 5 fails these; older
versions do not.

## 2. Tests that fail for the wrong reason

**Change detector.** Asserts a decision, not a behaviour:
`expect(SHIPPING_FEE).toBe(30_000)`, exact call order of collaborators, exact
query strings or SQL, a whole-tree snapshot. It fails on every intended change
and catches no bug. Test what depends on the decision instead ("an order of
499,999 pays shipping, 500,000 does not").

**Implementation details.** Asserts internal state, private helpers, hook
return shapes the UI does not use, or how many times a component rendered. A
refactor breaks it while a wrongly wired click handler still passes. Test
through the public interface: the function's output, the HTTP response, the
screen.

**Verifying through a side channel.** Calls `POST /users`, then reads the
collection directly. Verify through the interface (`GET /users/:id`) unless
the stored shape *is* the contract.

**Shared mutable state.** Module-level `let`, a store not reset between tests,
a big `beforeEach` that later tests mutate, nested `describe` blocks layering
setup. Tests pass alone and fail together, or the reverse. Use factories and
reset stores in `afterEach`.

**Real time and order.** `Date.now()`, timeouts, or relying on test order. Use
fake timers or inject the clock; never add retries or sleeps to make it pass.

## 3. Mocking mistakes

**Mocking your own code.** `vi.mock('./useOrders')`, `vi.mock('../cartStore')`,
`vi.mock('./pricing')`. The test passes while the real integration breaks.
Mock only at the system edge: HTTP (MSW), time, randomness, third-party SDKs,
email or payment providers. The project's own database in a server test is
not an edge: use the real one (`mongodb-memory-server`).

**Mocking `fetch` or the API client** instead of the network. Use MSW, so the
real request code, headers, and error mapping run.

**Asserting calls on a stub.** `expect(getUser).toHaveBeenCalledWith(1)` when
`getUser` only feeds data in. Assert the outcome. Check calls only for
outgoing side effects the user cares about and cannot observe otherwise (an
email sent, a payment captured, an analytics event the business relies on).

**Request assertions in MSW.** Spying on the request body inside a handler.
Put the check in the handler (return 400 for a bad payload) and assert how the
UI reacts.

**Partial fixtures.** A mock response with only the fields this test reads.
Code that later reads another field breaks only in production. Mirror the real
response shape, ideally from a shared factory.

**One double for every branch.** A single mock response that satisfies both
the success and the error expectation. Give each branch its own response.

## 4. Redundancy and noise

**One test per method instead of per behaviour.** Seven tests for seven
one-line Zustand setters. Test the actions that hold a rule (merging a
duplicate SKU, removing at qty 0) and leave plain assignments to the browser
check.

**Overlapping cases.** Several tests that take the same branch with different
strings. Keep one case per branch or boundary; put true equivalents in one
`it.each` table.

**Testing the library.** "TanStack Query caches", "React Router renders the
route", "Mongoose rejects a missing required field", "`Intl` formats VND".
Upstream tests these. Test your own contract at the boundary; if the library
surprised you once, one narrow characterisation test is enough.

**Duplicated levels.** The same rule tested in the pure function, again in the
hook, again in the component. Test the rule where it lives; the component test
checks only that the result reaches the screen.

**Snapshot spam.** `toMatchSnapshot()` of whole trees gets approved without
reading. Assert specific text and roles; keep snapshots for small, stable,
serialisable output.

**Coverage chasing.** Tests added to lift a percentage. Cover the branches the
change touched, including the error path, and stop.

## 5. React Testing Library mistakes

- **Query priority:** `getByRole` (with `name`), `getByLabelText`, `getByText`,
  then `getByTestId` as a last resort. Never `container.querySelector`.
- **Async:** `findBy*` for something that appears later; `queryBy*` only to
  assert absence; `waitFor` with a single assertion inside, no side effects.
- **Events:** `userEvent.setup()` and `await user.click(...)`, not `fireEvent`.
- **`act`:** do not wrap RTL calls in `act`; they already are. An `act`
  warning means an update you did not await.
- **`screen`** instead of destructuring queries from `render`.

## 6. Production code bent for tests

**Test-only methods or branches.** `store.__reset()`, `if (process.env.TEST)`,
exports added only so a test can reach a private helper. Keep helpers in test
utilities; if a private helper needs its own tests, it is a module of its own.

**Test ids everywhere.** `data-testid` on elements that already have a role
and accessible name. Add one only when no accessible query exists.
