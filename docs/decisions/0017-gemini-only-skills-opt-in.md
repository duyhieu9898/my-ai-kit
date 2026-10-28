# 0017 Gemini-Only Skills Are Opt-In and Share `.agents/skills`

Date: 2026-10-28

## Status

Superseded by ADR 0018, which replaces `templates/gemini-skills/` and
`--gemini` with per-agent install configs. Amended ADR 0015.

## Context

Pre-release 5.0 builds installed nine Gemini-only skills into `.agent/skills/`
so that Codex and Claude Code would not see them. The kit docs claimed this was
Antigravity's own folder and that it won on a name clash. The Antigravity docs
(https://antigravity.google/docs/skills/) say otherwise: the workspace folder is
`.agents/skills/`, `.agent/skills/` is kept only for backward compatibility,
and no precedence between folders is documented. The Gemini-only channel
therefore rested on a legacy path that can be dropped without notice.

## Decision

- Gemini-only skills ship from `templates/gemini-skills/` and install into
  `.agents/skills/` next to the shared skills. The kit writes nothing to
  `.agent/`.
- They install only when asked for: `install --gemini` sets `selection.gemini`,
  which lets `--all` and profiles include them; a name on the command line
  always installs. `remove --gemini` clears the flag.
- `managedSkills` holds every kit skill; a Gemini-only record carries
  `scope: "gemini"`, and only shared skills get a `.claude/skills/` link.
- A skill name may ship from only one template folder; the registry rejects a
  duplicate.
- Manifests that still record `managedGeminiSkills` keep Gemini on; the next run
  reinstalls those skills in `.agents/skills/`, deletes the kit's unmodified
  copies in `.agent/skills/`, and warns about modified ones.

## Alternatives Considered

1. Install them into `.agents/skills/` for everyone and set
   `allow_implicit_invocation: false` for Codex. Codex docs do not say whether
   the description still loads into context, and Codex would still list them.
2. Install them into `.agents/skills/` for everyone. Codex sees and may pick
   skills it does not need.
3. Delete the Gemini-only skills. Gemini loses the extra guidance.

## Consequences

Positive:

- No dependence on a legacy Antigravity path.
- Projects that do not use Gemini get a smaller skill set by default.

Tradeoffs:

- In a project installed with `--gemini`, Codex also sees the Gemini-only
  skills.
- `install` with no arguments now installs 12 skills instead of 21; Gemini
  users must add `--gemini`.
- A Gemini-specific override of a shared skill is no longer possible.

## Follow-Up

- None.
