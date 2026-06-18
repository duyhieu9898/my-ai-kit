# Session Trace

Read or list trace files with:

```bash
python3 scripts/backlog.py journal list
python3 scripts/backlog.py journal read <filename>
```

Record an AI interaction only when session tracing is required:

```bash
python3 -c "import json,sys; sys.stdout.write(json.dumps({'userRequest': '<verbatim user message>', 'aiResponse': '<verbatim response>'}))" \
  | python3 scripts/backlog.py journal log-ai \
      --command "<group:action>" \
      --stdin \
      --issue-key "<key>"
```

Use these rules:

- Record traces only for `issue`, `bug`, and `story` commands.
- Preserve the user request and response verbatim.
- Use command names such as `issue:list`, `bug:context`, or `story:overview`.
- Omit `--issue-key` when no single issue is central.
- Never call `journal log-ai` recursively.
- Treat trace files as potentially sensitive runtime data and do not commit them.
