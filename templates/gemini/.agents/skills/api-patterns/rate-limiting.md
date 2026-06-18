# Rate Limiting Principles

> Protect your API from abuse and overload.

## Why Rate Limit

```
Protect against:
├── Brute force attacks
├── Resource exhaustion
├── Cost overruns (if pay-per-use)
└── Unfair usage
```

## Strategy Selection

| Type | How | When |
|------|-----|------|
| **Token bucket** | Burst allowed, refills over time | Most APIs |
| **Sliding window** | Smooth distribution | Strict limits |
| **Fixed window** | Simple counters per window | Basic needs |

## Response Headers

```
When exposing limit state:
├── Prefer the standardized RateLimit fields when supported
├── Keep legacy X-RateLimit-* fields only for compatibility
├── Return 429 when the active policy rejects a request
└── Include Retry-After when the retry time is known
```
