---
name: ambiguity-decisions
description: >-
  Settles details a short request leaves open: picks the codebase's current
  pattern and reports each choice as found, assumed, or for the user. Use
  when about to build a feature, business rule, or UI change from a short
  request. Not for moving or migrating existing code (use structural-refactor).
---

# Ambiguity Decisions

A short request leaves details open. Agents then ask what the repository
already answers, decide silently what only the user can decide, or build
both options to avoid deciding. Settle each open detail by looking it up,
deciding it, or handing it to the user, and make every one visible in the
report. Where `AGENTS.md` or `CLAUDE.md` say when to ask or stop, follow
them; this skill fills in where they are silent.

## 1. List the open details

Before writing code, list what the request does not say. Walk each business
rule and each changed screen through four edges:

- **Bounds:** zero, negative, over a limit (a fixed discount above the total).
- **Precision:** rounding, currency, units, time zone.
- **Missing or failed data:** `null`, an absent related record, a request
  that fails or never returns.
- **Display:** the new value only, old and new, or a label; for whom.

Add the "how" details: which pattern to follow, where code goes, how far the
change reaches.

## 2. Look before deciding

Answer what you can from the repository, in this order: the user's words;
`AGENTS.md`, `CLAUDE.md`, ADRs, README; lint rules and `@deprecated` tags;
then the **current pattern, not the nearest file**. The file next to the
change may be the legacy version. When the code does one thing two ways,
compare recent history for both, including any wrapper module:

```bash
git log --since=12.months -p -- src | grep -cE "^\+.*from ['\"].*(axios|api/legacy)['\"]"
git log --since=12.months -p -- src | grep -cE "^-.*from ['\"].*(axios|api/legacy)['\"]"
```

The pattern recent commits add is current; one they remove is on its way
out, even if it still has more call sites. If both counts are zero, widen the
window or read the most recently changed file of each pattern. This
decides how new code is written; existing code you only move keeps its
behaviour (see `structural-refactor`).

## 3. Route each detail

| Detail | Action |
|---|---|
| Answered in step 2 | Follow it; report as `Found` |
| Reversible, and a wrong guess costs one follow-up edit | Decide; report as `Assumed` |
| Money: prices, totals, discounts, fees, quotas | Build your recommendation; report under `Needs your decision` |
| One-way door, destructive change, security or permission rule | Ask before building it. If no answer can come before you finish, build the rest and report it under `Needs your decision` as not built |
| Work beyond the request | Do what was asked; list the rest |

One-way doors: renaming or removing an existing route, query-string key,
storage key, analytics event, API field, or shared component prop; choosing
the state or data-fetching library; auth token storage; anything published
as a package. Adding a new key or route is reversible.

Ask in one message, at most three questions, each with the options, their
effect, and your recommendation first. Use the harness's question tool when
one exists.

Build one option. These count as not deciding: a `mode` prop or config flag
that keeps both options, a generic abstraction for both futures, a `TODO`,
and a fallback such as `?? 0` or an empty `catch` that hides the case you
were unsure about.

## 4. Report

Start the final report with `Needs your decision` when it has entries, and
end it with `Decisions`:

```text
Needs your decision
- <question> — built: <option, or "not built"> — other option: <option and its effect>

Decisions
- Found: <choice> — <file, ADR, or commit>
- Assumed: <choice> — <reason>
- Edges: bounds — <case: what the code does>; precision — <…>; missing or failed data — <…>; display — <…>
```

## Done when

- Every detail from step 1 appears in the report, and the `Edges` line
  covers all four edges, with `n/a` and a reason where one does not apply.
- One option was built for each decision.
- Nothing from the one-way-door row was built without the user's answer.
