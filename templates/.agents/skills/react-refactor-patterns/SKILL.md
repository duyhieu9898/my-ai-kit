---
name: react-refactor-patterns
description: >-
  Use when refactoring, modularizing, or optimizing existing React components.
  Refactoring legacy React code (business logic extraction, React Query, Zustand, hooks).
  NOT for new features.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# ⚛️ React Refactor Patterns Skill

> Strategic guidelines and architectural patterns for refactoring, modularizing, and decoupling business logic in React applications.

---

## 📑 Content Map

| File / Resource | Description | When to Read |
|:---|:---|:---|
| _No supplementary files_ | Main React refactor procedures are in this file | Use this file by default |

---

## 🔗 Related Skills

| Skill | Relationship | When to Collaborate |
|:---|:---|:---|
| [`frontend-specialist`](../frontend-specialist/SKILL.md) | Parent Persona | For complete UX/UI and component architectural changes |
| [`clean-code`](../clean-code/SKILL.md) | Quality Foundation | To ensure strict clean code, typing, and safety standards |
| [`simplify-code`](../simplify-code/SKILL.md) | Refactor Companion | When dealing with redundant loops, nested conditions, or long blocks |

---

## 🛠️ Instructions / Procedures

When tasked with refactoring, optimizing, or modularizing existing React components, strictly follow this step-by-step procedure:

### Step 1: Detect Boundary Violations & Code Smells
1. Audit target components to identify inlined calculation engines, direct network fetches, interleaved state hook structures, or deep prop-drilling blocks.
2. Formulate a modularization plan to map components to their designated tier (utils, queries, stores, hooks).

### Step 2: Extract Pure Business Logic (Utils)
1. Isolate algorithmic transforms, string parses, or data calculations.
2. Extract them as pure, React-free functions located in `utils/` (Business Logic Extraction). Ensure they can be unit-tested without rendering contexts.

### Step 3: Decouple Data Logic Layers (Queries & Services)
1. Move direct inlined Axios or fetch calls into unified Service Classes (`services/`).
2. Construct custom query hooks (`useQuery`, `useMutation`) with cached query-key factories (Data Logic Extraction).

### Step 4: Extract Complex UI State (Custom Hooks)
1. Identify components with interleaved state hooks or massive input/keyboard handlers.
2. Move state orchestrations to Custom Hooks (`use[Name].ts`), leaving components to act as pure layout engines.

### Step 5: Migrate Client Global States (Stores)
1. Identify Context Providers that cause excessive rendering performance blocks.
2. Migrate client-only global settings (auth tokens, themes, layout gates) to Zustand stores.

### Step 6: Validate Refactored Components
1. Confirm component line bounds and folder organization boundaries (Responsibility Checklist).
2. Validate compliance using the **Quality Audit Checklist** before final code commits.

---

### 1. Business Logic Extraction (React Component ➜ Utils)
Ensure calculation logic is written as pure functions without React imports.

*   **❌ Legacy Pattern (Component-bound):** Calculation logic inside `useEffect` + `setState`
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

*   **✅ Refactored Pattern (Decoupled Layer):** Pure function in `utils/`, component only calls and renders.
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

### 2. Data Logic Extraction (API Fetching ➜ React Query)
Separate network requests, cache keys, and React Query orchestration into individual layers.

*   **❌ Legacy Pattern (Direct Fetching):** `axios` + `useEffect` + manual state management.
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

*   **✅ Refactored Pattern (3-Tier Data Architecture):**
    ```ts
    // 1. services/resource.service.ts — Pure HTTP, no React
    export async function getResources(groupId: string): Promise<Resource[]> {
      const res = await httpClient.get<Resource[]>(`/api/groups/${groupId}/resources`);
      return res.data;
    }
    ```
    ```ts
    // 2. hooks/queryKeys.ts — Query Key Factory
    export const queryKeys = {
      resources: {
        all: ["resources"] as const,
        list: (groupId: string) => [...queryKeys.resources.all, "list", groupId] as const,
      },
    };
    ```
    ```ts
    // 3. hooks/useResources.ts — React Query wrapper
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

### 3. UI Interaction Logic Extraction (Custom Hooks)
When a component has **≥ 3 interleaved useState** for the same feature, extract it into a custom hook.

*   **❌ Legacy Pattern (Complex Interleaved UI State):** 5 useState + 4 useEffect for search + keyboard navigation inlined.
    ```tsx
    // 80+ lines of mixed UI behaviors inlined in component
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    // ... useEffect debounce, useEffect filter, useCallback keyboard, useEffect scroll
    ```

*   **✅ Refactored Pattern (Custom Hook encapsulation):**
    ```ts
    // useSearchInput.ts — encapsulates all UI behavior
    export function useSearchInput<T>({ items, filterFn, onSelect, debounceMs = 300 }) {
      // All search, selection, and keyboard event state resides here
      return { query, setQuery, results, isOpen, activeIndex, listRef, handleKeyDown };
    }
    ```
    ```tsx
    // Component — call hook, attach returned handlers to JSX
    const { query, setQuery, results, isOpen, activeIndex, listRef, handleKeyDown } = useSearchInput({
      items,
      filterFn: (item, q) => item.name.toLowerCase().includes(q.toLowerCase()),
      onSelect: (item) => setQuery(item.name),
    });
    ```

    > **When to extract a custom hook?**
    > *   ✅ **Mandatory:** The same UI behavior/logic is repeated in ≥ 2 components.
    > *   ⚠️ **Consider:** Component size exceeds 150 lines, or has many interleaved reactive variables.
    > *   🔄 **Rule of thumb:** Prioritize splitting monolithic components into smaller components before writing custom hooks.

### 4. Global Client State Migration (React Context ➜ Zustand)
Ensure client state is globally accessible and performant.

*   **❌ Legacy Pattern (Context Overuse):** Context + Provider hell causing frequent full-tree re-renders and blocking state access outside of React lifecycles.
*   **✅ Refactored Pattern (Zustand store + persist middleware):**
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
    // Component — selector only triggers re-renders when the specific field changes
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    ```
    ```ts
    // Outside React context (e.g., Axios / Fetch Interceptors)
    const token = useAuthStore.getState().token;
    ```

### 5. Architectural Boundaries: React Query vs Zustand
Clearly separate Server State (caching) from Client State (UI control).
Rule: **"Does this data originate from the server?"**

| Criterion | React Query (Server State) | Zustand (Client State) |
|:---|:---|:---|
| **Origin** | Server / API database | Created locally by Client |
| **Ownership** | Server (client only caches a snapshot) | Client is the absolute source of truth |
| **Sync** | Background refetch, stale-while-revalidate | No sync needed |
| **Persistence** | Automatic cache (staleTime, gcTime) | Zustand persist middleware (localStorage) |

**Mapping Complex Scenarios:**
*   *Shopping cart before checkout:* **Zustand** (Client-created, offline data).
*   *Shopping cart after checkout:* **React Query** (Committed on server, needs querying).
*   *User profile from API:* **React Query** (Server data, requires caching).
*   *Theme preferences:* **Zustand** (User interface settings).
*   *Unsubmitted form drafts:* **useState / Zustand** (Client-created input).

### 6. Component Responsibility Checklist

| Tier / Directory | Allowed Responsibilities | Prohibited Actions |
|:---|:---|:---|
| **`utils/` (Pure)** | Calculations, formatting, mapping, transforms | React Hooks, API calls, side-effects |
| **React Query** | Fetching, caching, caching mutations, syncing | Global UI state management (theme, menus) |
| **Zustand** | UI state, dark mode, auth tokens, modals | Caching direct server API responses |
| **Custom Hooks** | Reactive React state composition, debounces | Pure calculations (move to `utils/`) |
| **`services/`** | Raw HTTP requests (axios instances, clients) | Local state storage, cache invalidation |

*   **Belongs inside the Component:** JSX layouting, conditional elements, hook usage (`useResourceList`), event handler delegation.
*   **Must be Extracted:** Reusable calculations > 10 lines (`utils/`), directly inlined fetch requests (`services/`), interleaved state machines (custom hooks), global state shared across features (`stores/`).

### 7. File Naming Conventions
*Prefer grouping files by features (e.g. `src/features/auth/*`) rather than placing them in separate global technical layer folders.*

*   **Hooks:** `use[Name].ts` (e.g., `useResource.ts`)
*   **Services:** `[name].service.ts` (e.g., `auth.service.ts`)
*   **Stores:** `[name].store.ts` (e.g., `auth.store.ts`)
*   **Utils:** `[name].utils.ts` (e.g., `math.utils.ts`)
*   **Types:** `[name].types.ts` (e.g., `auth.types.ts`)
*   **Components:** `[PascalCase].tsx` (e.g., `ResourceList.tsx`)

### 8. Error Handling Strategy
1.  **Service Layer:** Always throw clean, structured Error objects rather than string catch statements.
2.  **Hook Layer:** Use React Query's built-in error states. Orchestrate error-based UI side-effects (e.g. Toast alerts) via the mutation `onError` callbacks.
3.  **UI Layer:** Render local error feedback cards nearby the failed component rather than crash-blocking the entire viewport. Use React Error Boundaries for unhandled UI exceptions.

---

## ❌ Anti-Patterns

*   ❌ **Fat Component:** A single file performing calculations, API fetching, and DOM rendering simultaneously. Separated logic layers must be enforced.
*   ❌ **Business Logic in Hooks:** Placing pure validation, mapping, or transformations inside `useEffect` or React Query `select` callbacks. This must reside in `utils/` using the **Mapper Pattern** to format data.
*   ❌ **Prop Drilling:** Passing props down ≥ 3 nested levels. Subcomponents should query data directly using React Query hooks or Zustand selectors.
*   ❌ **Mixed State (Duplication):** Saving a copy of React Query's server cache inside a Zustand store. This causes sync bugs and memory leaks. Keep them separate.

---

## ✅ Quality Audit Checklist

The agent must perform this self-audit before finalizing React refactoring tasks:

*   [ ] **Pure Utils:** All functions under `utils/` are completely free of React hooks, JSX, or state imports, allowing easy unit testing.
*   [ ] **Server State separation:** Checked that server data is fetched and cached exclusively via React Query hooks; no server data is duplicated into Zustand stores.
*   [ ] **Component word count:** Monolithic components are split into subcomponents of under 150 lines.
*   [ ] **Custom Hook boundaries:** Any custom hook created does not contain pure data transformations that could be decoupled into a pure util function.
*   [ ] **Strict Typing:** All DTOs, parameters, and store actions are strictly typed with TypeScript interface definitions; no `any` types remain.
