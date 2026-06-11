# Product Docs

This directory contains the living product contract for `hieund-ai-kit`.

Start with [overview.md](overview.md). Add smaller domain files only when a
change introduces a stable contract that does not belong in the overview.

## Update Rule

When behavior changes:

1. Update the affected product doc.
2. Update or create the story packet.
3. Update durable proof status with `scripts/bin/harness-cli story add` or
   `scripts/bin/harness-cli story update`.
4. Record a decision if the change affects architecture, scope, risk, or a
   previously settled product rule.
