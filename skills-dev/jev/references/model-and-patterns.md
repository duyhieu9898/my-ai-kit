# Jev: model facts and patterns

Facts below were collected on 2026-10-07 from OpenRouter and TypeSafe-related
pages (sources at the end). Prices and limits change; check the
[model page](https://openrouter.ai/typesafe/jev-1.13) before relying on them.

## Model

| Item | Value |
|---|---|
| Vendor | TypeSafe AI; released 2026-09-15 |
| Model ids | `typesafe/jev-1.13` (pinned; responses name a dated snapshot such as `typesafe/jev-1.13-20260917`), `~typesafe/jev-latest` (alias) |
| Endpoint | `POST https://openrouter.ai/api/alpha/decisions` (alpha; separate from chat completions) |
| Price | $0.042 per million input tokens; output tokens free (OpenRouter, 2026-09-21). A three-question, ~450-token ticket costs about $0.000019. |
| Context | 32k tokens on OpenRouter; TypeSafe documents 64k total with 32k for state plus the longest question |
| Input | Text only: a string, a JSON object, or an array of text. No images, audio, or video. |
| Question types | `choice` (named options), `score` (ordered levels), `noul` (yes/no probability). The runner sends `choice` only. |
| Output | Typed answers with probabilities. No text, explanation, or reasoning trace. |

## Vendor claims (not guarantees for your workflow)

- 40x–400x lower cost and 20x–200x lower latency than frontier
  autoregressive models on enterprise routing tasks; answers come from one
  parallel pass rather than token-by-token generation.
- Calibration: across many decisions, answers given 0.8 confidence are right
  about 80% of the time. This is an aggregate property, not a per-call
  guarantee, and it was measured on the vendor's data, not yours.

## Limitations

- No open-ended generation, visible reasoning, tool calls, or multi-step plans.
- No exact arithmetic, date math, or threshold comparisons: compute those in
  code and pass the result as evidence.
- Questions in one request are evaluated independently; one answer is never
  visible to another question.
- Alpha endpoint: request and response shapes may change.

## Worked patterns

**ROUTE: pick files before opening them.** Sources are file summaries or
search hits with ids; one question uses `"choices": "sources"` plus
`extra_choices: { "none": … }`. Open only the chosen file, and re-ask with new
evidence if it was wrong.

**TRIAGE + SCORE: one ticket, several independent questions.** Shared
`context` lists the queues; questions ask for queue, urgency band, and whether
essential details are missing (`complete` / `missing_details` / `unknown`).

**FILTER: screen a batch.** One request per coherent unit (a function with its
callers, a diff hunk with its file header), all asking the same question
("Does this change alter authorization behaviour?" `yes` / `no` / `unknown`).
Run a small representative batch first, read the usage, then scale with
bounded parallel calls. Sample some `no` answers when a miss would matter.

**AUDIT: check a property.** Supply the artifact and the property definition;
choices `exhibits` / `does_not_exhibit` / `unknown`. Main verifies every
`exhibits` before acting.

**Speculative fan-out.** When the next step depends on a branch main has not
chosen yet, include the questions for each branch in one request and use only
the answers for the branch actually taken.

## Sources

- [What Is Jev? (OpenRouter blog)](https://openrouter.ai/blog/insights/what-is-jev/)
- [Jev tutorial (OpenRouter docs)](https://openrouter.ai/docs/guides/community/jev-tutorial)
- [DecisionsRequest reference (OpenRouter SDK docs)](https://openrouter.ai/docs/client-sdks/typescript/models/decisionsrequest.md)
