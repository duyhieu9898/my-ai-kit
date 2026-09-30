---
name: react-refactor-patterns
description: >-
  Restructures existing React components into pure utils, services, query
  hooks, custom hooks, and Zustand stores. Use when a component mixes
  fetching, logic, and rendering, grows too long, drills props, or when moving
  Context state to a store. Not for render performance (use
  nextjs-react-expert).
---

# React Refactor Patterns

A refactor keeps behaviour identical and moves each responsibility to the
tier that owns it. Follow the project's existing layout and libraries: if it
uses SWR instead of TanStack Query, or Redux/Jotai instead of Zustand, apply
the same tiers with those. Add a new library only when asked.

## Before changing anything

1. Read the component, its callers, and its tests. Note the props contract
   and the rendered output you must preserve.
2. If there are no tests, add a render test for the current behaviour first
   (see `testing-patterns`), so the refactor can be checked.
3. Refactor in small steps (extract util, then service, then hook), running
   the tests after each.

## Tiers

| Tier | Owns | Must not contain |
|---|---|---|
| `utils/` | Calculations, formatting, mapping, validation | React imports, hooks, API calls |
| `services/` | Raw HTTP or SDK calls, returning typed data or throwing typed errors | State, caching, invalidation |
| Query hooks (TanStack Query) | Fetching, caching, mutations, invalidation | UI state (theme, menus, modals) |
| Custom hooks | Composed UI state: debounce, keyboard navigation, form wiring | Pure calculations (move to `utils/`) |
| Stores (Zustand) | Client-created global state: theme, sidebar, cart before checkout | Copies of server data |
| Component | JSX, conditional rendering, calling hooks, wiring handlers | Inline fetches, calculations over about 10 lines |

## Where state belongs

Pick the smallest home, in this order:

1. local `useState`;
2. shared parent state or Context (low-frequency values only);
3. the URL (`searchParams`) when it should survive reload or be shareable;
4. a Zustand store for truly global client state.

Server data goes to the query layer regardless. Ask "did this data come from
the server?":

| Case | Home |
|---|---|
| User profile from the API | Query cache |
| Cart before checkout | Store (client-created) |
| Order after checkout | Query cache |
| Theme, sidebar open | Store |
| Unsubmitted form draft | `useState` or form library, store only if it must survive navigation |

Never copy query results into a store or `useState`. Two copies drift, and
the store copy never refetches. Derive values during render instead.

## Thresholds

- **Split a component** at about 150 lines, or when it handles two unrelated
  concerns. Split into child components before writing custom hooks.
- **Extract a custom hook** when three or more `useState` values serve one
  behaviour, or the same behaviour appears in two components.
- **Extract a util** for any calculation over about 10 lines, or any logic
  worth a unit test.
- **Fix prop drilling** past three levels: let the child call the query hook
  or a store selector itself, or use composition (`children`).

## Patterns

**Calculation in an effect → pure util.** State that is computed from props
does not need `useState` + `useEffect`:

```ts
// utils/assessment.utils.ts: no React import
export function calculateResult(results: Result[]) {
  const passed = results.filter((r) => r.status === 'passed').length;
  const percentage = Math.round((passed / results.length) * 100);
  const rating = percentage >= 90 ? 'Excellent' : percentage >= 70 ? 'Good' : 'Needs work';
  return { percentage, rating };
}

// Component: compute during render
const { percentage, rating } = calculateResult(results);
```

**`useEffect` fetch → service + key factory + query hook:**

```ts
// services/resource.service.ts
export async function getResources(groupId: string): Promise<Resource[]> {
  const res = await httpClient.get<Resource[]>(`/api/groups/${groupId}/resources`);
  return res.data;
}

// hooks/queryKeys.ts
export const queryKeys = {
  resources: {
    all: ['resources'] as const,
    list: (groupId: string) => [...queryKeys.resources.all, 'list', groupId] as const,
  },
};

// hooks/useResources.ts
export function useResourceList(groupId: string) {
  return useQuery({
    queryKey: queryKeys.resources.list(groupId),
    queryFn: () => getResources(groupId),
  });
}

export function useCreateResource(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateResourceDto) => createResource(groupId, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.resources.all }),
  });
}
```

The component then reads `const { data, isPending, error } = useResourceList(groupId)`.
Calling a util from the query's `select` option is fine; writing the mapping
inline there is not.

**Context → Zustand.** Move a Context only when frequent updates re-render a
large tree. Read with selectors so a component re-renders only for its field:

```ts
// stores/ui.store.ts
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarOpen: true,
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    { name: 'ui-preferences', partialize: (s) => ({ theme: s.theme }) },
  ),
);

const theme = useUiStore((s) => s.theme);
```

**Auth state:** do not persist access or refresh tokens to `localStorage`
through `persist`. Any XSS can read them. Prefer an httpOnly, Secure,
SameSite cookie set by the server, and keep only non-secret flags (for
example the user's display name) in the store. With Supabase, let
`@supabase/ssr` manage the session cookies and read the user from the
Supabase client instead of copying it into a store.

## Errors

- Services throw typed `Error` subclasses, not strings.
- Query hooks expose `error`; trigger toasts from a mutation's `onError`.
- Components render a local error state next to the failed part; an Error
  Boundary catches the rest.

## File naming

Group by feature (`src/features/<feature>/...`) when the project does, and
follow its existing names first. Otherwise: `use<Name>.ts`,
`<name>.service.ts`, `<name>.store.ts`, `<name>.utils.ts`,
`<name>.types.ts`, and `<PascalCase>.tsx` for components.

## Done when

Rendered output and the props contract are unchanged, the existing and new
tests pass, `utils/` has no React imports, no server data is copied into a
store, no token is persisted to web storage, and each touched component is
under about 150 lines. Use `verify-changes` for the wider checks.
