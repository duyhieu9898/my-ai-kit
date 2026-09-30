# 0016 Portable Skill Authoring Standard

Date: 2026-09-30

## Status

Accepted. Replaces `docs/skills/CODEX_SKILL_STANDARD.md`,
`docs/skills/ANTIGRAVITY_SKILL_STANDARD.md`, and
`docs/skills/ANTIGRAVITY_CODEX_SKILL_CONVERSION.md`.

## Context

ADR 0015 made `templates/.agents/skills/` the single skill source. The old
standards were written for two diverged copies and contain rules that are now
wrong:

- `agents/openai.yaml` is described as a required sidecar.
- They tell you to convert skills between tools.
- They state wrong `openai.yaml` limits.

The 2026-09-30 audit (`docs/specs/2026-09-30-skill-audit.md`) also found:

- 40 of 43 skills pre-approve `Write`, `Edit`, or `Bash` through
  `allowed-tools`.
- The descriptions total 11,678 chars, above Codex's 8,000-char fallback
  listing budget.
- Much of the skill content is textbook knowledge or persona text.

## Decision

- **One standard.** `docs/skills/SKILL_STANDARD.md` is the only authoring
  standard, and `docs/skills/DESCRIPTION_GUIDE.md` governs descriptions.
- **Targets and base.** The standard targets Claude Code and Codex, on top of
  the open Agent Skills specification. Antigravity uses the same files with no
  skill-specific work.
- **Frontmatter** is `name` and `description` only:
  - No `allowed-tools` and no Claude Code-only keys.
  - The only exception is an explicit-only skill. It sets
    `disable-model-invocation: true` in `SKILL.md` and
    `policy.allow_implicit_invocation: false` in `agents/openai.yaml`.
- **`agents/openai.yaml`** stays for every skill, as Codex UI metadata:
  - `display_name`, a 25–64 char `short_description`, and a `default_prompt`
    sentence that mentions `$<name>`.
  - No redundant `allow_implicit_invocation: true`.
- **Body.** `SKILL.md` has at most 200 lines of knowledge the model lacks.
  Script paths start at the project root, and verification is delegated to
  `verify-changes`.
- **Enforcement.** `scripts/check-template-consistency.mjs` enforces the
  automatable rules:
  - The rules report warnings at first.
  - `--strict` turns them into failures.
  - Strict becomes the default once the audit's rewrite batches are done.

## Alternatives Considered

1. **Adopt Codex's conventions wholesale.** Rejected: Codex's own validator
   rejects the spec field `compatibility`, and its runtime is looser than the
   spec.
2. **Use Claude Code's extended frontmatter** (`when_to_use`, `context`,
   `paths`…). Rejected: the behaviour would diverge between tools, and the
   files would no longer upload to claude.ai or the Skills API.
3. **Delete `agents/openai.yaml`.** Rejected: Codex is a target tool, and the
   file costs nothing in the other tools.
4. **Enforce every rule as a failure immediately.** Rejected: 43 skills would
   fail before the rewrite batches run.

## Consequences

Positive:

- One file per skill works on all target tools.
- Skills no longer widen permissions silently.
- The shared listing budget has room for the kit and the user's plugins.
- Audits have a written, partly automated rubric.

Tradeoffs:

- Explicit-only skills need two switches and still auto-trigger on
  Antigravity, so their bodies must gate side effects.
- Warnings are noisy until the rewrite batches finish.

## Follow-Up

- Rewrite and merge skills in the batches of the 2026-09-30 audit.
- Make `--strict` the default in `npm run check:templates` after the last
  batch.
