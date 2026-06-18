---
name: react-refactor-patterns
description: Use when refactoring, modularizing, or optimizing existing React components.
  Refactoring legacy React code (business logic extraction, React Query, Zustand,
  hooks). NOT for new features.
---


# Architecture Refactor Skill

Activate this skill when refactoring, optimizing structure, or detecting code that violates logic layer boundaries.

---

## 1. Before/After — Business Logic

**❌ Before:** Calculation logic inside `useEffect` + `setState`
```tsx
export function AssessmentResult({ results }) {
  const [score, setScore] = useState(0);
  const [rating, setRating] = useState("");

  useEffect(() => {
    const successCount = results.filter(r => r.status === "passed").length;
    const percentage = Math.round((successCount / results.length) * 100);
    setScore(percentage);
    if (percentage >= 90) setRating("Excellent");
    else if (percentage >= 70) setRating("Good");
    else setRating("Needs Improvement");
  }, [results]);

  return <div>{rating} — {score}%</div>;
}
```

**✅ After:** Pure function in `utils/`, component only calls and renders
```ts
// utils/assessment.utils.ts — No React import
export function calculateResult(results: Result[]): FinalScore {
  const successCount = results.filter(r => r.status === "passed").length;
  const percentage = Math.round((successCount / results.length) * 100);
  const rating = percentage >= 90 ? "Excellent" : percentage >= 70 ? "Good" : "Needs Improvement";
  return { percentage, rating, summary: `${successCount}/${results.length} (${percentage}%)` };
}
```
```tsx
// Component — no useState needed, no useEffect needed
export function AssessmentResult({ results }) {
  const { percentage, rating, summary } = calculateResult(results);
  return <div>{rating} — {summary}</div>;
}
```

---

## 2. Before/After — Data Logic (API → React Query)

**❌ Before:** `axios` + `useEffect` + manual loading/error/cancel management
```tsx
export function ResourceList({ groupId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    axios.get(`/api/groups/${groupId}/resources`)
      .then(res => { if (!cancelled) setItems(res.data); })
      .catch(() => { if (!cancelled) setError("Error"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [groupId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  return <ul>{items.map(item => <li key={item.id}>{item.name}</li>)}</ul>;
}
```

**✅ After:** Split into 3 layers
```ts
// services/resource.service.ts — Pure HTTP, no React
export async function getResources(groupId: string): Promise<Resource[]> {
  const res = await httpClient.get<Resource[]>(`/api/groups/${groupId}/resources`);
  return res.data;
}
```
```ts
// hooks/queryKeys.ts — Query Key Factory
export const queryKeys = {
  resources: {
    all: ["resources"] as const,
    list: (groupId: string) => [...queryKeys.resources.all, "list", groupId] as const,
  },
};
```
```ts
// hooks/useResources.ts — React Query wrapper
export function useResourceList(groupId: string) {
  return useQuery({
    queryKey: queryKeys.resources.list(groupId),
    queryFn: () => getResources(groupId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateResource(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateDto) => createResource(groupId, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.resources.all }),
  });
}
```
```tsx
// Component — 1-line hook, React Query handles everything
export function ResourceList({ groupId }) {
  const { data: items, isPending, error } = useResourceList(groupId);
  if (isPending) return <p>Loading...</p>;
  if (error) return <p>Error</p>;
  return <ul>{items.map(item => <li key={item.id}>{item.name}</li>)}</ul>;
}
```

---

## 3. Before/After — UI Logic (Custom Hook)

When a component has **≥ 3 interleaved useState** for the same feature → extract custom hook.

**❌ Before:** 5 useState + 4 useEffect for search + debounce + keyboard nav
```tsx
// 80+ lines of mixed logic in component
const [query, setQuery] = useState("");
const [debouncedQuery, setDebouncedQuery] = useState("");
const [results, setResults] = useState([]);
const [isOpen, setIsOpen] = useState(false);
const [activeIndex, setActiveIndex] = useState(-1);
// ... useEffect debounce, useEffect filter, useCallback keyboard, useEffect scroll
```

**✅ After:** Generic custom hook, component only renders
```ts
// useSearchInput.ts — encapsulates all behavior
export function useSearchInput<T>({ items, filterFn, onSelect, debounceMs = 300 }) {
  // All state + effect resides in the hook
  return { query, setQuery, results, isOpen, activeIndex, listRef, handleKeyDown };
}
```
```tsx
// Component — call hook, attach to JSX
const { query, setQuery, results, isOpen, activeIndex, listRef, handleKeyDown } = useSearchInput({
  items,
  filterFn: (item, q) => item.name.toLowerCase().includes(q.toLowerCase()),
  onSelect: (item) => setQuery(item.name),
});
```

> **When to extract hook?**
> - ✅ Mandatory: same logic repeated in ≥ 2 components
> - ⚠️ Consider: component is too large, many interleaved states
> - 🔄 Prioritize splitting components before considering hooks

---

## 4. Before/After — Application Logic (Context → Zustand)

**❌ Before:** Context + Provider + manual localStorage
```tsx
// AuthProvider manages state, calls API, and reads/writes localStorage
// → "Provider hell" when adding Theme, Sidebar, Notification...
// → All children re-render when any field changes
// → Cannot access auth outside React (axios interceptor)
```

**✅ After:** Zustand store + persist middleware
```ts
// stores/auth.store.ts
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      user: null, token: null, isAuthenticated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: "auth-storage", partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }) }
  )
);
```
```tsx
// Component — selector only re-renders when field changes
const user = useAuthStore((s) => s.user);
const logout = useAuthStore((s) => s.logout);
```
```ts
// Outside React (axios interceptor) — use getState()
const token = useAuthStore.getState().token;
```

---

## 5. React Query vs Zustand — Boundaries

The only question: **"Does this data originate from the server?"**

| Criterion | React Query (Server State) | Zustand (Client State) |
|---|---|---|
| Origin | Server / API | Created by Client |
| Ownership | Server — client only caches | Client — source of truth |
| Sync | Background refetch, stale-while-revalidate | No sync needed |
| Stale? | Yes — other users can change it | No — client is always right |
| Persistence | Automatic cache (staleTime, gcTime) | Zustand persist middleware |

**Confusing cases:**

| Scenario | Answer | Reason |
|---|---|---|
| Shopping cart before checkout | Zustand | Client-created, not yet sent to server |
| Shopping cart after checkout | React Query | Already exists on server |
| User profile from API | React Query | Data from server, needs caching |
| Theme dark/light | Zustand | User preference, client-only |
| Unsubmitted form draft | useState/Zustand | Client-created, not yet sent |

---

## 6. Stack Role Reference

| Tool | Used for | NOT used for |
|---|---|---|
| `utils/` (pure fn) | Calculation, transform, validation | UI state, API call |
| React Query | Fetch, cache, sync server data | Client state (theme, sidebar) |
| Zustand | Global client state (auth, theme) | Server data (use RQ) |
| Custom hooks | Encapsulate complex React logic | Pure business logic (use utils) |
| `services/` | Pure HTTP call (axios/fetch) | Caching, state management |

---

## 7. Component Rule — Checklist

**Belongs to component:**
- JSX, conditional rendering
- Hook composition: `useResourceList(id)`, `useAuthStore(s => s.user)`
- Event handler delegation: `onClick={() => mutation.mutate(data)}`
- Simple derived value: `const isReady = data && !isPending`

**Needs to be extracted:**
- Complex or reusable calculation > 10 lines → `utils/`
- API call → `services/` + `hooks/` (React Query)
- ≥ 3 interleaved useState for the same feature → Custom hook
- Shared state → `stores/` (Zustand)

**NOT needed to be extracted:**
- Simple UI feedback (confetti, toast) in event handler
- 1-2 simple useState (toggle, local input)
- 1-line derived value

---

## 8. File Naming Convention

*Prefer grouping these files into feature directories (e.g., `src/features/auth/*`) over global layer folders.*

| Type | Pattern | Example |
|---|---|---|
| Hooks | `use*.ts` | `useResource.ts` |
| Services | `*.service.ts` | `auth.service.ts` |
| Stores | `*.store.ts` | `auth.store.ts` |
| Utils | `*.utils.ts` | `math.utils.ts` |
| Types | `*.types.ts` | `auth.types.ts` |
| Components | `PascalCase.tsx` | `ResourceList.tsx` |

## 9. Anti-Patterns

1. **Fat Component** — Performs calculation, fetching, and rendering simultaneously.
   → Separate by logic layer (§1-4).

2. **Business Logic in Hook** — Placing validation/transform in `useEffect` or React Query `select`.
   → Extract to pure function in `utils/` (use **Mapper pattern** to transform raw API data to UI models).

3. **Prop Drilling** — Props passed through ≥ 3 intermediate levels.
   → Zustand or child component fetches itself using React Query hook.

4. **Mixed State** — Using Zustand to cache server data, or React Query for client state.
   → Server data → React Query. Client state → Zustand. Never copy server data into Zustand.

## 10. Error Handling Strategy

1. **Service Layer** — Services should throw clean error objects (not just strings).
2. **Hook Layer** — React Query handles error state. Use `onError` in mutations for side-effects (toasts).
3. **UI Layer** — Use Error Boundaries for unexpected crashes. For API errors, prefer displaying local error states (from RQ) near the affected UI.
4. **Consistency** — Standardize the error response shape in `services/` to simplify catch blocks in hooks.
