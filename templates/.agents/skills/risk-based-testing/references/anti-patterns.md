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

**Rejection that fails for another reason.** An invalid input that breaks two
rules, or misses an unrelated required field, so it is rejected whatever the
rule under test does.

```ts
// Bad: no visibilityRules, so this fails even with no price rule at all
expect(partnerSchema.safeParse({ ...base, price: -1 }).success).toBe(false);
// Good: valid except for the one rule, and the issue points at that field
const r = partnerSchema.safeParse({ ...validPartner, price: -1 });
expect(r.error?.issues.map((i) => i.path.join('.'))).toEqual(['price']);
```

Start every rejection case from a fully valid fixture, change one field, and
assert the issue path or error code.

**Vacuous absence check.** `expect(queryByText('Error')).toBeNull()` right
after render, before the async flow could show it; inside `waitFor`, where it
passes on the first tick; or for text that appears in no source file or
dictionary. Wait for the positive outcome first (`await findByText(...)`),
then assert the absence, and check the string actually exists in the code.

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

**Look-alike fixture values.** `projected = accrued = claimable = 1600`, or
the same id for user and partner. The test cannot tell which field the code
reads, so swapping them passes. Give every field the test distinguishes a
different value.

**Real time and order.** `Date.now()`, timeouts, or relying on test order. Use
fake timers or inject the clock; never add retries or sleeps to make it pass.

**Timezone not pinned.** Local-time logic (date pickers, "start of day",
schedules) passes trivially when the machine runs in UTC or UTC+7. Set `TZ`
for the test run to a negative offset (e.g. `America/Los_Angeles` in the
test script or config) and use dates near midnight.

## 3. Mocking mistakes

**Mocking your own code.** `vi.mock('./useOrders')`, `vi.mock('../cartStore')`,
`vi.mock('./pricing')`. The test passes while the real integration breaks.
Mock only at the system edge: HTTP (MSW), time, randomness, third-party SDKs,
email or payment providers. The project's own database in a server test is
not an edge: use the real one (`mongodb-memory-server`).

**Mocking `fetch` or the API client** instead of the network. Use MSW, so the
real request code, headers, and error mapping run.

**Testing the dev mock.** An "API contract" test that runs against the MSW
handlers the app uses for local development (often with
`onUnhandledRequest: 'bypass'`). It checks the mock's own rules, so it passes
whatever the real backend does. Give each test its own handlers that return
the documented responses, and test how the app reacts; check the contract
itself against the OpenAPI spec or the real backend.

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

**Name promises more than the test asserts.** "Sends exactly once" with no
count, "saves history" in code that has no history, "rejects X and Y" where
only X is checked. Readers trust the name and skip the case. Assert what the
name says, or rename the test to what it checks.

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
