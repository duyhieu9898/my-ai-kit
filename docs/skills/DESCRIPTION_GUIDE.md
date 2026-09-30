# Skill Description Guide

How to write, audit, and test the `description` field of a kit skill.

Use this guide whenever a skill is created, merged, rewritten, or audited. It
targets **Claude Code and Codex**. Antigravity reads the same
`.agents/skills/<name>/SKILL.md` and only needs `name` and `description`, so a
description that works for Claude Code and Codex works there too.

## 1. Why the description decides everything

An agent does not see a skill's body until it has chosen the skill. At session
start it sees a listing of every installed skill, and for each one the listing
holds only the `name`, the `description`, and (in Codex) the file path. The
agent then decides to load a skill purely from that listing.

| | Claude Code | Codex |
|---|---|---|
| What is listed | `name`, `description` (+ `when_to_use`) | `name`, `description`, path |
| Listing budget | About 1% of the context window, shared with every plugin and user skill | 2% of the context window, or 8,000 chars when the window size is unknown |
| When over budget | Descriptions of the least-used skills are dropped first; names are kept | Descriptions are shortened first; skills may then be omitted with a warning |
| Per-skill cap | `description` + `when_to_use` cut at 1,536 chars | None at runtime; the spec and Codex's validator use 1,024 |
| Formatting | Rendered as given | Whitespace collapsed to one line |
| After selection | Body loads and stays for the session; first 5,000 tokens survive compaction | Full `SKILL.md` is read to the end |

Sources: [Claude Code skills](https://code.claude.com/docs/en/skills),
[Codex skills](https://learn.chatgpt.com/docs/build-skills),
`codex-rs/skills/src/parser.rs`,
[Agent Skills spec](https://agentskills.io/specification).

Three consequences:

1. **The budget is shared and small.** On 2026-09-30 the 43 kit skills had
   11,678 chars of descriptions in total (average 272, maximum 432). That
   already exceeds Codex's 8,000-char fallback before any other skill is
   installed. In Claude Code the kit also competes with plugins such as
   superpowers.
2. **The end of a description is the part that gets cut.** Whatever decides
   selection must come first.
3. **A description is read in comparison with its siblings.** It only needs
   to separate the skill from the other skills and from what the model does
   unaided, not to explain the domain.

Agents also skip skills for tasks they can do alone. A one-step request
("rename this variable") rarely triggers any skill, however it is worded.
Descriptions matter most for tasks with a procedure, a convention, or a
bundled script the model would not otherwise know.

## 2. Rules

### R1. Length: 150–300 chars; 400 is the kit's hard limit

The spec allows 1,024, but the kit caps descriptions at 400 because of the
shared budget. A daily profile of about 17 skills at 300 chars each uses about
5,100 chars and leaves room for other skills. Longer text is almost always a
capability list or a workflow summary, which R4 and R5 forbid anyway.

### R2. Shape: capability sentence, then trigger sentence, then optional boundary

```text
<What the skill does, third person, one sentence>. Use when <the user
intents or situations that should load it>. [Not for <near-miss> (use
<sibling>).]
```

- The first sentence names the capability in words a user would use. It is
  third person because the description is injected into the system prompt.
- The second sentence starts with `Use when` and lists **situations or
  actions**, not topics: "fixing a flaky E2E run", not "testing, playwright,
  e2e".
- The third sentence exists only when R6 requires it.

This satisfies both Anthropic's guidance (say what it does and when to use it)
and Codex's (concise, discriminating, exclusions only to prevent misrouting).

### R3. Front-load the discriminating words

The words that separate this skill from its siblings belong in the first
sentence. If a Codex truncation left only the first 120 chars, the skill
should still be recognisable.

### R4. Triggers are situations, not keyword lists

Keyword lists ("Triggers on component, react, vue, ui, ux, css") match almost
every request in the domain, so the broadest skill wins over the right one.
Describe the situation the user is in. Codex's current guidance says the same:
use concrete action triggers ("adding or changing a migration"), not topic
lists ("database, queries, models").

Name an implicit case only when users often ask for it without naming the
domain, for example "hardcoded UI strings" for i18n.

### R5. Do not summarise the workflow

A description that lists the steps ("reproduce, isolate, fix, verify") lets
the agent follow the summary without reading the body. Name the capability,
not the procedure.

### R6. Add `Not for …` only against a real near-miss, and name the sibling

Add a boundary only when a specific sibling or common request is likely to be
confused with this skill. Always name where that work goes: `Not for unit
tests (use testing-patterns).` A boundary without a destination ("NOT for
basic HTML templates") costs budget and helps nothing.

At most one boundary sentence. If a skill needs three exclusions, its scope is
wrong; fix the scope instead.

### R7. No persona, no marketing, no shouting

Never write "Expert in…", "Senior … Architect", "Elite…", "comprehensive",
"best practices", or all-caps `ONLY`/`NEVER`/`MUST`. They add no matching
signal and read as noise in a shared listing.

### R8. Plain text only

No Markdown, lists, links, or line-dependent formatting: Codex collapses the
description to one line. Use a YAML folded scalar (`>-`) whenever the text
contains `:`.

### R9. Stay distinct from superpowers

In Claude Code the user runs superpowers alongside the kit. For a kit skill
that shares a role with a superpowers skill (debugging, plans, TDD,
verification, brainstorming):

- never reuse a superpowers skill name;
- make the kit description narrower and concrete about what is kit-specific
  (a bundled script, a repo path convention, a Harness check), so that the
  two descriptions do not read as synonyms.

### R10. The description is the only trigger

Do not rely on a body section called "When to use", or on `when_to_use`
(Claude Code only), to get a skill selected. The body is read only after
selection.

## 3. Examples from this repo

### Keyword list and persona → situation

Before (`frontend-specialist`, 353 chars):

```yaml
description: >-
  Use when working on UI components, styling, state management, responsive design, or frontend architecture.
  Senior Frontend Architect who builds maintainable React/Next.js systems with performance-first mindset.
  Triggers on component, react, vue, ui, ux, css, tailwind, responsive.
  NOT for backend-only, database-only, or non-visual infrastructure tasks.
```

Problems: its topic list matches at least five siblings (R4); it contains
persona text (R7); the boundary names no destination (R6).

After (as the merged `frontend-design`, 273 chars):

```yaml
description: >-
  Restyles and themes UI built on a component library such as shadcn/ui, MUI,
  or Ant through design tokens. Use when changing colors, typography, spacing,
  radius, dark mode, or the overall look of pages or components. Not for
  accessibility audits (use web-design-guidelines).
```

### Persona inside the description → capability

Before (`performance-optimizer`):

```yaml
description: >-
  Use for improving speed, reducing bundle size, and optimizing runtime performance.
  Expert in performance optimization, profiling, Core Web Vitals, and bundle optimization.
  NOT for feature development unrelated to measurable performance bottlenecks.
```

After (as the merged `performance-profiling`):

```yaml
description: >-
  Measures and fixes web performance problems with Lighthouse and bundle
  analysis. Use when a page loads or responds slowly, Core Web Vitals regress,
  or the JS bundle grows. Not for an error or crash without slowness (use
  debugger).
```

### Over-broad trigger word → narrow situation

Before (`debugger`): "Triggers on bug, error, crash, not working, broken,
investigate, fix." The word "fix" matches almost every coding request.

After:

```yaml
description: >-
  Finds the root cause of a concrete failure such as an error message, stack
  trace, failing test, or wrong output before a fix is written. Use when
  something that should work does not, especially if it is intermittent or
  environment-specific.
```

### Already good: keep the shape

`devops-engineer` (432 chars) has the right shape: concrete situations and a
precise boundary against routine Git work. Only its length needs trimming for
R1. The boundary is the valuable part, so keep it:

```yaml
description: >-
  Operates deployments, CI/CD pipelines, servers, and production incidents,
  including rollback. Use when releasing to staging or production, changing
  Docker, PM2, or Nginx setup, or recovering from a failed deployment. Not for
  routine git commit, branch, pull, or push work that deploys nothing.
```

## 4. Audit checklist

Score every description when a skill is created, merged, or rewritten. The
score uses the same 1–5 scale as the 2026-09-30 audit.

| Check | Rule | Automatable |
|---|---|---|
| 1–400 chars (target 150–300) | R1 | Yes |
| Contains `Use when` | R2 | Yes |
| First sentence is a third-person capability, not "Use when/for" or a persona | R2, R7 | Partly: reject leading `Use`, `Expert`, `You are`, `Senior` |
| No `Triggers on` / comma-separated topic list | R4 | Partly: flag `Triggers on`, and flag 5 or more single-word items in a row |
| No step list or workflow summary | R5 | No |
| Every `Not for` names an existing sibling in `(use <name>)` | R6 | Yes |
| At most one boundary sentence | R6 | Yes |
| No persona or marketing words, no all-caps emphasis | R7 | Yes (word list) |
| Folded scalar when the text contains `:` | R8 | Yes |
| Not a synonym of a superpowers skill; no reused name | R9 | Name: yes. Meaning: no |
| Reads as distinct from each sibling in its cluster | R3, R4 | No: compare side by side |

Scores:

- **5**: passes every check; a near-miss sibling is named where one exists.
- **4**: one soft miss, such as 300–400 chars or a slightly generic trigger.
- **3**: triggers are topic-like or the boundary has no destination.
- **2**: keyword list, persona, or overlaps a sibling so that the wrong skill
  would often win.
- **1**: missing, vague ("Helps with frontend"), or longer than 1,024 chars.

A skill ships with a score of 4 or more. A score below 4 blocks a merge or
rewrite batch.

## 5. Trigger testing

Static checks cannot prove that the right skill is chosen. Test the
descriptions in a cluster together whenever one of them changes.

### 5.1 Build a query set

For each skill, write about 10 queries: 5 that should trigger it and 5 that
should not.

- **Should trigger:** vary phrasing (casual, terse, with file paths). Include
  cases that describe the need without naming the domain.
- **Should not trigger:** use **near-misses from sibling skills**, meaning
  queries that share keywords but belong elsewhere. "Add a Playwright test for
  login" is a near-miss for `testing-patterns`. Queries with no overlap test
  nothing.

Store the queries next to the audit that uses them, not inside the skill, so
that they are not installed into projects.

### 5.2 Run them

Install the cluster into a scratch project in link mode:

```bash
node bin/index.js install --path <scratch> --source . --link --profile <p>
```

Run each query three times from `<scratch>` in a fresh non-interactive
session. Record whether the target skill was loaded:

- Claude Code: `claude -p "<query>" --output-format stream-json --verbose`.
  The skill triggered if the stream contains a `Skill` tool call for it.
- Codex: `codex exec --json "<query>"`. The skill triggered if the events show
  it reading `.agents/skills/<name>/SKILL.md`.

Stop a run once the outcome is clear: either the skill was loaded, or work
started without it. Confirm the exact CLI flags against each tool's current
help before scripting this.

Test Claude Code with the plugins the user really runs, superpowers included,
because they share the listing budget and compete for selection.

### 5.3 Judge and iterate

- A should-trigger query passes when the skill loads in at least 2 of 3 runs.
  A should-not-trigger query passes when it loads in at most 1 of 3 runs.
- On failure, change the category of situation described. Do not paste the
  failed query's words into the description; that overfits.
- Keep a few queries aside and check them only at the end, to confirm the
  change generalises.
- Stop after about five iterations. If a pair of skills keeps swapping, the
  skills overlap: merge them or move the boundary instead of tuning words.

## 6. Relation to other files

- `docs/specs/2026-09-30-skill-audit.md`: the audit that motivated these rules
  and the batch plan that applies them.
- `agents/openai.yaml` `interface.short_description` is a UI blurb for Codex
  (25–64 chars). It does not affect selection and must not replace
  `description`.
- `scripts/check-template-consistency.mjs` should enforce the automatable
  checks in section 4. That is planned for batch 0 of the audit.

## Sources

- Agent Skills specification: <https://agentskills.io/specification>
- Optimizing skill descriptions: <https://agentskills.io/skill-creation/optimizing-descriptions>
- Claude Code skills: <https://code.claude.com/docs/en/skills>
- Anthropic skill authoring best practices: <https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices>
- Codex skills: <https://learn.chatgpt.com/docs/build-skills>
- Codex skill-creator sample: `codex-rs/skills/src/assets/samples/skill-creator/SKILL.md`
  in <https://github.com/openai/codex>
- OpenAI guidance on skills for newer models: <https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra>
