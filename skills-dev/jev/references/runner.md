# Runner: scripts/decide.py

One request per run: build the payload, POST it once to the OpenRouter Decisions
API, and print a record. No retries, no model fallback, no truncation.

## Request file

```json
{
  "model": "typesafe/jev-1.13",
  "session_id": "triage-2026-10-07",
  "context": "Support queues: billing handles invoices and refunds; ...",
  "sources": [
    { "id": "T1", "location": "tickets/4812", "text": "I was charged twice for ..." },
    { "id": "T2", "location": "tickets/4813", "text": "The export button ..." }
  ],
  "questions": {
    "queue": {
      "instructions": "Which queue should handle ticket T1?",
      "choices": {
        "billing": "Invoices, charges, refunds",
        "product": "Bugs and feature behaviour",
        "other": "Fits none of the named queues",
        "unknown": "The ticket does not say enough to decide"
      }
    },
    "urgency": {
      "instructions": "How urgent is ticket T1?",
      "choices": {
        "low": "No user impact today",
        "medium": "One user blocked, workaround exists",
        "high": "Money lost or many users blocked",
        "unknown": "Not enough evidence"
      }
    },
    "most_relevant": {
      "instructions": "Which ticket is most likely about a duplicate charge?",
      "choices": "sources",
      "extra_choices": { "none": "No ticket is about a duplicate charge" }
    }
  }
}
```

| Field | Required | Meaning |
|---|---|---|
| `model` | no | Default `typesafe/jev-1.13` (pinned). `~typesafe/jev-latest` is an alias. |
| `context` | one of `context`/`sources` | Shared text or JSON every question sees. |
| `sources` | one of `context`/`sources` | Evidence items with a unique `id`, optional `location`, and `text`. |
| `questions` | yes | Question id → `instructions` and `choices`. Questions are answered independently. |
| `choices` | yes | Choice id → description (at least two), or `"sources"` to use the source ids, described by their `location`. |
| `extra_choices` | no | Added to `"sources"` choices, for example `none`. |
| `session_id` | no | Groups related requests in OpenRouter observability. |

Every question is sent as a `choice` question. For an ordinal band, name the
levels as choices with explicit anchors (`low`, `medium`, `high`). The API also
documents `noul` (yes/no probability) and `score` types; this runner does not
send them.

## Run

```bash
python3 ~/.claude/skills/jev/scripts/decide.py request.json --dry-run
python3 ~/.claude/skills/jev/scripts/decide.py request.json --record-dir .jev-records
cat request.json | python3 ~/.claude/skills/jev/scripts/decide.py -
```

- `--dry-run` prints the payload and an estimated token count; nothing is sent
  and no credential is needed. Use it to check a new packet shape.
- The credential is `OPENROUTER_API_KEY` from the environment.
- `--record-dir` also writes the record to a timestamped JSON file. Keep it out
  of version control if the evidence is private.

## Record

```json
{
  "recorded_at": "2026-10-07T10:00:00+0700",
  "request_sha256": "sha256:…",
  "source_sha256": { "T1": "sha256:…", "T2": "sha256:…" },
  "model_requested": "typesafe/jev-1.13",
  "model_returned": "typesafe/jev-1.13-20260917",
  "estimated_tokens": 412,
  "response_id": "…",
  "answers": {
    "queue": { "type": "choice", "choice": "billing", "confidence": 0.93,
               "probabilities": { "billing": 0.93, "product": 0.04, "other": 0.02, "unknown": 0.01 } }
  },
  "usage": { "input_tokens": 412, "output_tokens": 0, "cost": 0.000017 },
  "response": { "…": "full API response" }
}
```

Read `choice` together with `probabilities`: a close second choice is a reason
for main to look, whatever the top `confidence` says.

## Exit codes

| Code | Meaning | Record printed |
|---|---|---|
| 0 | Answers received | yes |
| 1 | HTTP, network, or response-parsing error (`error` holds the status and body) | yes |
| 2 | Invalid request file or missing `OPENROUTER_API_KEY` | no |
| 3 | Packet over about 32k tokens: split the sources into several requests | no |
| 4 | A pinned model came back as a different model | yes |

The size check estimates four characters per token, so treat it as a guard, not
an exact count. A failed request is not retried; decide whether to resend.
