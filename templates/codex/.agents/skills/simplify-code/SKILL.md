---
name: simplify-code
description: >-
  Use when codebase suffers from over-abstraction, excessive nesting, or unnecessary cognitive load.
  Code complexity reduction patterns (early returns, flattening, abstraction pruning).
  NOT for new features.
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Simplify Code — Reduce Unnecessary Complexity

> The best code is the code you don't have to write. The second best is the code anyone can read.

---

## 📑 Content Map

| File | Description | When to Read |
|:---|:---|:---|
| _No supplementary files_ | Main code simplification procedures are in this file | Use this file by default |

---

## 🔗 Related Skills

| Need | Skill |
|:---|:---|
| Code refactoring design patterns | [`react-refactor-patterns`](../react-refactor-patterns/SKILL.md) |
| Structuring high-speed frontend designs | [`frontend-design`](../frontend-design/SKILL.md) |
| Clean code standards and styles | [`clean-code`](../clean-code/SKILL.md) |

---

## 🛠️ Instructions / Procedures

When tasked with pruning over-abstractions, excessive nesting, or redundant parameters, strictly follow this step-by-step procedure:

### Step 1: Identify Complexity Metrics
1. Profile function complexity based on standard limits: Nesting target ≤3, Parameters target ≤4, Lines per function ≤30, Dead code target = 0.
2. Note any wrapper delegations, single-implementation interfaces, or strategy smells.

### Step 2: Verify Behavioral Intention
1. Validate original design intention before refactoring.
2. Verify that complete unit/integration tests cover the paths to avoid regression errors.

### Step 3: Simplify Incrementally
1. Remove dead variables, unreachable branches, and commented-out code first.
2. Flatten nesting levels utilizing early returns.
3. Inline trivial single-use wrappers, constructors, or config objects.

### Step 4: Verify Behavior & Compile
1. Run existing test runners (`npm run test` or similar) to ensure all tests pass.
2. Run build step scripts (`npm run build` or similar) to confirm clean builds.

### Step 5: Quality Audit Checklist
1. Review overall changes.
2. Confirm compliance against the **Quality Audit Checklist** before concluding.

---

## Core Principle

```
Complexity is a cost. Every abstraction, every indirection, every clever pattern
adds cognitive load. Simplify ruthlessly unless complexity serves a clear purpose.
```

---

## Simplification Checklist

### 1. Unnecessary Abstractions
| Smell | Simplification |
|---|---|
| Wrapper class that just delegates | Remove wrapper, use the inner class directly |
| Factory that creates only one type | Replace with direct constructor |
| Strategy pattern with one strategy | Replace with simple function |
| Interface with one implementation | Remove interface, use the class |
| Abstract class with one child | Merge into the child class |
| Config object for 2 values | Use function parameters |

### 2. Dead Code
| Smell | Action |
|---|---|
| Unused imports | Remove |
| Unreachable branches | Remove (check tests first) |
| Commented-out code | Remove (it's in git history) |
| Unused variables/functions | Remove |
| TODO comments older than 6 months | Remove or create issue |
| Feature flags for launched features | Remove flag, keep the code |

### 3. Deep Nesting
```javascript
// ❌ Before: 4 levels deep
function process(data) {
  if (data) {
    if (data.items) {
      for (const item of data.items) {
        if (item.active) {
          doSomething(item)
        }
      }
    }
  }
}

// ✅ After: Early returns + filter
function process(data) {
  if (!data?.items) return

  data.items
    .filter(item => item.active)
    .forEach(doSomething)
}
```

### 4. Over-Parameterized Functions
```typescript
// ❌ Before: 8 parameters
function createUser(name, email, age, role, dept, active, verified, avatar) { }

// ✅ After: Object parameter
function createUser(opts: CreateUserOpts) { }
```

### 5. Premature Optimization
| Smell | Simplification |
|---|---|
| Custom cache for <100 items | Remove cache, measure first |
| Memoization on cheap functions | Remove memo |
| Lazy loading for small modules | Use direct import |
| Complex state machine for 3 states | Use simple if/else or switch |

---

## When NOT to Simplify

| Situation | Why Keep Complexity |
|---|---|
| Performance-critical hot path | Optimization may look complex but is necessary |
| Required by framework/library | External constraints |
| Explicitly requested pattern | User chose this architecture |
| Will need extension soon | Abstraction prepares for known growth |

> **Ask first:** "This pattern seems over-engineered. Should I simplify it, or is there a reason for the abstraction?"

---

## ❌ Anti-Patterns

- Removing abstractions that exist for a confirmed framework, performance, or extension requirement.
- Simplifying behavior without first confirming test coverage or expected outcomes.
- Replacing clear explicit code with clever one-liners that reduce readability.
- Combining unrelated responsibilities just to reduce file count.

---

## ✅ Quality Audit Checklist

Before concluding a code simplification, flattening, or abstraction pruning task, verify compliance with the following:

- [ ] **Nesting Flattened**: High levels of nested conditional branches are refactored using early returns.
- [ ] **Dead Code Pruned**: Zero unused imports, variables, commented-out scripts, or old TODO tags remain in the edited scope.
- [ ] **Trivial Abstractions Inlined**: Single-use interfaces, strategy abstractions, or empty wrapper classes are pruned.
- [ ] **Signature Parameters Compacted**: Multi-parameter functions are combined using clean object parameters.
- [ ] **Unit Tests Passing**: Existing behavior is verified preserved by running the repository's test runner commands.
- [ ] **Clean Compilation Audited**: Code compiles and builds without any errors or structural lint issues.
