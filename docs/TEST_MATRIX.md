# Test Matrix

This file maps product behavior to proof.

The CLI already has implemented behavior, but no Harness story proof has been
imported yet. Use `scripts/bin/harness-cli query matrix` as the durable source
of truth and add rows only when a story has executable evidence.

## Status Values

| Status | Meaning |
| --- | --- |
| planned | Accepted as intended behavior, not implemented |
| in_progress | Actively being built |
| implemented | Implemented and proof exists |
| changed | Contract changed after earlier implementation |
| retired | No longer part of the product contract |

## Matrix

| Story | Contract | Unit | Integration | E2E | Platform | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| KIT-001 | Stable CLI command surface | no | yes | no | yes | implemented | CLI syntax and help commands |
| KIT-002 | Publish both toolkit modes | no | yes | no | yes | implemented | npm package manifest |
| KIT-003 | Preserve instruction scopes | yes | yes | no | yes | implemented | source assertions and package manifest |
| KIT-004 | Report installation status | no | yes | no | yes | implemented | status help and source contract |
| KIT-005 | Ship validated Backlog skill | yes | yes | no | yes | implemented | 75 offline tests |

## Evidence Rules

- Unit proof covers pure domain and application rules.
- Integration proof covers backend enforcement, data integrity, provider
  behavior, jobs, or service contracts.
- E2E proof covers user-visible browser flows.
- Platform proof covers only shell, deployment, mobile, desktop, or runtime
  behavior that cannot be proven in lower layers.
- A story can be implemented without every proof column if the story packet
  explains why.
