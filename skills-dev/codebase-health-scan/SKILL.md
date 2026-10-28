---
name: codebase-health-scan
description: >-
  Scans a JS/TS frontend repo and its git history for decay one file never
  shows: hotspots, change coupling, duplicate blocks, import cycles, mixed
  libraries, and boundary leaks. Use when choosing what to refactor, auditing
  an aging codebase, or before agents work at scale on it.
---

# Codebase Health Scan

Agents read a few files at a time, so they cannot see what grows across a
codebase over months: the file every change touches, two folders that always
change together, the third copy of a block, the second data-fetching
library. This skill measures those, then turns the numbers into a short,
ranked list of refactors worth doing.

## 1. Run the scan

```bash
python3 .agents/skills/codebase-health-scan/scripts/scan.py <repo-root>
```

Run it; do not read the source. Options (`--help` for all): `--src` for the
source folder, `--since '2 years ago'` when the repo was quiet recently (the
history sections need commits in the window), `--only cycles,dupes`, `--top
20`, and `--features-dir` when features live outside `src/features`. In a
monorepo, pass the app folder (`apps/web`) as the root.

Exit code 1 means at least one finding was flagged (lines marked with an
exclamation mark).
A flag is a prompt to look, not a verdict, and a clean section is not proof:
the scan reads imports with regexes after removing comments and strings, and
resolves tsconfig `paths` (with `extends` and `references`) plus the `@/` and
`~/` aliases, but not other bundler aliases.

## 2. Confirm before reporting

Open every flagged item you intend to report and check it is real. Common
false positives:

| Section | Not a problem when |
|---|---|
| hotspots | The file is a route table, constants, or generated config that is meant to change often |
| coupling | The pair is a component and its styles, or an API module and its types |
| dupes | Generated code, migrations, fixtures, or two blocks that serve features with different rules (see `structural-refactor` on when to merge) |
| boundaries | The project has its own layering; the scan assumes pages > components > hooks, stores, services > utils, types |
| props | A data type named `...Props` rather than component props |
| inventory | One library is the migration target and the other is visibly being removed (check `git log -S`) |
| dumps | The folder is a deliberate shared kernel with an owner and an index |

## 3. Rank

Rank what survived by **cost of leaving it × how often it is touched**:

1. **Hotspots that also appear in another section** (a hotspot with
   duplicates, a cycle, or escape hatches). Change frequency multiplies the
   cost of every other problem.
2. **Two or more libraries for one concern** that new code still adds to.
   Every agent run copies whichever is nearer, so this spreads fastest.
3. **Import cycles and boundary leaks** involving shared code or stores:
   they block deleting or moving anything.
4. **Coupled pairs across folders**: usually a missing module or duplicated
   logic; read the commits they share to see which.
5. Duplicates, wide props, dumping grounds, and escape hatches outside
   hotspots: list them, low priority.

Files nobody has touched for a year rank last whatever their score; ugly
stable code costs little.

## 4. Report

One table, highest rank first, at most ten rows:

```text
| # | Finding | Evidence | Suggested change | Size |
| 1 | 3 HTTP styles; axios still added in 2025 | inventory: fetch() 14, axios 9, ky 2; git log -S | One apiClient + no-restricted-imports (structural-refactor) | M |
```

- **Evidence** quotes the scan line or a command the reader can rerun.
- **Suggested change** names the target structure. For React and Next.js
  apps, use the targets in the `structural-refactor` skill's
  `references/frontend-targets.md`.
- **Size**: S (under an hour), M (a day), L (needs a plan and several PRs).

Then propose the lint or CI rule that would stop each top finding from
growing back (`no-restricted-imports`, `import/no-cycle`, boundary zones, a
duplicate-code check), and say whether it needs a new dependency or only
config. A rule keeps the next agent from copying the problem; a refactor
alone does not. Propose it; adding it is the user's call.

Do not start refactoring from the scan. Hand the chosen rows to
`structural-refactor`, or ask the user which ones to do.

## Done when

- The scan ran, and the command and `--since` window are in the report.
- Every reported row was opened and confirmed; dismissed flags are listed
  in one line each with the reason.
- The report ranks findings, gives evidence, and proposes a preventive rule
  for each of the top three.
