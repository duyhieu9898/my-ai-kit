# Evals: refactor and decision cluster

Behaviour and trigger tests for `ambiguity-decisions`, `structural-refactor`,
and `codebase-health-scan`. Everything runs on synthetic fixtures, so no real
project code is sent to a model.

## Files

| File | Purpose |
|---|---|
| `build_fixtures.sh <dir>` | Builds `fixture` (shop admin halfway from axios to `apiGet` + TanStack Query) and `fixture2` (plus look-alike formatters whose differences are explained only in commit messages) |
| `prep.py` | Copies a fixture into a run folder, optionally installs the dev skills, writes the prompt |
| `run.py` | Runs every prepared folder with `codex exec`, a few at a time |
| `queries.json` | 24 trigger queries: 5 per skill plus near-misses owned by sibling skills |
| `trigger.py` | Runs the queries in Codex or Claude Code and records which skills load; stops a run at its first edit |
| `summarize.py` | Pass/fail table per harness (loads in at least 2 of 3 runs when expected, at most 1 of 3 otherwise) |

## Run

```bash
E=skills-dev/evals; W=/tmp/skill-evals
bash $E/build_fixtures.sh $W
# behaviour scenario, with and without skills
python3 $E/prep.py $W/runs B-1 $W/fixture "<prompt>" --skills ambiguity-decisions,structural-refactor,codebase-health-scan
python3 $E/run.py $W/runs
# trigger test: a scratch copy of the fixture with the kit installed plus the dev skills
# core now ships ambiguity-decisions and structural-refactor
cp -r $W/fixture $W/scratch && node bin/index.js install --path $W/scratch --source . --link --profile main,core
for s in codebase-health-scan; do
  cp -r skills-dev/$s $W/scratch/.agents/skills/ && ln -s ../../.agents/skills/$s $W/scratch/.claude/skills/$s
done
python3 $E/trigger.py codex --scratch $W/scratch --out $W/results --queries $E/queries.json --reps 3
python3 $E/trigger.py claude --scratch $W/scratch --out $W/results --queries $E/queries.json --reps 1
python3 $E/summarize.py $W/results $E/queries.json
```

## Behaviour scenarios

| Id | Fixture | Prompt | Pass when |
|---|---|---|---|
| A | fixture | Add a status filter to the orders page | Uses `apiGet` + TanStack Query and the URL, records decisions, asks nothing the repo answers |
| B | fixture | Show each order's total after the customer's discount | Current pattern, not the legacy file next door; money rules under `Needs your decision` |
| T2 | fixture | Show `Loading…` instead of the dash while revenue loads | `Edges` states what a failed request shows |
| S1 | fixture2 | Move the Orders page onto the shared API client | Only Orders changes; Reports listed as a remaining legacy caller; behaviour kept or each difference listed |
| S2 | fixture2 | Deduplicate formatOrderTotal and formatInvoiceAmount | Reads history; rounding stays with orders, exact amounts with invoices; behaviour unchanged |
| S4 | fixture2 | Move the API client to `src/lib/http/client.ts` | Old path deleted, no re-export, inventory reported |
| CH | fixture2 | Which parts of this codebase should we refactor first? | Runs the scan, confirms, ranks, proposes a rule, edits nothing |

## Results, 2026-10-15

Codex CLI 0.155 with `gpt-5.6-terra`; Claude Code 2.1.300 with Sonnet 5.5,
superpowers, and the kit's `web,testing,core` profiles.

| Scenario | Without the skills | Final skills |
|---|---|---|
| B | Copied the legacy axios pattern; decided money rules silently (1/1) | Current pattern 4/4; money rules under `Needs your decision` 4/4 |
| T2 | (earlier skill version) failed request not mentioned 1/1 | Failed request stated in `Edges` 2/2 |
| A | Already correct | Correct, no unneeded question 1/1 |
| S1 | Remaining caller reported 0/2; switched to TanStack Query 1/2 without saying so | Remaining caller reported 2/2; one kept behaviour, one followed the earlier migration commit and listed the differences |
| S2 | History read 0/2; order rounding moved into the shared helper as an option 2/2 | History read 2/2; rounding kept with orders 2/2 |
| S4 | Already clean 2/2 | Clean 2/2, inventory with command 2/2 |
| CH | — | 1 valid run: followed the procedure, no edits (the second run hit the Codex usage limit) |

Trigger test:

- Claude Code, 1 run per query: 24/24 pass.
- Codex, 1 valid run per query for Q01–Q17 and Q19 (the account hit its
  usage limit; Q18 and Q20–Q24 have no Codex data): every expected skill
  loaded, but `ambiguity-decisions` also loaded on 5 of the 13 queries that
  belong elsewhere (rename, colour change, component split, re-render fix,
  the Orders migration), always next to the right skill.

## Open

- Finish the Codex trigger runs (3 per query) once the quota resets, then
  narrow the `ambiguity-decisions` description if it still loads on
  near-misses.
- Repeat B, S1, and S2 a few more times; most cells above are 2 runs.
- `scan.py` regression tests: `python3 -B -m unittest discover -s skills-dev/codebase-health-scan/tests`.
