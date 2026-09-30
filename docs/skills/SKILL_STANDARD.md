# Kit Skill Standard

The authoring standard for every skill in `templates/.agents/skills/`. It
replaces `CODEX_SKILL_STANDARD.md`, `ANTIGRAVITY_SKILL_STANDARD.md`, and
`ANTIGRAVITY_CODEX_SKILL_CONVERSION.md`, which predate the single skill source
(ADR 0015). The decision is recorded in ADR 0016.

Use it to create, merge, rewrite, or review a skill. The `description` field
has its own guide: [DESCRIPTION_GUIDE.md](DESCRIPTION_GUIDE.md).

## 1. Scope and targets

- **Target tools:** Claude Code and Codex. Antigravity (and Gemini CLI) read
  the same `.agents/skills/<name>/SKILL.md` and need only `name` and
  `description`. A skill that meets this standard works there without extra
  work. Nothing in a skill is written for Antigravity alone.
- **Base format:** the open [Agent Skills specification](https://agentskills.io/specification).
  All four tools say they implement it.
- **Discovery:** Codex and Antigravity read `.agents/skills/` natively.
  Claude Code only reads `.claude/skills/`, so the installer's
  `.claude/skills/<name>` symlinks are required, not optional.

## 2. Folder layout

```text
templates/.agents/skills/<name>/
├── SKILL.md            # required
├── agents/openai.yaml  # Codex UI metadata (section 6)
├── references/         # optional: material needed for one branch of the work
├── scripts/            # optional: deterministic, repeatable checks
└── assets/             # optional: templates or sample files the skill copies
```

- Do not commit empty folders, `__pycache__`, README, CHANGELOG, or install
  notes inside a skill.
- `references/` is one level deep. Every file in it is linked from `SKILL.md`.

## 3. Frontmatter

```yaml
---
name: webapp-testing
description: >-
  Writes, debugs, and stabilizes Playwright end-to-end tests for web apps.
  Use when adding a browser test, fixing a flaky or failing E2E run, or
  reviewing a Playwright suite. Not for unit or integration tests (use
  testing-patterns).
---
```

- **Only `name` and `description`.** Both Claude Code and Codex read these two
  keys, and they are the only keys every target agrees on.
- **`name`** equals the folder name: lowercase letters, digits, and single
  hyphens, at most 64 chars, and never containing `claude` or `anthropic`.
- **`description`** follows [DESCRIPTION_GUIDE.md](DESCRIPTION_GUIDE.md):
  150–300 chars (hard limit 400), a capability sentence, then `Use when …`,
  and at most one `Not for … (use <skill>)`.
- **No `allowed-tools`.** Claude Code pre-approves the listed tools without a
  workspace-trust check; Codex ignores the key. Granting `Write`, `Edit`, or
  `Bash` in a shared kit silently widens permissions for every user.
- **No Claude Code-only keys** (`when_to_use`, `argument-hint`, `context`,
  `agent`, `paths`, `hooks`, `model`, `effort`…). They change behaviour in
  one tool only, and claude.ai or Skills API uploads reject them as a hard
  error.
- **One exception: explicit-only skills.** A skill that must run only when the
  user names it (for example, one with production side effects) needs both
  switches, because each tool ignores the other's:

  ```yaml
  # SKILL.md frontmatter (Claude Code)
  disable-model-invocation: true
  # agents/openai.yaml (Codex)
  policy:
    allow_implicit_invocation: false
  ```

  Use it only with a stated reason in the body. On Antigravity the skill is
  still auto-invocable, so the body must gate its side effects anyway.

## 4. Body

**Length.** At most 200 lines, target 60–120. The spec allows 500, but Claude
Code keeps only the first 5,000 tokens of a skill after compaction, and Codex
tells the model to read the whole file every time it is used.

**Content: only what the model does not already know.**

- Include:
  - kit or repository conventions (paths, naming, where plans or ADRs go)
  - exact commands and bundled script paths
  - real pitfalls and version-specific facts
  - a definition of done
- Exclude:
  - textbook material (test pyramid, AAA, 5 Whys, SOLID, UX laws)
  - framework menus
  - persona text ("You are…", "Your mindset")
  - motivational rules

**Defaults, not menus.** Write "follow the project's existing X; if there is
none, use Y" instead of a table of five options.

**Strictness matches risk.**

- For operations that are fragile or have side effects (deploys, deletes,
  migrations), give exact commands and a confirmation gate.
- For open-ended work (design, review), give heuristics and the reason behind
  each one. Avoid stacks of all-caps MUST/NEVER.

**Project authority wins.** A skill never overrides the project's `AGENTS.md`
or `CLAUDE.md`. That means:

- no mandatory clarification gates;
- no rule to run every validator after every change;
- no hard-coded `npm run …` when the project's own commands differ.

Verification is delegated to `verify-changes` instead of each skill carrying
its own "Quality Control Loop".

**Portable Markdown only.** Do not use `$ARGUMENTS`, `` !`cmd` ``, or
`${CLAUDE_SKILL_DIR}`. They work only in Claude Code; Codex reads them as
literal text.

**Suggested outline** (use only the parts that apply):

1. one paragraph of purpose
2. defaults and conventions
3. procedure
4. pitfalls
5. done when

Drop the old scaffolding: Content Map, Related Skills, Your Mindset, Quality
Audit Checklist, and emoji headings. Link to another skill inline, at the step
where it is needed.

## 5. Supporting files

### references/

- **When to split:** a topic is needed only for one branch of the work (for
  example, the Playwright rules, or the Next.js performance rules), or
  `SKILL.md` would pass 200 lines.
- **Linking:** link each file with the condition for reading it. Example:
  "Read `references/playwright-rules.md` before writing or changing a test."
- **Table of contents:** add one at the top of any reference longer than 100
  lines.

### scripts/

Scripts are only for deterministic, repeatable checks: i18n keys, SEO tags,
schema lint, type coverage, and similar.

- **Path in `SKILL.md`:** write every script path from the project root, e.g.
  `python3 .agents/skills/<name>/scripts/x.py <path>`.
  - The agent runs commands from the project root, not from the skill folder.
  - `.agents/skills/<name>/` is a real directory in every install; Claude Code
    reaches it through the symlink.
- **Run or read:** say which. The usual line is: "Run it; do not read the
  source."
- **Every script:**
  - parses `--help` with argparse;
  - exits non-zero when it finds problems;
  - prints short, model-readable output;
  - never installs packages or calls the network unless a flag asks for it.
- **Regression tests:** a script called by `.agents/scripts/checklist.py` or
  `verify_all.py` has a regression test under `scripts/test-*.py`.

### assets/

Templates and sample files the skill copies into a project. Do not store
documentation here.

## 6. agents/openai.yaml

This file is Codex UI metadata. Claude Code, Gemini, and Antigravity ignore
it. It does not affect skill selection, which uses `name` and `description`.
Every skill keeps one, so the Codex skill list looks consistent:

```yaml
interface:
  display_name: "Web App Testing"
  short_description: "Write and stabilize Playwright E2E tests"
  default_prompt: "Use $webapp-testing to add an E2E test for the checkout flow."
```

- **`short_description`:** 25–64 chars.
- **`default_prompt`:** one example sentence that mentions `$<name>`. Not just
  `"$<name>"`.
- **`policy`:** add it only for explicit-only skills (section 3). Never write
  `allow_implicit_invocation: true`, because that is the default.
- **`dependencies.tools`:** add it only when the skill needs an MCP server.
- **Other keys:** no `brand_color`, icons, or other decorative keys unless the
  kit ships the assets they point to.

Sources: [Codex skills](https://learn.chatgpt.com/docs/build-skills) and the
Codex skill-creator sample
(`codex-rs/skills/src/assets/samples/skill-creator/references/openai_yaml.md`).

## 7. Merging, renaming, and removing skills

Removing or renaming a skill is a breaking change for installed projects:

- A project that selected `all` loses the skill with a warning. Its managed
  copy is removed; a locally modified copy is kept.
- A project that named the skill explicitly has the name pruned from its
  selection, with a warning.

In the same change, update every caller:

- `templates/.agents/ARCHITECTURE.md`: the skill count, which the checker
  compares with the number of skill folders, and the skill list.
- `templates/AGENTS.md`, `templates/CLAUDE.md`, `templates/GEMINI.md`
- `templates/kit.json` profiles
- script paths in `.agents/scripts/checklist.py` and `verify_all.py`
- `scripts/test-installer.mjs` and `test/` fixtures
- links from other skills

When merging, keep the skill that owns the scripts, so script paths stay the
same. Bump the package major version when a release removes or renames
skills.

## 8. Validation

```bash
npm run check:templates                                   # warnings for this standard
node scripts/check-template-consistency.mjs --strict      # warnings become failures
```

`check-template-consistency.mjs` enforces the automatable parts of this
standard and of the description guide:

- frontmatter keys
- name and folder
- description rules
- body length
- Claude-only body syntax
- empty or cache folders
- `openai.yaml` fields

Some checks are hard failures: missing frontmatter, a name that differs from
its folder, a missing description, a description over 1,024 chars, a missing
`openai.yaml`, and broken links. Every other check of this standard reports a
warning until the audit's rewrite batches finish, and then `--strict` becomes
the default.

Checks that stay manual:

- Is the content something the model does not already know?
- Is the skill distinct from its siblings? Run the trigger tests in
  [DESCRIPTION_GUIDE.md](DESCRIPTION_GUIDE.md#5-trigger-testing).
- Do the bundled scripts actually catch the problems they claim to?
