# Frontend Target Structures

Problems that do not show in one file and grow with the app, each with a
symptom you can search for and the structure to move toward. Follow the
project's existing structure when it already solves the problem; these are
the defaults when it does not.

## Contents

1. Module boundaries
2. One way per concern
3. State ownership
4. Shared components with too many props
5. Dumping-ground folders and barrels
6. Data crossing the API boundary
7. Error handling and fallbacks
8. Flags and leftovers

## 1. Module boundaries

**Symptom:** a component imports from `pages/`; a store or util imports a
component; feature A imports `features/b/components/...`; deleting a page or
feature breaks unrelated code.

**Target:** dependencies point one way, from routes down to shared code:

- Without feature folders: `pages`/`app` → `components` → `hooks`, `stores`,
  `services`, `api` → `utils`, `lib`, `types`, `constants`. A component that
  needs something from a page usually needs it moved down (menu config into
  `constants`, a sidebar into `components`).
- With feature folders: `app`/`pages` → `features/*` → `shared`. A feature
  exposes a public `index.ts`; other features import only from it. Two
  features that need each other's internals usually share a missing domain
  module: move it into `shared` or `entities/<name>`.

Agents follow lint errors better than prose, so propose a rule; adding a lint
plugin is the user's call. Use what the project has (`eslint-plugin-boundaries`
or dependency-cruiser scale to many features); otherwise
`import/no-restricted-paths` from `eslint-plugin-import`, where `target` is
the importing folder and `from` the forbidden one:

```js
'import/no-restricted-paths': ['error', { zones: [
  { target: './src/components', from: './src/pages' },
  { target: './src/shared', from: './src/features' },
  { target: './src/features/a', from: './src/features/b', except: ['./index.ts'] },
] }],
```

## 2. One way per concern

**Symptom:** two or more libraries or styles for the same job: axios and
`fetch` wrappers and a query library; Redux and Zustand and Context stores;
Formik and React Hook Form; moment and date-fns; CSS modules and Tailwind
and styled-components. The scan's pattern inventory lists these.

**Target:** one current way per concern, written down, and the legacy way
blocked for new code. ESLint's core `no-restricted-imports` needs no new
dependency; `paths` matches the exact module, `patterns` also its subpaths:

```js
'no-restricted-imports': ['error', {
  paths: [{ name: 'axios', message: 'Use apiClient from @/shared/api (ADR 0007).' }],
  patterns: [{ group: ['axios/*'], message: 'Use apiClient from @/shared/api.' }],
}],
```

Exempt the remaining legacy files with a config entry scoped to them
(`files` in flat config, `overrides` in `.eslintrc`), not inline disables,
when their migration is not part of this task. The lint message is
what stops the next agent from copying the legacy file next to it.

## 3. State ownership

Each piece of state has exactly one owner:

| State | Owner | Symptom of a second owner |
|---|---|---|
| Server data | The query library cache (TanStack Query, SWR, RTK Query) | `useEffect(() => setX(data), [data])`; query results copied into a store |
| Filters, tabs, pagination, selected id that should survive refresh or a shared link | URL search params | Lost on refresh or share; synced to the URL by an effect |
| Form input, including an editable copy of server data | The form library, seeded once from the query | Mirrored into a store on every keystroke; reset by an effect on every refetch |
| Values computable from other state | Nobody: compute during render | `useState` plus an effect that keeps it in sync |
| Cross-page client state (theme, session UI, cart draft) | One store | The same value in Context and a store |

Moving a second owner out is a behaviour-sensitive change: refetch timing,
refresh behaviour, and loading states can shift. Cover it with tests or a
browser check before and after.

## 4. Shared components with too many props

**Symptom:** a `Button`, `Modal`, `Table`, or `Card` with many props, three
or more booleans that change layout (`isCompact`, `hideHeader`,
`withFooter`), or props that only make sense together. Every new caller
adds another flag.

**Target:** composition instead of configuration.

- Layout variations: `children` or named slots (`header`, `footer`), or a
  compound component (`<Table.Header>`, `<Table.Row>`).
- Visual variants only: one `variant`/`size` union (cva or the project's
  equivalent), not booleans.
- Different behaviour: separate components sharing primitives, not one
  component with a `mode` prop.

Changing a shared component's props is a one-way door when it is published
or widely used; see `ambiguity-decisions`.

## 5. Dumping-ground folders and barrels

**Symptom:** `utils/`, `helpers/`, `common/`, `lib/misc` with dozens of
unrelated functions; `utils.ts` files over a few hundred lines; `export *`
barrels at `components/index.ts` that create import cycles and slow tests
and dev builds.

**Target:**

- Colocate: a function used by one feature lives in that feature.
- Shared only when two or more features use it, in a file named by domain
  (`money.ts`, `dates.ts`), not by kind (`helpers.ts`).
- Barrels only as a feature's public API. Inside a feature, and in shared
  UI, import the file directly.

## 6. Data crossing the API boundary

**Symptom:** `as User`, `as any`, or optional chaining on API data in many
components; the same response mapped differently in several places.

**Target:** parse and map once, where data enters (the API client or the
query function), with the project's schema library (Zod, Valibot). Components
receive typed, non-optional data. The `as` casts then disappear instead of
spreading.

## 7. Error handling and fallbacks

**Symptom:** `try/catch` with `console.error` in components, `?? []` and
`?.` on values that should never be missing, empty `catch {}`.

**Target:** one place per kind of error: the query library's error state
and an error boundary for rendering, the API client for auth and network
errors, form validation for input. Remove fallbacks that hide a contract
violation; keep fallbacks for values that are optional by design.

## 8. Flags and leftovers

**Symptom:** feature flags that are always on, `if (false)` branches,
components with no importers, exports nobody uses.

**Target:** remove the dead branch with the flag. Use the project's
dead-code tool if present (`knip`, `ts-prune`); otherwise search for
importers before deleting. Confirm with the user before removing a flag
that a remote config may still toggle.
