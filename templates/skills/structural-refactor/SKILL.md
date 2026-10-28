---
name: structural-refactor
description: >-
  Restructures code without changing behaviour: moving call sites onto
  another library or helper, merging look-alike code. Use when moving code
  onto a new client, helper, or folder, deduplicating code, or refactoring
  across files. Not for splitting one React component (use
  react-refactor-patterns).
---

# Structural Refactor

A structural change is correct when every caller in scope uses the new
structure, behaviour is unchanged, and the report says exactly what is left.
Agents tend to miss the last two: they upgrade behaviour on the way ("while
moving it, switch to React Query"), and they stop without saying which
callers still use the old path. Where `AGENTS.md` or `CLAUDE.md` set rules
for scope, commits, or checks, follow them.

## 1. Before changing code

1. **Scope.** The scope is what the user asked for: "the Orders page" is one
   file, "everything" is every caller. Do not widen it; report the rest.
2. **Inventory.** Count the callers with a command the reader can rerun, and
   keep it for the report:
   `grep -rlE "from ['\"].*api/legacy['\"]" src | wc -l`
3. **Lock behaviour.** Use the typecheck and existing tests that exercise the
   code being moved. If the project has no test runner, do not add one
   unasked; plan a manual or browser check instead and say so.

## 2. While changing code

**Change structure only.** During a move or migration, what users see and
when data loads stay the same. If an earlier commit already migrated other
callers (find it with `git log -S '<new import path>'`), copy what it did,
including a library it adopted, and list each behaviour difference that
brings: caching, refetching, error UI. Otherwise keep the data flow: a
`useEffect` fetch stays a `useEffect` fetch, and adopting a query library is
a follow-up. If the new structure cannot behave the same (a different error
type, headers, or response envelope), say so in the report. If you commit, a
behaviour fix found on the way gets its own commit.

**Read history before merging look-alike code.** Run
`git log --format='%h %ad %s' --date=short -- <file>` for each copy. Copies
that changed for different reasons (a marketing rounding rule in one, a tax
rule in the other) keep those rules in their own callers; extract only the
mechanics they share, with no option or flag that exists for one caller.
When nothing differs, merge them into one function and update every caller.

**Finish within scope.** When the last caller in scope moves, delete the old
module in the same change. No re-export from the old path, no forwarding
wrapper, no `legacy/` folder inside one app; a published package with outside
consumers is the only exception. If callers outside the scope remain, keep
the old module and list them.

**Let tools do mechanical edits.** For renames and moves across many files,
change the path or signature and fix what the typecheck reports, or use the
editor's rename or a codemod (`ts-morph`, `jscodeshift`), rather than editing
call sites by hand.

Read [references/frontend-targets.md](references/frontend-targets.md) when
choosing a target structure for a React or Next.js app: layers, boundaries,
state ownership, shared components, and dumping-ground folders.

## Done when

The report has, in order:

1. **Scope** and what changed.
2. **Inventory:** callers before and after, with the command. After is 0
   within the scope; callers outside it are listed.
3. **Behaviour:** "unchanged" and how that was checked, or each difference.
4. **Follow-ups:** behaviour upgrades you did not make, and callers outside
   the scope.
5. **Checks run:** the project's own checks that apply.
