# KIT-019 Evaluate Codex Hooks In Real Sessions

## Status

planned

## Lane

normal

## Product Contract

After 10-20 independent real Codex sessions use the lifecycle guard hooks, the
project can determine from recorded evidence whether each matcher is useful,
noisy, incomplete, or still lacks enough exposure to judge.

## Relevant Product Docs

- `docs/product/toolkits.md`
- `docs/stories/KIT-018-codex-hooks.md`
- `docs/CONTEXT_RULES.md`
- `docs/HARNESS_COMPONENTS.md`
- `docs/HARNESS_MATURITY.md`

## Acceptance Criteria

- Review between 10 and 20 new Codex sessions created after the current hook
  configuration is installed and trusted.
- Include a representative mix of non-code questions and `tiny`, `normal`, and
  `high-risk` repository tasks. Record gaps when a lane or matcher receives no
  meaningful exposure.
- For every session, record the prompt category, selected lane, tool names,
  files read, broad-read events, destructive or sensitive operations, hook
  warnings, agent response to each warning, and available token or tool-call
  counts.
- Manually review eligible tool calls so missed warnings can be counted instead
  of measuring only warnings that fired.
- Classify each warning as actionable, harmless but unnecessary, or incorrect.
  Do not treat a warning as useful merely because it fired.
- Compare the new sessions with the seven-session pre-evaluation baseline where
  prompts are reasonably comparable. Label token savings as a proxy when only
  file-read, output-size, or tool-call data is available.
- Produce per-matcher precision, missed-event count, warning frequency, and
  observed effect on agent behavior. Separate safety value from context-saving
  value.
- Assign each matcher one outcome: `keep`, `tune`, `remove`, or
  `insufficient-evidence`, with cited session evidence.
- Recommend `keep` when a matcher has at least one material safety catch or
  repeated actionable detections without recurring noise.
- Recommend `tune` when the underlying risk is real but precision is below 80%,
  eligible events are missed, or the warning does not lead to better behavior.
- Recommend `remove` only when the matcher creates recurring noise or harmful
  behavior and has no compensating safety value. Lack of exposure alone must
  result in `insufficient-evidence`.
- Record the evaluation as a Harness improvement outcome. Any matcher changes,
  blocking behavior, or policy changes require a separate scoped task and
  human review.

## Design Notes

- Evaluation unit: one fresh Codex session with one primary prompt.
- Target sample: 10 sessions minimum; stop at 20 unless a known matcher still
  needs a deliberately exercised scenario.
- Session evidence should be anonymized and must not copy secret values or
  sensitive file contents.
- Suggested per-session fields:
  `session_id`, `prompt_category`, `lane`, `tools_used`, `files_read`,
  `eligible_events`, `warnings`, `warning_outcomes`, `missed_events`,
  `tool_call_count`, `token_count_or_proxy`, and `notes`.
- Suggested aggregate metrics:
  `precision = actionable warnings / total warnings` and
  `detection rate = warned eligible events / total eligible events`.
- Context proxies include the number of broad reads, total files read, command
  output size when available, and tool-call count. They are not equivalent to
  token usage and must be reported separately.
- Keep warning-only behavior during evidence collection so the evaluation does
  not mix detection quality with a new enforcement policy.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Fixture tests for any matcher changes proposed in a follow-up story |
| Integration | Replay sampled tool payloads through `harness_guard.py` and compare expected warnings |
| E2E | Review 10-20 fresh session transcripts and the agent response to warnings |
| Platform | Confirm the active Codex runtime invokes the configured hook tool matchers |
| Release | Human-reviewed evaluation report with a disposition for every matcher |

## Harness Delta

This story closes the outcome loop for `KIT-018`: prediction is replaced with
measured session evidence before the hook rules are expanded, tightened, or
removed. It contributes evidence to the Harness observability, context
selection, failure attribution, and self-improvement responsibilities.

## Evidence

Pending completion of the 10-20-session evaluation.
