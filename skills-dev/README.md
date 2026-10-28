# Skills in development

Skills here are being written, maintained, or evaluated. The installer never
reads this folder and npm does not publish it, so nothing here reaches a
project, Claude Code, Codex, or Gemini.

| Skill | Status |
|---|---|
| `jev` | Waiting for an OpenRouter key; runner tested only against a local mock |
| `doc-distill` | Script tested on generated files only; see `doc-distill/STATUS.md` |
| `codebase-health-scan` | Script has 23 regression tests in `tests/`; skill text passed 1 Codex run and the trigger tests |

`evals/` holds the fixtures, runners, and latest results for
`codebase-health-scan` and the shipped `ambiguity-decisions` and
`structural-refactor` (now in `templates/skills/`, profile `core`).

## Try a skill locally

Link it into your personal Claude Code skills, and remove the link when done:

```bash
ln -s "$PWD/skills-dev/<name>" ~/.claude/skills/<name>
rm ~/.claude/skills/<name>
```

## Ship a skill

Move it to `templates/skills/`; for a Gemini-only skill, also list it in
`exclusiveSkills` of `templates/agents/gemini.json`. Then make it pass
`npm run check:templates`: the skill standard in
[`docs/skills/SKILL_STANDARD.md`](../docs/skills/SKILL_STANDARD.md), and
`agents/openai.yaml` for shared skills. Skills in this folder are not linted.
