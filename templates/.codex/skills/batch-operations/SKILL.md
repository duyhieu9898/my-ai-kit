---
name: batch-operations
description: >-
  Use when changing multiple files with the same pattern, renaming across a codebase,
  adding imports or headers to many files, or performing bulk migrations.
  Applies operations across multiple files simultaneously using pattern-based bulk modifications and search-and-replace.
  NOT for single-file edits or unique changes per file.
allowed-tools: Read Write Edit Grep Glob Bash
---

# Batch Operations — Multi-File Changes


> Strategic guidelines and procedures for the Batch Operations capability in this repository.

## 📑 Content Map

| File / Resource | Description | When to Read |
|:---|:---|:---|
| `SKILL.md` | Core guidelines, procedures, and best practices | Active throughout task execution |
| `agents/openai.yaml` | Codex UI and implicit invocation policy configuration | During skill indexing or UI setup |

## 🔗 Related Skills

| Skill | Relationship | When to Collaborate |
|:---|:---|:---|
| `clean-code` | Quality Foundation | To ensure strict clean code, typing, and safety standards |
| `simplify-code` | Refactor Companion | When dealing with redundant loops, nested conditions, or long blocks |




## When to Use

✅ **Good for:**
- Renaming a function/component across all files that use it
- Adding an import to every file in a directory
- Updating version numbers across package files
- Applying the same code pattern to multiple similar files
- Migrating from one API to another across the codebase
- Adding/removing a field from all similar data structures

❌ **Not for:**
- Single-file edits (use direct editing)
- Unique changes per file (handle individually)
- Changes that need per-file judgment (use an agent per domain)

---

## Batch Operation Protocol

### Step 1: Define the Pattern
```
What:     [exact text/pattern to find]
Replace:  [exact replacement text]
Scope:    [file glob pattern, e.g., "src/**/*.tsx"]
Exclude:  [files to skip, e.g., "**/*.test.tsx"]
```

### Step 2: Preview Before Executing
```bash
# Find all affected files FIRST
grep -rl "oldPattern" src/ --include="*.ts"

# Count matches
grep -rc "oldPattern" src/ --include="*.ts" | grep -v ":0$"

# Show context for each match
grep -rn "oldPattern" src/ --include="*.ts"
```

> 🔴 **NEVER batch-modify without previewing first.** Show the user what will change.

### Step 3: Execute the Batch

For text replacements:
```bash
# On Linux/macOS
find src -name "*.ts" -exec sed -i 's/oldPattern/newPattern/g' {} +

# On Windows (PowerShell)
Get-ChildItem -Path src -Recurse -Filter *.ts |
  ForEach-Object { (Get-Content $_) -replace 'oldPattern','newPattern' | Set-Content $_ }
```

For structural changes (adding imports, wrapping code):
- Use the Edit tool on each file
- Process files in a consistent order (alphabetical or by dependency)

### Step 4: Verify the Batch
```bash
# Confirm no missed instances
grep -rl "oldPattern" src/ --include="*.ts"
# Should return empty

# Confirm replacements are correct
grep -rn "newPattern" src/ --include="*.ts" | head -5

# Run tests to catch breakage
npm run test
npm run build
```

---

## Common Batch Patterns

| Operation | Command Pattern |
|---|---|
| **Rename import** | Find all `import { X }` → replace with `import { Y }` |
| **Update version** | Find `"version": "1.0"` → replace across all package.json |
| **Add export** | Append `export { X }` to all index files |
| **Remove deprecated** | Find `deprecatedFn()` → replace with `newFn()` |
| **Add header** | Prepend license header to all source files |
| **Type migration** | Find `interface X` → replace with `type X =` |

---

## Safety Rules

1. **Preview first** — always show affected files before modifying
2. **Git safety** — ensure clean working directory (`git stash` or commit first)
3. **Exclude tests** — often tests need different treatment than source
4. **Verify after** — run build + tests after every batch operation
5. **Report changes** — list every file modified with change summary
